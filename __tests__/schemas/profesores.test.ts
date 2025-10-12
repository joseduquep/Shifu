import { ProfesorCreateSchema, ProfesorUpdateSchema } from '@/lib/admin/schemas/profesores'

describe('ProfesorCreateSchema', () => {
	test('debe validar datos válidos', () => {
		const validData = {
			nombre_completo: 'Juan Pérez',
			email: 'juan.perez@universidad.edu',
			bio: 'Profesor de matemáticas con 10 años de experiencia',
			departamento_id: '123e4567-e89b-12d3-a456-426614174000',
			password: 'password123',
		}

		const result = ProfesorCreateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe rechazar nombre_completo vacío', () => {
		const invalidData = {
			nombre_completo: '',
			email: 'juan.perez@universidad.edu',
			departamento_id: '123e4567-e89b-12d3-a456-426614174000',
			password: 'password123',
		}

		const result = ProfesorCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('nombre_completo')
		}
	})

	test('debe rechazar email inválido', () => {
		const invalidData = {
			nombre_completo: 'Juan Pérez',
			email: 'email-invalido',
			departamento_id: '123e4567-e89b-12d3-a456-426614174000',
			password: 'password123',
		}

		const result = ProfesorCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('email')
		}
	})

	test('debe rechazar departamento_id que no sea UUID', () => {
		const invalidData = {
			nombre_completo: 'Juan Pérez',
			email: 'juan.perez@universidad.edu',
			departamento_id: 'no-es-uuid',
			password: 'password123',
		}

		const result = ProfesorCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('departamento_id')
		}
	})

	test('debe rechazar password muy corto', () => {
		const invalidData = {
			nombre_completo: 'Juan Pérez',
			email: 'juan.perez@universidad.edu',
			departamento_id: '123e4567-e89b-12d3-a456-426614174000',
			password: '123',
		}

		const result = ProfesorCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('password')
		}
	})

	test('debe aceptar bio opcional', () => {
		const validData = {
			nombre_completo: 'Juan Pérez',
			email: 'juan.perez@universidad.edu',
			departamento_id: '123e4567-e89b-12d3-a456-426614174000',
			password: 'password123',
		}

		const result = ProfesorCreateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})
})

describe('ProfesorUpdateSchema', () => {
	test('debe validar datos válidos con id', () => {
		const validData = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			nombre_completo: 'Juan Pérez',
			email: 'juan.perez@universidad.edu',
			bio: 'Profesor de matemáticas con 10 años de experiencia',
			departamento_id: '123e4567-e89b-12d3-a456-426614174000',
			password: 'password123',
		}

		const result = ProfesorUpdateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe rechazar id inválido', () => {
		const invalidData = {
			id: 'no-es-uuid',
			nombre_completo: 'Juan Pérez',
			email: 'juan.perez@universidad.edu',
			departamento_id: '123e4567-e89b-12d3-a456-426614174000',
			password: 'password123',
		}

		const result = ProfesorUpdateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('id')
		}
	})
})
