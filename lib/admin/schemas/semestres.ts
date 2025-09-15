import { z } from 'zod'

export const SemestreCreateSchema = z.object({
	anio: z.coerce.number().int().min(2000).max(2100),
	termino: z.coerce.number().int().refine((v) => v === 1 || v === 2, { message: 'Término debe ser 1 o 2' }),
})

export const SemestreUpdateSchema = SemestreCreateSchema.extend({
	codigo: z.string().regex(/^[0-9]{4}-(1|2)$/),
})

export type SemestreCreate = z.infer<typeof SemestreCreateSchema>
export type SemestreUpdate = z.infer<typeof SemestreUpdateSchema>
