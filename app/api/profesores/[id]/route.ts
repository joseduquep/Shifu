import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase/public-client'

const ParamsSchema = z.object({ id: z.string().uuid() })

type MateriaRow = { 
  materia_id: string
  materia_nombre: string
  departamento_id: string
  departamento_nombre: string
}
// Eliminado: StatRow, SerieRow, ResenaRow ya no son necesarios sin reseñas

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

	// Obtener materias activas del profesor con información del departamento
	const { data: materias } = await supabasePublic
		.from('v_profesores_materias_activas')
		.select('materia_id, materia_nombre, departamento_id, departamento_nombre')
		.eq('profesor_id', id)

	// Eliminado: Stats, series y reseñas ya no son necesarios

	return NextResponse.json({
		id: data.id,
		nombreCompleto: data.nombre_completo,
		bio: data.bio ?? null,
		departamento: data.departamentos?.nombre ?? '',
		universidad: data.departamentos?.universidades?.nombre ?? '',
		materias: ((materias as MateriaRow[] | null) ?? []).map((m) => ({ 
			id: m.materia_id, 
			nombre: m.materia_nombre,
			departamento: m.departamento_nombre,
			departamento_id: m.departamento_id
		})),
		// Eliminado: calificacionPromedio, cantidadResenas, ratingsPorSemestre, resenasPublicas
	})
}