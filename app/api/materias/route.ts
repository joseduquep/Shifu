import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase/public-client'

const Query = z.object({ departamentoId: z.string().uuid().optional() })

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const parsed = Query.safeParse(Object.fromEntries(searchParams))
	if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
	const { departamentoId } = parsed.data

	let q = supabasePublic.from('materias').select('id, nombre, departamento_id').order('nombre')
	if (departamentoId) q = q.eq('departamento_id', departamentoId)
	const { data, error } = await q
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json((data || []).map((m) => ({ id: m.id, nombre: m.nombre, departamentoId: m.departamento_id })))
}