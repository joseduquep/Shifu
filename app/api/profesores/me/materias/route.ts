import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin-client'
import { createClient } from '@/lib/supabase/server'

const BodySchema = z.object({ materiaIds: z.array(z.string().uuid()).min(0), departamentoId: z.string().uuid().optional() })

export async function GET() {
  const supa = await createClient()
  const { data: userData } = await supa.auth.getUser()
  const user = userData.user
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Resolver profesor: user_id -> email -> nombre perfil
  let prof: any = null
  try {
    const byUser = await supabaseAdmin.from('profesores').select('id, departamento_id').eq('user_id', user.id).maybeSingle()
    prof = byUser.data
  } catch {}
  if (!prof) {
    const byEmail = await supabaseAdmin.from('profesores').select('id, departamento_id').eq('email', user.email).maybeSingle()
    prof = byEmail.data
  }
  if (!prof) {
    const profProfile = await supa.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    const fullName = (profProfile.data as any)?.full_name
    if (fullName) {
      const byName = await supabaseAdmin.from('profesores').select('id, departamento_id').ilike('nombre_completo', fullName).maybeSingle()
      prof = byName.data
    }
  }
  if (!prof) return NextResponse.json({ items: [] })

  const { data, error } = await supabaseAdmin
    .from('profesores_materias')
    .select('materia_id, activo, materias: materia_id ( id, nombre )')
    .eq('profesor_id', prof.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const items = (data || []).filter((r: any) => r.activo).map((r: any) => ({ id: r.materia_id, nombre: r.materias?.nombre }))
  return NextResponse.json({ items })
}

export async function PUT(req: NextRequest) {
  const supa = await createClient()
  const { data: userData } = await supa.auth.getUser()
  const user = userData.user
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json || {})
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { materiaIds, departamentoId } = parsed.data
  // Resolver profesor: user_id -> email -> nombre perfil
  let prof: any = null
  try {
    const byUser = await supabaseAdmin.from('profesores').select('id').eq('user_id', user.id).maybeSingle()
    prof = byUser.data
  } catch {}
  if (!prof) {
    const byEmail = await supabaseAdmin.from('profesores').select('id').eq('email', user.email).maybeSingle()
    prof = byEmail.data
  }
  if (!prof) {
    const profProfile = await supa.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    const fullName = (profProfile.data as any)?.full_name
    if (fullName) {
      let byName
      if (departamentoId) {
        byName = await supabaseAdmin
          .from('profesores')
          .select('id')
          .ilike('nombre_completo', fullName)
          .eq('departamento_id', departamentoId)
          .maybeSingle()
      } else {
        byName = await supabaseAdmin.from('profesores').select('id').ilike('nombre_completo', fullName).maybeSingle()
      }
      prof = byName.data
    }
  }
  if (!prof) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  // Desactivar todas las actuales
  const { error: deactErr } = await supabaseAdmin
    .from('profesores_materias')
    .update({ activo: false })
    .eq('profesor_id', prof.id)
  if (deactErr) return NextResponse.json({ error: deactErr.message }, { status: 500 })

  // Activar/insertar las nuevas
  for (const mid of materiaIds) {
    const { error: upErr } = await supabaseAdmin
      .from('profesores_materias')
      .upsert({ profesor_id: prof.id, materia_id: mid, activo: true }, { onConflict: 'profesor_id,materia_id' })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}


