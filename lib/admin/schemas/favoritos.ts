import { z } from 'zod'

// Esquema para crear un favorito
export const FavoritoCreateSchema = z.object({
  estudiante_id: z.string().uuid('ID de estudiante debe ser un UUID válido'),
  profesor_id: z.string().uuid('ID de profesor debe ser un UUID válido'),
})

// Esquema para eliminar un favorito
export const FavoritoDeleteSchema = z.object({
  estudiante_id: z.string().uuid('ID de estudiante debe ser un UUID válido'),
  profesor_id: z.string().uuid('ID de profesor debe ser un UUID válido'),
})

// Esquema para respuesta de favorito con información del profesor
export const FavoritoWithProfessorSchema = z.object({
  id: z.string().uuid(),
  profesor_id: z.string().uuid(),
  nombre_completo: z.string(),
  departamento: z.string(),
  universidad: z.string(),
  calificacion_promedio: z.number(),
  cantidad_resenas: z.number(),
  created_at: z.string().datetime(),
})

// Tipos TypeScript derivados de los esquemas
export type FavoritoCreate = z.infer<typeof FavoritoCreateSchema>
export type FavoritoDelete = z.infer<typeof FavoritoDeleteSchema>
export type FavoritoWithProfessor = z.infer<typeof FavoritoWithProfessorSchema>

// Esquema para verificar si un profesor es favorito
export const IsFavoritoSchema = z.object({
  estudiante_id: z.string().uuid(),
  profesor_id: z.string().uuid(),
})

export type IsFavorito = z.infer<typeof IsFavoritoSchema>
