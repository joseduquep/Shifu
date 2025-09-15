import { z } from 'zod'

export const UserRoleSchema = z.enum(['student', 'professor'])

export const UserCreateSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8, 'Mínimo 8 caracteres'),
	full_name: z.string().trim().min(2, 'Nombre muy corto'),
	role: UserRoleSchema,
	epik_id: z.string().trim().optional(),
	avatar_url: z.string().url().optional(),
})

export const UserUpdateSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email().optional(),
	password: z.string().min(8).optional(),
	full_name: z.string().trim().min(2).optional(),
	role: UserRoleSchema.optional(),
	epik_id: z.string().trim().optional(),
	avatar_url: z.string().url().optional(),
})

export type UserCreate = z.infer<typeof UserCreateSchema>
export type UserUpdate = z.infer<typeof UserUpdateSchema>
