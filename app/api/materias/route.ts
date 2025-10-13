import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase/public-client'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

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

const Body = z.object({ nombre: z.string().trim().min(2).max(120), departamentoId: z.string().uuid().optional() })

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = Body.safeParse(json || {})
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const nombre = parsed.data.nombre
  const departamentoId = parsed.data.departamentoId ?? null

  // Buscar existente (case-insensitive) por nombre y, si se pasó, por departamento
  let query = supabaseAdmin.from('materias').select('id, nombre, departamento_id').ilike('nombre', nombre).limit(1)
  if (departamentoId) query = query.eq('departamento_id', departamentoId)
  const found = await query
  if (found.data && found.data[0]) {
    return NextResponse.json({ id: found.data[0].id, nombre: found.data[0].nombre, departamentoId: found.data[0].departamento_id })
  }

  const { data, error } = await supabaseAdmin
    .from('materias')
    .insert({ nombre, departamento_id: departamentoId })
    .select('id, nombre, departamento_id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, nombre: data.nombre, departamentoId: data.departamento_id }, { status: 201 })
}