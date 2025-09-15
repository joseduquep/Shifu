import { z } from 'zod'

export const ProfesorCreateSchema = z.object({
	nombre_completo: z.string().trim().min(2),
	email: z.string().email().optional(),
	bio: z.string().trim().optional(),
	departamento_id: z.string().uuid(),
	create_auth_user: z.coerce.boolean().default(false),
	password: z.string().min(8).optional(),
})

export const ProfesorUpdateSchema = z.object({
	id: z.string().uuid(),
	nombre_completo: z.string().trim().min(2).optional(),
	email: z.string().email().optional(),
	bio: z.string().trim().optional(),
	departamento_id: z.string().uuid().optional(),
})

export type ProfesorCreate = z.infer<typeof ProfesorCreateSchema>
export type ProfesorUpdate = z.infer<typeof ProfesorUpdateSchema>
