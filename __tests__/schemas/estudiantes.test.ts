import { EstudianteCreateSchema, EstudianteUpdateSchema } from '@/lib/admin/schemas/estudiantes'

describe('EstudianteCreateSchema', () => {
	test('debe validar datos válidos', () => {
		const validData = {
			nombres: 'Juan Carlos',
			apellidos: 'Pérez González',
			email: 'juan.perez@estudiante.edu',
			epik_id: 'EPIK123456',
			telefono: '+573001234567',
			fecha_nacimiento: '1995-05-15',
			password: 'password123',
		}

		const result = EstudianteCreateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe rechazar nombres muy cortos', () => {
		const invalidData = {
			nombres: 'J',
			apellidos: 'Pérez González',
			email: 'juan.perez@estudiante.edu',
			epik_id: 'EPIK123456',
			password: 'password123',
		}

		const result = EstudianteCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('nombres')
		}
	})

	test('debe rechazar apellidos muy cortos', () => {
		const invalidData = {
			nombres: 'Juan Carlos',
			apellidos: 'P',
			email: 'juan.perez@estudiante.edu',
			epik_id: 'EPIK123456',
			password: 'password123',
		}

		const result = EstudianteCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('apellidos')
		}
	})

	test('debe rechazar email inválido', () => {
		const invalidData = {
			nombres: 'Juan Carlos',
			apellidos: 'Pérez González',
			email: 'email-invalido',
			epik_id: 'EPIK123456',
			password: 'password123',
		}

		const result = EstudianteCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('email')
		}
	})

	test('debe rechazar epik_id vacío', () => {
		const invalidData = {
			nombres: 'Juan Carlos',
			apellidos: 'Pérez González',
			email: 'juan.perez@estudiante.edu',
			epik_id: '',
			password: 'password123',
		}

		const result = EstudianteCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('epik_id')
		}
	})

	test('debe rechazar password muy corto', () => {
		const invalidData = {
			nombres: 'Juan Carlos',
			apellidos: 'Pérez González',
			email: 'juan.perez@estudiante.edu',
			epik_id: 'EPIK123456',
			password: '123',
		}

		const result = EstudianteCreateSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('password')
		}
	})

	test('debe aceptar campos opcionales', () => {
		const validData = {
			nombres: 'Juan Carlos',
			apellidos: 'Pérez González',
			email: 'juan.perez@estudiante.edu',
			epik_id: 'EPIK123456',
			password: 'password123',
		}

		const result = EstudianteCreateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe limpiar espacios en blanco', () => {
		const dataWithSpaces = {
			nombres: '  Juan Carlos  ',
			apellidos: '  Pérez González  ',
			email: 'juan.perez@estudiante.edu',
			epik_id: '  EPIK123456  ',
			password: 'password123',
		}

		const result = EstudianteCreateSchema.safeParse(dataWithSpaces)
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.nombres).toBe('Juan Carlos')
			expect(result.data.apellidos).toBe('Pérez González')
			expect(result.data.epik_id).toBe('EPIK123456')
		}
	})
})

describe('EstudianteUpdateSchema', () => {
	test('debe validar datos válidos con id', () => {
		const validData = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			nombres: 'Juan Carlos',
			apellidos: 'Pérez González',
			email: 'juan.perez@estudiante.edu',
			epik_id: 'EPIK123456',
			password: 'password123',
		}

		const result = EstudianteUpdateSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})
})
