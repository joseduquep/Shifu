import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase/public-client'

const ParamsSchema = z.object({ id: z.string().uuid() })

type MateriaRow = { materia_id: string; nombre: string }
type StatRow = {
	profesor_id: string
	calificacion_promedio: number | null
	cantidad_resenas: number
}
type SerieRow = {
	semestre_codigo: string
	calificacion_promedio: number | string
	cantidad_resenas: number
}

type ResenaRow = {
	id: string
	rating: number
	comentario: string | null
	semestre_codigo: string
	anonimo: boolean
	materias?: { id?: string; nombre?: string } | null
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	const { id } = await ctx.params
	const parsed = ParamsSchema.safeParse({ id })
	if (!parsed.success) {
		return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
	}

	const { data, error } = await supabasePublic
		.from('profesores')
		.select(
			'id, nombre_completo, bio, departamentos:departamento_id ( id, nombre, universidades:universidad_id ( id, nombre ) )'
		)
		.eq('id', id)
		.single()

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
	if (!data) {
		return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
	}

	// Stats
	const { data: srow } = await supabasePublic
		.from('v_profesores_estadisticas')
		.select('profesor_id, calificacion_promedio, cantidad_resenas')
		.eq('profesor_id', id)
		.single()

	const { data: materias } = await supabasePublic
		.from('v_profesores_materias_activas')
		.select('materia_id, nombre')
		.eq('profesor_id', id)

	const { data: series } = await supabasePublic
		.from('v_profesores_ratings_por_semestre')
		.select('semestre_codigo, calificacion_promedio, cantidad_resenas')
		.eq('profesor_id', id)
		.order('semestre_codigo', { ascending: true })

	// Reseñas públicas recientes
	const { data: resenas } = await supabasePublic
		.from('resenas')
		.select('id, rating, comentario, semestre_codigo, anonimo, materias:materia_id ( id, nombre )')
		.eq('profesor_id', id)
		.order('created_at', { ascending: false })
		.limit(20)

	return NextResponse.json({
		id: data.id,
		nombreCompleto: data.nombre_completo,
		bio: data.bio ?? null,
		departamento: data.departamentos?.[0]?.nombre ?? '',
		universidad: data.departamentos?.[0]?.universidades?.[0]?.nombre ?? '',
		materias: ((materias as MateriaRow[] | null) ?? []).map((m) => ({ id: m.materia_id, nombre: m.nombre })),
		calificacionPromedio: (srow as StatRow | null)?.calificacion_promedio ?? null,
		cantidadResenas: (srow as StatRow | null)?.cantidad_resenas ?? 0,
		ratingsPorSemestre: ((series as SerieRow[] | null) ?? []).map((s) => ({ semestre: s.semestre_codigo, rating: Number(s.calificacion_promedio) })),
		resenasPublicas: ((resenas as ResenaRow[] | null) ?? []).map((r) => ({
			id: r.id,
			rating: Number(r.rating),
			comentario: r.comentario,
			semestre: r.semestre_codigo,
			anonimo: r.anonimo,
			materia: r.materias?.nombre ?? null,
		}))
	})
}