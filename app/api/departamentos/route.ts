import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase/public-client'

const Query = z.object({ universidadId: z.string().uuid().optional() })

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const parsed = Query.safeParse(Object.fromEntries(searchParams))
	if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
	const { universidadId } = parsed.data

	let q = supabasePublic.from('departamentos').select('id, nombre, universidad_id').order('nombre')
	if (universidadId) q = q.eq('universidad_id', universidadId)
	const { data, error } = await q
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json((data || []).map((d) => ({ id: d.id, nombre: d.nombre, universidadId: d.universidad_id })))
}