import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase/public-client'

const Query = z.object({ q: z.string().trim().min(1), limit: z.coerce.number().int().min(1).max(20).default(10) })

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsed = Query.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  const { q, limit } = parsed.data
  const { data, error } = await supabasePublic
    .from('materias')
    .select('id, nombre')
    .ilike('nombre', `%${q}%`)
    .order('nombre')
    .limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data || []).map((m) => ({ id: m.id, nombre: m.nombre })))
}


