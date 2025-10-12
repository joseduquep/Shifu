import { MateriaCreateSchema, MateriaUpdateSchema } from '@/lib/admin/schemas/materias'

describe('MateriaCreateSchema', () => {
	test('debe validar datos válidos', () => {
		const validData = {
			departamentoId: '123e4567-e89b-12d3-a456-426614174000',
			nombre: 'Cálculo Diferencial',
			codigo: 'MATE1001',
		}

		const result = MateriaCreateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe rechazar departamentoId inválido', () => {
		const invalidData = {
			departamentoId: 'no-es-uuid',
			nombre: 'Cálculo Diferencial',
		}

		const result = MateriaCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('departamentoId')
		}
	})

	test('debe rechazar nombre muy corto', () => {
		const invalidData = {
			departamentoId: '123e4567-e89b-12d3-a456-426614174000',
			nombre: 'A',
		}

		const result = MateriaCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('nombre')
		}
	})

	test('debe aceptar codigo opcional', () => {
		const validData = {
			departamentoId: '123e4567-e89b-12d3-a456-426614174000',
			nombre: 'Cálculo Diferencial',
		}

		const result = MateriaCreateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe transformar codigo vacío a undefined', () => {
		const validData = {
			departamentoId: '123e4567-e89b-12d3-a456-426614174000',
			nombre: 'Cálculo Diferencial',
			codigo: '',
		}

		const result = MateriaCreateSchema.safeParse(validData)
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.codigo).toBeUndefined()
		}
	})

	test('debe limpiar espacios en blanco', () => {
		const dataWithSpaces = {
			departamentoId: '123e4567-e89b-12d3-a456-426614174000',
			nombre: '  Cálculo Diferencial  ',
			codigo: '  MATE1001  ',
		}

		const result = MateriaCreateSchema.safeParse(dataWithSpaces)
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.nombre).toBe('Cálculo Diferencial')
			expect(result.data.codigo).toBe('MATE1001')
		}
	})
})

describe('MateriaUpdateSchema', () => {
	test('debe validar datos válidos con id', () => {
		const validData = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			departamentoId: '123e4567-e89b-12d3-a456-426614174000',
			nombre: 'Cálculo Diferencial',
			codigo: 'MATE1001',
		}

		const result = MateriaUpdateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe rechazar id inválido', () => {
		const invalidData = {
			id: 'no-es-uuid',
			departamentoId: '123e4567-e89b-12d3-a456-426614174000',
			nombre: 'Cálculo Diferencial',
		}

		const result = MateriaUpdateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('id')
		}
	})
})
