import { supabaseAdmin } from '@/lib/supabase/admin-client'
import type { FavoritoCreate, FavoritoDelete, FavoritoWithProfessor } from '@/lib/admin/schemas/favoritos'

// Crear un favorito
export async function createFavorito(input: FavoritoCreate) {
  const { data, error } = await supabaseAdmin
    .from('profesores_favoritos')
    .insert({
      estudiante_id: input.estudiante_id,
      profesor_id: input.profesor_id,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Eliminar un favorito
export async function deleteFavorito(input: FavoritoDelete) {
  const { data, error } = await supabaseAdmin
    .from('profesores_favoritos')
    .delete()
    .eq('estudiante_id', input.estudiante_id)
    .eq('profesor_id', input.profesor_id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Verificar si un profesor es favorito de un estudiante
export async function isProfesorFavorito(estudiante_id: string, profesor_id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .rpc('is_profesor_favorito', {
      p_estudiante_id: estudiante_id,
      p_profesor_id: profesor_id
    })

  if (error) throw error
  return data || false
}

// Obtener todos los favoritos de un estudiante
export async function getFavoritosEstudiante(estudiante_id: string): Promise<FavoritoWithProfessor[]> {
  const { data, error } = await supabaseAdmin
    .rpc('get_favoritos_estudiante', {
      p_estudiante_id: estudiante_id
    })

  if (error) throw error
  return data || []
}

// Alternar favorito (agregar si no existe, eliminar si existe)
export async function toggleFavorito(estudiante_id: string, profesor_id: string) {
  const isFavorito = await isProfesorFavorito(estudiante_id, profesor_id)
  
  if (isFavorito) {
    return await deleteFavorito({ estudiante_id, profesor_id })
  } else {
    return await createFavorito({ estudiante_id, profesor_id })
  }
}
