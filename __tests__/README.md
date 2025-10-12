# Pruebas Automáticas - Shifu

Este directorio contiene todas las pruebas automáticas del proyecto Shifu.

## 📊 Estado Actual

- **✅ 78 pruebas pasando**
- **✅ 8 suites de pruebas**
- **✅ Tiempo de ejecución: < 1 segundo**

## 🗂️ Estructura

```
__tests__/
├── schemas/              # Pruebas unitarias de validaciones Zod
│   ├── estudiantes.test.ts (13 pruebas)
│   ├── profesores.test.ts (7 pruebas)
│   ├── materias.test.ts (7 pruebas)
│   ├── semestres.test.ts (9 pruebas)
│   └── simple.test.ts (16 pruebas)
├── components/           # Pruebas de lógica de componentes
│   └── ProfessorCard-simple.test.tsx (6 pruebas)
├── integration/          # Pruebas de integración
│   └── professor-search-flow.test.tsx (11 pruebas)
└── e2e/                 # Pruebas end-to-end
    └── rating-flow.test.tsx (11 pruebas)
```

## 🚀 Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar en modo watch
npm run test:watch

# Ejecutar con reporte de cobertura
npm run test:coverage

# Ejecutar pruebas específicas
npm test __tests__/schemas/profesores.test.ts
```

## ✅ Cobertura de Pruebas

### Esquemas de Validación (100% cobertura)
- ✅ `EstudianteCreateSchema` y `EstudianteUpdateSchema`
- ✅ `ProfesorCreateSchema` y `ProfesorUpdateSchema`
- ✅ `MateriaCreateSchema` y `MateriaUpdateSchema`
- ✅ `SemestreCreateSchema` y `SemestreUpdateSchema`

### Funciones Utilitarias (100% cobertura)
- ✅ Validación de emails
- ✅ Validación de UUIDs
- ✅ Validación de contraseñas
- ✅ Validación de calificaciones
- ✅ Validación de semestres
- ✅ Cálculos de promedios
- ✅ Filtrado y búsqueda

### Flujos Completos
- ✅ Búsqueda de profesores con filtros
- ✅ Calificación de profesores end-to-end
- ✅ Lógica de componentes UI

## 📝 Escribir Nuevas Pruebas

### Ejemplo de Prueba Unitaria

```typescript
import { MiSchema } from '@/lib/admin/schemas/mi-schema'

describe('MiSchema', () => {
	test('debe validar datos válidos', () => {
		const validData = {
			campo: 'valor',
		}

		const result = MiSchema.safeParse(validData)
		expect(result.success).toBe(true)
	})

	test('debe rechazar datos inválidos', () => {
		const invalidData = {
			campo: '',
		}

		const result = MiSchema.safeParse(invalidData)
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('campo')
		}
	})
})
```

### Ejemplo de Prueba de Integración

```typescript
describe('Mi Flujo', () => {
	test('debe completar el flujo correctamente', async () => {
		// Simular llamada a API
		;(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true }),
		})

		const response = await fetch('/api/mi-endpoint')
		const data = await response.json()

		expect(response.ok).toBe(true)
		expect(data.success).toBe(true)
	})
})
```

## 🔧 Configuración

La configuración de Jest se encuentra en:
- `jest.config.js` - Configuración principal
- `jest.setup.js` - Setup de mocks y configuración global

## 📚 Documentación Adicional

Ver `Pruebas-Automaticas-de-Software.md` en la raíz del proyecto para:
- Estrategia completa de pruebas
- Justificación de tipos de pruebas
- Roadmap de pruebas futuras
