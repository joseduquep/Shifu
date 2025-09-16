import { z } from 'zod'

export const ProfesorCreateSchema = z.object({
	nombre_completo: z.string().trim().min(2),
	email: z.string().email(),
	bio: z.string().trim().optional(),
	departamento_id: z.string().uuid(),
	password: z.string().min(8, 'Mínimo 8 caracteres'),
})

export const ProfesorUpdateSchema = z.object({
	id: z.string().uuid(),
	nombre_completo: z.string().trim().min(2).optional(),
	email: z.string().email().optional(),
	bio: z.string().trim().optional(),
	departamento_id: z.string().uuid().optional(),
	password: z.string().min(8).optional(),
})

export type ProfesorCreate = z.infer<typeof ProfesorCreateSchema>
export type ProfesorUpdate = z.infer<typeof ProfesorUpdateSchema>
