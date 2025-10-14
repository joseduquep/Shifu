import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFavorito, deleteFavorito } from '@/lib/admin/dao/favoritos'
import { FavoritoCreateSchema, FavoritoDeleteSchema } from '@/lib/admin/schemas/favoritos'

// GET /api/favoritos - Obtener favoritos del estudiante autenticado
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // CORREGIDO: Usar directamente user.id como estudiante_id
    // porque estudiantes.id = auth.users.id según el diagrama
    
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
      .eq('estudiante_id', user.id)
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

    // CORREGIDO: Usar directamente user.id como estudiante_id
    // porque estudiantes.id = auth.users.id según el diagrama

    // Validar datos de entrada
    const validatedData = FavoritoCreateSchema.parse({
      estudiante_id: user.id,
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

    // CORREGIDO: Usar directamente user.id como estudiante_id
    // porque estudiantes.id = auth.users.id según el diagrama

    // Validar datos de entrada
    const validatedData = FavoritoDeleteSchema.parse({
      estudiante_id: user.id,
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
