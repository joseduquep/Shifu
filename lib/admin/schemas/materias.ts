import { z } from 'zod'

export const MateriaCreateSchema = z.object({
	departamentoId: z.string().uuid({ message: 'Departamento inválido' }),
	nombre: z.string().trim().min(2, 'Nombre muy corto'),
	codigo: z.string().trim().optional().transform(v => v === '' ? undefined : v),
})

export const MateriaUpdateSchema = MateriaCreateSchema.extend({
	id: z.string().uuid(),
})

export type MateriaCreate = z.infer<typeof MateriaCreateSchema>
export type MateriaUpdate = z.infer<typeof MateriaUpdateSchema>
