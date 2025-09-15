import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase/public-client'

const ParamsSchema = z.object({ id: z.string().uuid() })

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

	return NextResponse.json({
		id: data.id,
		nombreCompleto: data.nombre_completo,
		bio: data.bio ?? null,
		departamento: data.departamentos?.nombre ?? '',
		universidad: data.departamentos?.universidades?.nombre ?? '',
		materias: (materias || []).map((m: any) => ({ id: m.materia_id, nombre: m.nombre })),
		calificacionPromedio: (srow as any)?.calificacion_promedio ?? null,
		cantidadResenas: (srow as any)?.cantidad_resenas ?? 0,
		ratingsPorSemestre: (series || []).map((s: any) => ({ semestre: s.semestre_codigo, rating: Number(s.calificacion_promedio) })),
	})
}