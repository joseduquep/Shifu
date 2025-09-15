import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase/public-client'

const QuerySchema = z.object({
	scope: z.enum(['global', 'universidad', 'departamento']).default('global'),
	universidadId: z.string().uuid().optional(),
	departamentoId: z.string().uuid().optional(),
	limit: z.coerce.number().int().min(1).max(50).default(10),
	offset: z.coerce.number().int().min(0).default(0),
})

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))
	if (!parsed.success) {
		return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
	}
	const { scope, universidadId, departamentoId, limit, offset } = parsed.data

	let query = supabasePublic
		.from('profesores')
		.select(
			'id, nombre_completo, departamentos:departamento_id ( id, nombre, universidades:universidad_id ( id, nombre ) )'
		)
		.range(offset, offset + limit - 1)

	if (scope === 'universidad') {
		if (!universidadId) {
			return NextResponse.json({ error: 'universidadId requerido' }, { status: 400 })
		}
		query = query.eq('departamentos.universidad_id', universidadId)
	}
	if (scope === 'departamento') {
		if (!departamentoId) {
			return NextResponse.json({ error: 'departamentoId requerido' }, { status: 400 })
		}
		query = query.eq('departamento_id', departamentoId)
	}

	const { data, error } = await query
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 })
	}

	// Stats para ranking y ordenamiento en memoria (ya que no embebemos)
	const ids = (data || []).map((d) => d.id)
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

	const sorted = (data || []).slice().sort((a: any, b: any) => {
		const sa = stats.get(a.id) || { calificacion_promedio: null, cantidad_resenas: 0 }
		const sb = stats.get(b.id) || { calificacion_promedio: null, cantidad_resenas: 0 }
		const aAvg = sa.calificacion_promedio ?? -1
		const bAvg = sb.calificacion_promedio ?? -1
		if (aAvg !== bAvg) return bAvg - aAvg
		return (sb.cantidad_resenas || 0) - (sa.cantidad_resenas || 0)
	})

	const out = sorted.map((row: any) => {
		const st = stats.get(row.id) || { calificacion_promedio: null, cantidad_resenas: 0 }
		return {
			id: row.id,
			nombreCompleto: row.nombre_completo,
			departamento: row.departamentos?.nombre ?? '',
			universidad: row.departamentos?.universidades?.nombre ?? '',
			calificacionPromedio: st.calificacion_promedio,
			cantidadResenas: st.cantidad_resenas,
		}
	})

	return NextResponse.json({ items: out, count: out.length })
}