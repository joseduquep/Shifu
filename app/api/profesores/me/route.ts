import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase/admin-client"
import { createClient } from "@/lib/supabase/server"

const UpdateSchema = z.object({
  nombreCompleto: z.string().trim().min(3).max(200).optional(),
  email: z.string().email().optional(),
  bio: z.string().trim().max(5000).optional().nullable(),
  departamentoId: z.string().uuid().optional(),
})

export async function GET() {
  const supa = await createClient()
  const { data: userData } = await supa.auth.getUser()
  const user = userData.user
  if (!user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  // Intento 1: por user_id (si existe la columna)
  let data: Record<string, unknown> | null = null
  let error: { message?: string } | null = null
  try {
    const res = await supabaseAdmin
      .from("profesores")
      .select(
        "id, nombre_completo, email, bio, departamento_id, departamentos:departamento_id ( id, nombre, universidades:universidad_id ( id, nombre ) )"
      )
      .eq("user_id", user.id)
      .maybeSingle()
    data = res.data
    error = res.error
  } catch (e) {
    error = { message: e instanceof Error ? e.message : String(e) }
  }
  // Si la columna no existe (42703) o error similar, buscar por email
  if (error && String(error.message).toLowerCase().includes("does not exist")) {
    const byEmail = await supabaseAdmin
      .from("profesores")
      .select(
        "id, nombre_completo, email, bio, departamento_id, departamentos:departamento_id ( id, nombre, universidades:universidad_id ( id, nombre ) )"
      )
      .eq("email", user.email)
      .maybeSingle()
    data = byEmail.data
    error = byEmail.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data)
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

  return NextResponse.json({
    id: data.id,
    nombreCompleto: data.nombre_completo,
    email: data.email,
    bio: data.bio,
    departamentoId: data.departamento_id,
    departamento: data.departamentos?.nombre ?? "",
    universidad: data.departamentos?.universidades?.[0]?.nombre ?? "",
  })
}

export async function PUT(req: NextRequest) {
  const supa = await createClient()
  const { data: userData } = await supa.auth.getUser()
  const user = userData.user
  if (!user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(json || {})
  if (!parsed.success)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  // Obtener el profesor vinculado al usuario (por user_id si existe; si no, por email)
  let prof: { id?: string } | null = null
  let profErr: { message?: string } | null = null
  try {
    const res = await supabaseAdmin
      .from("profesores")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
    prof = res.data
    profErr = res.error
  } catch (e) {
    profErr = { message: e instanceof Error ? e.message : String(e) }
  }
  if (
    profErr &&
    String(profErr.message).toLowerCase().includes("does not exist")
  ) {
    const byEmail = await supabaseAdmin
      .from("profesores")
      .select("id")
      .eq("email", user.email)
      .maybeSingle()
    prof = byEmail.data
    profErr = byEmail.error
  }
  if (profErr)
    return NextResponse.json({ error: profErr.message }, { status: 500 })
  if (!prof) {
    // Si no existe aún, permitir crear siempre que se envíe un departamento válido
    if (!("departamentoId" in parsed.data) || !parsed.data.departamentoId) {
      return NextResponse.json(
        { error: "Seleccione un departamento para crear su perfil" },
        { status: 400 }
      )
    }
    // Validar departamento
    const { data: dep, error: depErr } = await supabaseAdmin
      .from("departamentos")
      .select("id")
      .eq("id", parsed.data.departamentoId)
      .maybeSingle()
    if (depErr)
      return NextResponse.json({ error: depErr.message }, { status: 500 })
    if (!dep)
      return NextResponse.json(
        { error: "Departamento no existe" },
        { status: 400 }
      )

    // Intentar emparejar por nombre (case-insensitive) para evitar duplicados y conservar reseñas
    let matched: { id: string; departamento_id?: string } | null = null
    if (parsed.data.nombreCompleto) {
      const name = parsed.data.nombreCompleto.trim()
      const byName = await supabaseAdmin
        .from("profesores")
        .select("id, departamento_id")
        .ilike("nombre_completo", name)
        .maybeSingle()
      if (!byName.error && byName.data) {
        // Si hay filtro de departamento y no coincide, priorizamos insertar nuevo
        if (
          !parsed.data.departamentoId ||
          byName.data.departamento_id === parsed.data.departamentoId
        ) {
          matched = byName.data
        }
      }
    }

    if (matched) {
      // Actualizar registro existente para enlazar datos del perfil (email/bio/departamento)
      const updateExisting: Record<string, unknown> = {
        email: parsed.data.email ?? user.email ?? null,
        bio: parsed.data.bio ?? null,
      }
      if (parsed.data.departamentoId)
        updateExisting.departamento_id = parsed.data.departamentoId
      const { error: upErr } = await supabaseAdmin
        .from("profesores")
        .update(updateExisting)
        .eq("id", matched.id)
      if (upErr)
        return NextResponse.json({ error: upErr.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    } else {
      // Insertar nuevo si no hay coincidencia, evitando romper reseñas existentes
      const insertPayload: Record<string, unknown> = {
        departamento_id: parsed.data.departamentoId,
        nombre_completo: parsed.data.nombreCompleto ?? "",
        email: parsed.data.email ?? user.email ?? null,
        bio: parsed.data.bio ?? null,
      }
      // Si la columna user_id existe, incluirla.
      const tryUserId = await supabaseAdmin
        .from("profesores")
        .select("id")
        .limit(1)
      const canUseUserId = !(
        tryUserId.error &&
        String(tryUserId.error.message).toLowerCase().includes("user_id")
      )
      if (canUseUserId) insertPayload.user_id = user.id
      const { error: insErr } = await supabaseAdmin
        .from("profesores")
        .insert(insertPayload)
      if (insErr)
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
  }

  const payload: Record<string, unknown> = {}
  const b = parsed.data
  if (b.nombreCompleto !== undefined)
    payload["nombre_completo"] = b.nombreCompleto
  if (b.email !== undefined) payload["email"] = b.email
  if (b.bio !== undefined) payload["bio"] = b.bio
  if (b.departamentoId !== undefined)
    payload["departamento_id"] = b.departamentoId

  if (Object.keys(payload).length === 0) return NextResponse.json({ ok: true })

  // Validar FK de departamento si viene
  if (payload["departamento_id"]) {
    const depId = payload["departamento_id"] as string
    const { data: dep, error: depErr } = await supabaseAdmin
      .from("departamentos")
      .select("id")
      .eq("id", depId)
      .maybeSingle()
    if (depErr)
      return NextResponse.json({ error: depErr.message }, { status: 500 })
    if (!dep)
      return NextResponse.json(
        { error: "Departamento no existe" },
        { status: 400 }
      )
  }

  const { error } = await supabaseAdmin
    .from("profesores")
    .update(payload)
    .eq("id", (prof as { id: string }).id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
