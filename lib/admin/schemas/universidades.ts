import { z } from 'zod'

export const UniversidadCreateSchema = z.object({
	nombre: z.string().trim().min(2, 'Nombre muy corto'),
})

export const UniversidadUpdateSchema = UniversidadCreateSchema.extend({
	id: z.string().uuid(),
})

export type UniversidadCreate = z.infer<typeof UniversidadCreateSchema>
export type UniversidadUpdate = z.infer<typeof UniversidadUpdateSchema>
