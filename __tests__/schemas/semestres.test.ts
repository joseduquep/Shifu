import { SemestreCreateSchema, SemestreUpdateSchema } from '@/lib/admin/schemas/semestres'

describe('SemestreCreateSchema', () => {
	test('debe validar datos válidos', () => {
		const validData = {
			anio: 2024,
			termino: 1,
		}

		const result = SemestreCreateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe aceptar año como string y convertirlo a número', () => {
		const validData = {
			anio: '2024',
			termino: 1,
		}

		const result = SemestreCreateSchema.safeParse(validData)
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.anio).toBe(2024)
		}
	})

	test('debe rechazar año fuera del rango válido', () => {
		const invalidData = {
			anio: 1999,
			termino: 1,
		}

		const result = SemestreCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('anio')
		}
	})

	test('debe rechazar año mayor al máximo', () => {
		const invalidData = {
			anio: 2101,
			termino: 1,
		}

		const result = SemestreCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('anio')
		}
	})

	test('debe rechazar término inválido', () => {
		const invalidData = {
			anio: 2024,
			termino: 3,
		}

		const result = SemestreCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('termino')
		}
	})

	test('debe aceptar término 2', () => {
		const validData = {
			anio: 2024,
			termino: 2,
		}

		const result = SemestreCreateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe rechazar término como string inválido', () => {
		const invalidData = {
			anio: 2024,
			termino: '3',
		}

		const result = SemestreCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('termino')
		}
	})
})

describe('SemestreUpdateSchema', () => {
	test('debe validar datos válidos', () => {
		const validData = {
			codigo: '2024-1',
			anio: 2024,
			termino: 1,
		}

		const result = SemestreUpdateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe rechazar código inválido', () => {
		const invalidData = {
			codigo: '2024-3',
			anio: 2024,
			termino: 1,
		}

		const result = SemestreUpdateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('codigo')
		}
	})

	test('debe aceptar código válido con formato correcto', () => {
		const validData = {
			codigo: '2025-2',
			anio: 2025,
			termino: 2,
		}

		const result = SemestreUpdateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})
})
