import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isProfesorFavorito, toggleFavorito } from '@/lib/admin/dao/favoritos'

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

    // CORREGIDO: Usar directamente user.id como estudiante_id
    // porque estudiantes.id = auth.users.id según el diagrama
    const esFavorito = await isProfesorFavorito(user.id, profesor_id)

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

    // CORREGIDO: Usar directamente user.id como estudiante_id
    // porque estudiantes.id = auth.users.id según el diagrama
    const result = await toggleFavorito(user.id, profesor_id)
    
    // Determinar si se agregó o eliminó
    const esFavorito = await isProfesorFavorito(user.id, profesor_id)

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
