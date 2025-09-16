import { z } from 'zod'

export const EstudianteCreateSchema = z.object({
	nombres: z.string().trim().min(2),
	apellidos: z.string().trim().min(2),
	email: z.string().email(),
	epik_id: z.string().trim().min(1),
	telefono: z.string().trim().optional(),
	fecha_nacimiento: z.string().trim().optional(),
	password: z.string().min(8, 'Mínimo 8 caracteres'),
})

export const EstudianteUpdateSchema = z.object({
	id: z.string().uuid(),
	nombres: z.string().trim().min(2).optional(),
	apellidos: z.string().trim().min(2).optional(),
	email: z.string().email().optional(),
	epik_id: z.string().trim().optional(),
	telefono: z.string().trim().optional(),
	fecha_nacimiento: z.string().trim().optional(),
	password: z.string().min(8).optional(),
})

export type EstudianteCreate = z.infer<typeof EstudianteCreateSchema>
export type EstudianteUpdate = z.infer<typeof EstudianteUpdateSchema>
