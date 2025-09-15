import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase/public-client'

const QuerySchema = z.object({
	q: z.string().trim().optional(),
	departamentoId: z.string().uuid().optional(),
	universidadId: z.string().uuid().optional(),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	offset: z.coerce.number().int().min(0).default(0),
})

type Row = {
	id: string
	nombre_completo: string
	departamento: string
	universidad: string
	calificacion_promedio: number | null
	cantidad_resenas: number
}

type MateriaRow = { materia_id: string; nombre: string }

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))
	if (!parsed.success) {
		return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
	}
	const { q, departamentoId, universidadId, limit, offset } = parsed.data

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

	const { data, error } = await query
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 })
	}

	// Materias activas por profesor
	const ids = (data || []).map((d) => d.id)
	let materiasPorProfesor = new Map<string, MateriaRow[]>()
	if (ids.length) {
		const { data: mrows, error: mErr } = await supabasePublic
			.from('v_profesores_materias_activas')
			.select('profesor_id, materia_id, nombre')
			.in('profesor_id', ids)
		if (!mErr && mrows) {
			for (const r of mrows as any[]) {
				const arr = materiasPorProfesor.get(r.profesor_id) || []
				arr.push({ materia_id: r.materia_id, nombre: r.nombre })
				materiasPorProfesor.set(r.profesor_id, arr)
			}
		}
	}

	// Estadísticas por profesor
	let stats = new Map<string, { calificacion_promedio: number | null; cantidad_resenas: number }>()
	if (ids.length) {
		const { data: srows } = await supabasePublic
			.from('v_profesores_estadisticas')
			.select('profesor_id, calificacion_promedio, cantidad_resenas')
			.in('profesor_id', ids)
		for (const r of srows || []) {
			stats.set((r as any).profesor_id, {
				calificacion_promedio: (r as any).calificacion_promedio,
				cantidad_resenas: (r as any).cantidad_resenas,
			})
		}
	}

	const out = (data || []).map((row: any) => {
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