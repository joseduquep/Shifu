import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase/public-client'

const QuerySchema = z.object({
	q: z.string().trim().optional(),
	departamentoId: z.string().uuid().optional(),
	universidadId: z.string().uuid().optional(),
	materiaId: z.string().uuid().optional(),
	semestreCodigo: z.string().trim().regex(/^[0-9]{4}-(1|2)$/).optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	offset: z.coerce.number().int().min(0).default(0),
})


type MateriaRow = { materia_id: string; nombre: string }

type MateriaActivaRow = { profesor_id: string; materia_id: string; nombre: string }

type StatsRow = { profesor_id: string; calificacion_promedio: number | null; cantidad_resenas: number }

type ProfesorRow = {
	id: string
	nombre_completo: string
	departamentos?: {
		nombre?: string
		universidades?: { nombre?: string } | null
	} | null
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))
	if (!parsed.success) {
		return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
	}
	const { q, departamentoId, universidadId, materiaId, semestreCodigo, limit, offset } = parsed.data

	// Construimos consulta SQL para aprovechar vistas y filtros
	// Nota: usamos RPC vía SQL raw con execute de supabase-js v2 (PostgREST: rpc o embed). Aquí usamos SQL con .from + .select cuando es posible.
	// Primero: profesores + departamentos + universidades
	const base = supabasePublic
		.from('profesores')
		.select(
			'id, nombre_completo, departamentos:departamento_id ( id, nombre, universidades:universidad_id ( id, nombre ) )'
		,
			{ count: 'exact' }
		)
		.range(offset, offset + limit - 1)

	let query = base

	if (departamentoId) {
		query = query.eq('departamento_id', departamentoId)
	}
	if (universidadId) {
		query = query.eq('departamentos.universidad_id', universidadId)
	}
	if (q) {
		query = query.ilike('nombre_completo', `%${q}%`)
	}

	// Filtro por materia activa: intersectar contra relación activa
	if (materiaId) {
		const { data: pids, error: perr } = await supabasePublic
			.from('profesores_materias')
			.select('profesor_id')
			.eq('materia_id', materiaId)
			.eq('activo', true)
		const allowed = Array.from(new Set((pids || []).map((r: any) => r.profesor_id)))
		if (perr) {
			return NextResponse.json({ error: perr.message }, { status: 500 })
		}
		if (allowed.length === 0) {
			return NextResponse.json({ items: [], count: 0 })
		}
		query = query.in('id', allowed)
	}

	// Filtro por semestre: profesores con reseñas en ese semestre (usamos vista de ratings por semestre)
	if (semestreCodigo) {
		const { data: sids, error: serr } = await supabasePublic
			.from('v_profesores_ratings_por_semestre')
			.select('profesor_id')
			.eq('semestre_codigo', semestreCodigo)
		const allowed = Array.from(new Set((sids || []).map((r: any) => r.profesor_id)))
		if (serr) {
			return NextResponse.json({ error: serr.message }, { status: 500 })
		}
		if (allowed.length === 0) {
			return NextResponse.json({ items: [], count: 0 })
		}
		query = query.in('id', allowed)
	}

	const { data, error } = await query
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 })
	}

	// Materias activas por profesor
	const ids = (data || []).map((d) => d.id)
	const materiasPorProfesor = new Map<string, MateriaRow[]>()
	if (ids.length) {
		const { data: mrows, error: mErr } = await supabasePublic
			.from('v_profesores_materias_activas')
			.select('profesor_id, materia_id, nombre')
			.in('profesor_id', ids)
		if (!mErr && mrows) {
			for (const r of (mrows as MateriaActivaRow[])) {
				const arr = materiasPorProfesor.get(r.profesor_id) || []
				arr.push({ materia_id: r.materia_id, nombre: r.nombre })
				materiasPorProfesor.set(r.profesor_id, arr)
			}
		}
	}

	// Estadísticas por profesor
	const stats = new Map<string, { calificacion_promedio: number | null; cantidad_resenas: number }>()
	if (ids.length) {
		const { data: srows } = await supabasePublic
			.from('v_profesores_estadisticas')
			.select('profesor_id, calificacion_promedio, cantidad_resenas')
			.in('profesor_id', ids)
		for (const r of ((srows as StatsRow[] | null) ?? [])) {
			stats.set(r.profesor_id, {
				calificacion_promedio: r.calificacion_promedio,
				cantidad_resenas: r.cantidad_resenas,
			})
		}
	}

	const rows: ProfesorRow[] = (data ?? []) as ProfesorRow[]
	const out = rows.map((row) => {
		const st = stats.get(row.id) || { calificacion_promedio: null, cantidad_resenas: 0 }
		return {
			id: row.id,
			nombreCompleto: row.nombre_completo,
			departamento: row.departamentos?.nombre ?? '',
			universidad: row.departamentos?.universidades?.nombre ?? '',
			materias: (materiasPorProfesor.get(row.id) || []).map((m) => m.nombre),
			calificacionPromedio: st.calificacion_promedio,
			cantidadResenas: st.cantidad_resenas,
		}
	})

	return NextResponse.json({ items: out, count: out.length })
}