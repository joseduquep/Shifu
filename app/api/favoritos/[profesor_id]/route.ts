import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProfesorFavorito, toggleFavorito } from '@/lib/admin/dao/favoritos'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

// Helper: get or create estudiante_id for the given auth user
async function getOrCreateEstudianteIdFromAuthUser(authUserId: string): Promise<string | null> {
  // 1) Read profile to get email/full_name metadata
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, epik_id')
    .eq('id', authUserId)
    .single()

  if (profileError) {
    console.error('Error reading profile for estudiante mapping:', profileError)
  }

  // 2) Detect if estudiantes.user_id column exists
  const { data: userIdCol } = await supabaseAdmin
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'estudiantes')
    .eq('column_name', 'user_id')
    .maybeSingle()

  const hasUserIdColumn = Boolean(userIdCol)

  // 3) Try lookup by user_id if column exists
  if (hasUserIdColumn) {
    const byUser = await supabaseAdmin
      .from('estudiantes')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle()
    if (byUser.data?.id) return byUser.data.id
  }

  // 4) Fallback: try lookup by email if we have it
  if (profile?.email) {
    const byEmail = await supabaseAdmin
      .from('estudiantes')
      .select('id')
      .eq('email', profile.email)
      .maybeSingle()
    if (byEmail.data?.id) return byEmail.data.id
  }

  // 5) If not found, create a minimal estudiante row
  const nombres = profile?.full_name ?? 'Estudiante'
  const apellidos = ''
  const epikId = profile?.epik_id ?? authUserId

  // Build insert payload; include user_id only if supported
  const insertPayload: Record<string, unknown> = {
    nombres,
    apellidos,
    email: profile?.email ?? `${authUserId}@placeholder.local`,
    epik_id: epikId,
  }
  if (hasUserIdColumn) insertPayload.user_id = authUserId

  const { data: created, error: insertError } = await supabaseAdmin
    .from('estudiantes')
    .insert(insertPayload)
    .select('id')
    .single()

  if (insertError) {
    console.error('Error creating estudiante for user:', insertError)
    return null
  }

  return created?.id ?? null
}

// GET /api/favoritos/[profesor_id] - Verificar si un profesor es favorito
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profesor_id: string }> }
) {
  try {
    const { profesor_id } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener/crear el estudiante_id real desde la tabla estudiantes
    const estudianteId = await getOrCreateEstudianteIdFromAuthUser(user.id)
    if (!estudianteId) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    const esFavorito = await isProfesorFavorito(estudianteId, profesor_id)

    return NextResponse.json({ 
      profesor_id,
      es_favorito: esFavorito 
    })
  } catch (error) {
    console.error('Error verificando favorito:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/favoritos/[profesor_id] - Alternar favorito (agregar/eliminar)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profesor_id: string }> }
) {
  try {
    const { profesor_id } = await params
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener/crear el estudiante_id real desde la tabla estudiantes
    const estudianteId = await getOrCreateEstudianteIdFromAuthUser(user.id)
    if (!estudianteId) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    const result = await toggleFavorito(estudianteId, profesor_id)
    
    // Determinar si se agregó o eliminó
    const esFavorito = await isProfesorFavorito(estudianteId, profesor_id)

    return NextResponse.json({ 
      message: esFavorito ? 'Profesor agregado a favoritos' : 'Profesor eliminado de favoritos',
      es_favorito: esFavorito,
      favorito: result
    })
  } catch (error) {
    console.error('Error alternando favorito:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
