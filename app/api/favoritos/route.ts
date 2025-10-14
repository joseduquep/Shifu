import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFavorito, deleteFavorito } from '@/lib/admin/dao/favoritos'
import { FavoritoCreateSchema, FavoritoDeleteSchema } from '@/lib/admin/schemas/favoritos'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

// Helper: get or create estudiante_id for the given auth user
async function getOrCreateEstudianteIdFromAuthUser(authUserId: string): Promise<string | null> {
  // 1) Read profile to get email/full_name metadata
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, epik_id')
    .eq('id', authUserId)
    .maybeSingle()

  // 2) Detect if estudiantes.user_id column exists
  const { data: userIdCol } = await supabaseAdmin
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'estudiantes')
    .eq('column_name', 'user_id')
    .maybeSingle()
  const hasUserIdColumn = Boolean(userIdCol)

  // 3) Try lookup by user_id if supported
  if (hasUserIdColumn) {
    const byUser = await supabaseAdmin
      .from('estudiantes')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle()
    if (byUser.data?.id) return byUser.data.id
  }

  // 4) Fallback: by email
  if (profile?.email) {
    const byEmail = await supabaseAdmin
      .from('estudiantes')
      .select('id')
      .eq('email', profile.email)
      .maybeSingle()
    if (byEmail.data?.id) return byEmail.data.id
  }

  // 5) Create minimal estudiante
  const insertPayload: Record<string, unknown> = {
    nombres: profile?.full_name ?? 'Estudiante',
    apellidos: '',
    email: profile?.email ?? `${authUserId}@placeholder.local`,
    epik_id: profile?.epik_id ?? authUserId,
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

// GET /api/favoritos - Obtener favoritos del estudiante autenticado
export async function GET() {
  try {
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
    
    // Obtener favoritos directamente sin función
    const { data: favoritosData, error: favoritosError } = await supabase
      .from('profesores_favoritos')
      .select(`
        id,
        profesor_id,
        created_at,
        profesores!inner(
          nombre_completo,
          departamentos!inner(
            nombre,
            universidades!inner(nombre)
          )
        )
      `)
      .eq('estudiante_id', estudianteId)
      .order('created_at', { ascending: false })

    if (favoritosError) {
      console.error('Error obteniendo favoritos:', favoritosError)
      return NextResponse.json(
        { error: 'Error obteniendo favoritos' },
        { status: 500 }
      )
    }

    // Transformar datos al formato esperado
    const favoritos = favoritosData?.map(fav => ({
      id: fav.id,
      profesor_id: fav.profesor_id,
      nombre_completo: fav.profesores.nombre_completo,
      departamento: fav.profesores.departamentos.nombre,
      universidad: fav.profesores.departamentos.universidades.nombre,
      calificacion_promedio: 0, // Por ahora 0
      cantidad_resenas: 0, // Por ahora 0
      created_at: fav.created_at
    })) || []

    return NextResponse.json({ favoritos })
  } catch (error) {
    console.error('Error obteniendo favoritos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/favoritos - Agregar profesor a favoritos
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { profesor_id } = body

    if (!profesor_id) {
      return NextResponse.json({ error: 'profesor_id es requerido' }, { status: 400 })
    }

    // Obtener/crear el estudiante_id real desde la tabla estudiantes
    const estudianteId = await getOrCreateEstudianteIdFromAuthUser(user.id)
    if (!estudianteId) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    // Validar datos de entrada
    const validatedData = FavoritoCreateSchema.parse({
      estudiante_id: estudianteId,
      profesor_id,
    })

    // Crear favorito
    const favorito = await createFavorito(validatedData)

    return NextResponse.json({ 
      message: 'Profesor agregado a favoritos',
      favorito 
    })
  } catch (error) {
    console.error('Error agregando favorito:', error)
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'El profesor ya está en favoritos' }, { status: 409 })
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/favoritos - Eliminar profesor de favoritos
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { profesor_id } = body

    if (!profesor_id) {
      return NextResponse.json({ error: 'profesor_id es requerido' }, { status: 400 })
    }

    // Obtener el estudiante_id real desde la tabla estudiantes
    const estudianteId = await getEstudianteIdFromAuthUser(user.id)
    if (!estudianteId) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    // Validar datos de entrada
    const validatedData = FavoritoDeleteSchema.parse({
      estudiante_id: estudianteId,
      profesor_id,
    })

    // Eliminar favorito
    const favorito = await deleteFavorito(validatedData)

    return NextResponse.json({ 
      message: 'Profesor eliminado de favoritos',
      favorito 
    })
  } catch (error) {
    console.error('Error eliminando favorito:', error)
    
    if (error instanceof Error && error.message.includes('No rows')) {
      return NextResponse.json({ error: 'Favorito no encontrado' }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
