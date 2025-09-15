import { z } from 'zod'

export const DepartamentoCreateSchema = z.object({
	universidadId: z.string().uuid({ message: 'Universidad inválida' }),
	nombre: z.string().trim().min(2, 'Nombre muy corto'),
})

export const DepartamentoUpdateSchema = DepartamentoCreateSchema.extend({
	id: z.string().uuid(),
})

export type DepartamentoCreate = z.infer<typeof DepartamentoCreateSchema>
export type DepartamentoUpdate = z.infer<typeof DepartamentoUpdateSchema>
