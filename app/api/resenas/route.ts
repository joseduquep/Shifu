import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase/admin-client"

const BodySchema = z.object({
  profesorId: z.string().uuid(),
  rating: z.number().gte(0.5).lte(5),
  semestreCodigo: z.string().regex(/^[0-9]{4}-(1|2)$/),
  comentario: z.string().trim().max(5000).optional().nullable(),
  anonimo: z.boolean().default(false),
  materiaId: z.string().uuid().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json || {})
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }
  const { profesorId, rating, semestreCodigo, comentario, anonimo, materiaId } =
    parsed.data

  // Validar existencia mínima del profesor
  const { data: prof, error: profErr } = await supabaseAdmin
    .from("profesores")
    .select("id")
    .eq("id", profesorId)
    .maybeSingle()
  if (profErr)
    return NextResponse.json({ error: profErr.message }, { status: 500 })
  if (!prof)
    return NextResponse.json(
      { error: "Profesor no encontrado" },
      { status: 404 }
    )

  const insertPayload: Record<string, unknown> = {
    profesor_id: profesorId,
    rating,
    semestre_codigo: semestreCodigo,
    comentario: comentario ?? null,
    anonimo,
  }
  if (materiaId) insertPayload.materia_id = materiaId

  const { data, error } = await supabaseAdmin
    .from("resenas")
    .insert(insertPayload)
    .select("id")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
