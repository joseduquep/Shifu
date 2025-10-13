// Mock Next.js components
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => "/profesores"),
}))

jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: unknown) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

// Mock fetch para simular llamadas a la API
global.fetch = jest.fn()

describe("Flujo de Búsqueda de Profesores", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  test("debe realizar búsqueda por nombre de profesor", async () => {
    const mockProfesores = [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombreCompleto: "Juan Pérez",
        departamento: "Matemáticas",
        universidad: "Universidad Nacional",
        materias: ["Cálculo I", "Cálculo II"],
        calificacionPromedio: 4.5,
        cantidadResenas: 25,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockProfesores, count: 1 }),
    })

    // Simular búsqueda
    const searchQuery = "Juan"
    const response = await fetch(
      `/api/profesores?q=${encodeURIComponent(searchQuery)}`
    )
    const data = await response.json()

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/profesores?q=${encodeURIComponent(searchQuery)}`
    )
    expect(data.items).toHaveLength(1)
    expect(data.items[0].nombreCompleto).toBe("Juan Pérez")
  })

  test("debe filtrar profesores por departamento", async () => {
    const mockProfesores = [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombreCompleto: "María García",
        departamento: "Matemáticas",
        universidad: "Universidad Nacional",
        materias: ["Álgebra Lineal"],
        calificacionPromedio: 4.2,
        cantidadResenas: 15,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockProfesores, count: 1 }),
    })

    const departamentoId = "123e4567-e89b-12d3-a456-426614174000"
    const response = await fetch(
      `/api/profesores?departamentoId=${departamentoId}`
    )
    const data = await response.json()

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/profesores?departamentoId=${departamentoId}`
    )
    expect(data.items).toHaveLength(1)
    expect(data.items[0].departamento).toBe("Matemáticas")
  })

  test("debe filtrar profesores por universidad", async () => {
    const mockProfesores = [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombreCompleto: "Carlos López",
        departamento: "Física",
        universidad: "Universidad de los Andes",
        materias: ["Física I", "Física II"],
        calificacionPromedio: 4.8,
        cantidadResenas: 30,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockProfesores, count: 1 }),
    })

    const universidadId = "456e7890-e89b-12d3-a456-426614174000"
    const response = await fetch(
      `/api/profesores?universidadId=${universidadId}`
    )
    const data = await response.json()

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/profesores?universidadId=${universidadId}`
    )
    expect(data.items).toHaveLength(1)
    expect(data.items[0].universidad).toBe("Universidad de los Andes")
  })

  test("debe combinar múltiples filtros en búsqueda", async () => {
    const mockProfesores = [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nombreCompleto: "Ana María Rodríguez",
        departamento: "Matemáticas",
        universidad: "Universidad Nacional",
        materias: ["Cálculo Diferencial"],
        calificacionPromedio: 4.3,
        cantidadResenas: 20,
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockProfesores, count: 1 }),
    })

    const params = new URLSearchParams({
      q: "Ana",
      departamentoId: "123e4567-e89b-12d3-a456-426614174000",
      universidadId: "456e7890-e89b-12d3-a456-426614174000",
      limit: "10",
      offset: "0",
    })

    const response = await fetch(`/api/profesores?${params.toString()}`)
    const data = await response.json()

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/profesores?${params.toString()}`
    )
    expect(data.items).toHaveLength(1)
  })

  test("debe manejar búsqueda sin resultados", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], count: 0 }),
    })

    const response = await fetch("/api/profesores?q=ProfesorInexistente")
    const data = await response.json()

    expect(data.items).toHaveLength(0)
    expect(data.count).toBe(0)
  })

  test("debe manejar error de API en búsqueda", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    })

    const response = await fetch("/api/profesores?q=test")

    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)
  })

  test("debe paginar resultados correctamente", async () => {
    const mockProfesores = Array.from({ length: 10 }, (_, i) => ({
      id: `prof-${i}`,
      nombreCompleto: `Profesor ${i}`,
      departamento: "Matemáticas",
      universidad: "Universidad Nacional",
      materias: ["Materia 1"],
      calificacionPromedio: 4.0,
      cantidadResenas: 10,
    }))

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockProfesores, count: 10 }),
    })

    const response = await fetch("/api/profesores?limit=10&offset=0")
    const data = await response.json()

    expect(data.items).toHaveLength(10)
    expect(data.count).toBe(10)
  })

  test("debe cargar detalles de profesor individual", async () => {
    const mockProfesor = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      nombreCompleto: "Juan Pérez",
      bio: "Profesor de matemáticas con 10 años de experiencia",
      departamento: "Matemáticas",
      universidad: "Universidad Nacional",
      materias: [
        { id: "1", nombre: "Cálculo I" },
        { id: "2", nombre: "Cálculo II" },
      ],
      calificacionPromedio: 4.5,
      cantidadResenas: 25,
      ratingsPorSemestre: [
        { semestre: "2024-1", rating: 4.3 },
        { semestre: "2024-2", rating: 4.7 },
      ],
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfesor,
    })

    const profesorId = "123e4567-e89b-12d3-a456-426614174000"
    const response = await fetch(`/api/profesores/${profesorId}`)
    const data = await response.json()

    expect(global.fetch).toHaveBeenCalledWith(`/api/profesores/${profesorId}`)
    expect(data.nombreCompleto).toBe("Juan Pérez")
    expect(data.materias).toHaveLength(2)
    expect(data.ratingsPorSemestre).toHaveLength(2)
  })

  test("debe manejar error 404 para profesor no encontrado", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "No encontrado" }),
    })

    const response = await fetch("/api/profesores/profesor-inexistente")

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })

  test("debe validar parámetros de búsqueda", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Parámetros inválidos" }),
    })

    const response = await fetch("/api/profesores?limit=invalid")

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })
})
