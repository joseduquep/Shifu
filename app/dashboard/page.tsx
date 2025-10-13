"use client"

import { useEffect, useMemo, useState } from "react"
import { ProfessorCard } from "../components/ProfessorCard"
import Link from "next/link"
import { useSemanticSearch } from "@/lib/hooks/useSemanticSearch"

type Departamento = { id: string; nombre: string }
type Materia = { id: string; nombre: string; departamentoId: string }
type Semestre = { codigo: string; anio: number; termino: number }

type ApiProfesor = {
  id: string
  nombreCompleto: string
  departamento: string
  universidad?: string
  materias: string[]
  calificacionPromedio: number | null
  cantidadResenas: number
}

export default function DashboardPage() {
  const [query, setQuery] = useState("")
  const [useSemanticSearchEnabled, setUseSemanticSearchEnabled] = useState(true)

  // Hook de búsqueda semántica
  const {
    search: semanticSearch,
    clearResults: clearSemanticResults,
    results: semanticResults,
    total: semanticTotal,
    isLoading: semanticLoading,
    error: semanticError,
  } = useSemanticSearch()

  // Catálogos
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [semestres, setSemestres] = useState<Semestre[]>([])

  // Filtros seleccionados (panel) y aplicados (consulta)
  const [selectedDepartamentoId, setSelectedDepartamentoId] =
    useState<string>("")
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>("")
  const [selectedSemestreCodigo, setSelectedSemestreCodigo] =
    useState<string>("")

  const [appliedDepartamentoId, setAppliedDepartamentoId] = useState<string>("")
  const [appliedMateriaId, setAppliedMateriaId] = useState<string>("")
  const [appliedSemestreCodigo, setAppliedSemestreCodigo] = useState<string>("")

  // Datos
  const [profesores, setProfesores] = useState<ApiProfesor[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar catálogos iniciales
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [depsRes, semRes] = await Promise.all([
          fetch("/api/departamentos"),
          fetch("/api/semestres"),
        ])
        const [deps, sems] = await Promise.all([depsRes.json(), semRes.json()])
        setDepartamentos(deps || [])
        setSemestres(sems || [])
      } catch {
        // noop: mantener vacíos si falla
      }
    }
    loadCatalogs()
  }, [])

  // Cargar materias cuando cambia el departamento seleccionado
  useEffect(() => {
    const loadMaterias = async () => {
      try {
        const url = selectedDepartamentoId
          ? `/api/materias?departamentoId=${encodeURIComponent(
              selectedDepartamentoId
            )}`
          : "/api/materias"
        const res = await fetch(url)
        const data = await res.json()
        setMaterias(data || [])
      } catch {
        setMaterias([])
      }
    }
    loadMaterias()
  }, [selectedDepartamentoId])

  // Cargar profesores cuando cambien filtros aplicados
  useEffect(() => {
    const loadProfesores = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (appliedDepartamentoId)
          params.set("departamentoId", appliedDepartamentoId)
        if (appliedMateriaId) params.set("materiaId", appliedMateriaId)
        if (appliedSemestreCodigo)
          params.set("semestreCodigo", appliedSemestreCodigo)
        const res = await fetch(`/api/profesores?${params.toString()}`)
        const json = await res.json()
        setProfesores(Array.isArray(json.items) ? json.items : [])
      } catch {
        setProfesores([])
      } finally {
        setLoading(false)
      }
    }
    loadProfesores()
  }, [appliedDepartamentoId, appliedMateriaId, appliedSemestreCodigo])

  // Búsqueda semántica cuando cambia la query
  useEffect(() => {
    if (query.trim() && useSemanticSearchEnabled) {
      semanticSearch(query.trim(), 50)
    } else {
      clearSemanticResults()
    }
  }, [query, useSemanticSearchEnabled, semanticSearch, clearSemanticResults])

  const filtered = useMemo(() => {
    // Si hay query y búsqueda semántica está habilitada, usar resultados semánticos
    if (
      query.trim() &&
      useSemanticSearchEnabled &&
      semanticResults.length > 0
    ) {
      return semanticResults.map((result) => ({
        id: result.id,
        nombreCompleto: result.nombreCompleto,
        departamento: result.departamento,
        universidad: result.universidad,
        materias: result.materias || [],
        calificacionPromedio: result.calificacionPromedio,
        cantidadResenas: result.cantidadResenas,
        relevanciaScore: result.relevanciaScore,
      }))
    }

    // Búsqueda tradicional por palabras clave
    const q = query.trim().toLowerCase()
    if (!q) return profesores
    return profesores.filter((p) =>
      [p.nombreCompleto, p.departamento, p.universidad, ...(p.materias || [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    )
  }, [profesores, query, useSemanticSearchEnabled, semanticResults])

  const handleApply = () => {
    setAppliedDepartamentoId(selectedDepartamentoId)
    setAppliedMateriaId(selectedMateriaId)
    setAppliedSemestreCodigo(selectedSemestreCodigo)
  }

  const handleClear = () => {
    setSelectedDepartamentoId("")
    setSelectedMateriaId("")
    setSelectedSemestreCodigo("")
    setAppliedDepartamentoId("")
    setAppliedMateriaId("")
    setAppliedSemestreCodigo("")
  }

  return (
    <main className="min-h-dvh bg-[#0b0d12] text-primary font-sans">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-medium">Dashboard</h1>
          <Link
            href="/calificar"
            className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            Nueva reseña
          </Link>
        </div>

        <div className="mt-6">
          <label htmlFor="search" className="sr-only">
            Buscar profesor
          </label>
          <div className="relative">
            <input
              id="search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar profesor por nombre, departamento o materia…"
              className="w-full h-16 rounded-full bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-6 pl-14 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60">
              <SearchIcon />
            </div>
          </div>
        </div>

        {/* Panel de filtros - Diseño mejorado */}
        <div className="mt-8 space-y-4">
          {/* Toggle para búsqueda semántica */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSemanticSearchEnabled}
                  onChange={(e) =>
                    setUseSemanticSearchEnabled(e.target.checked)
                  }
                  className="w-4 h-4 rounded border-white/20 bg-[#1a1d26] text-primary focus:ring-primary/30 focus:ring-2"
                />
                <span>Búsqueda semántica</span>
              </label>
              <div className="text-xs text-white/50">
                {useSemanticSearchEnabled
                  ? "Resultados ordenados por relevancia"
                  : "Búsqueda tradicional"}
              </div>
            </div>
            {query.trim() && useSemanticSearchEnabled && (
              <div className="flex items-center gap-2 text-xs text-primary">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                {semanticLoading
                  ? "Buscando..."
                  : `${semanticTotal} resultados`}
              </div>
            )}
          </div>

          {/* Filtros en una fila compacta */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <select
                value={selectedDepartamentoId}
                onChange={(e) => {
                  setSelectedDepartamentoId(e.target.value)
                  setSelectedMateriaId("")
                }}
                className="w-full h-11 rounded-lg bg-[#1a1d26] text-white/90 border-0 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 hover:bg-[#1e212a] transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#1a1d26] text-white/60">
                  Programa/Departamento
                </option>
                {departamentos.map((d) => (
                  <option
                    key={d.id}
                    value={d.id}
                    className="bg-[#1a1d26] text-white"
                  >
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <select
                value={selectedMateriaId}
                onChange={(e) => setSelectedMateriaId(e.target.value)}
                className="w-full h-11 rounded-lg bg-[#1a1d26] text-white/90 border-0 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 hover:bg-[#1e212a] transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#1a1d26] text-white/60">
                  Materia
                </option>
                {materias.map((m) => (
                  <option
                    key={m.id}
                    value={m.id}
                    className="bg-[#1a1d26] text-white"
                  >
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <select
                value={selectedSemestreCodigo}
                onChange={(e) => setSelectedSemestreCodigo(e.target.value)}
                className="w-full h-11 rounded-lg bg-[#1a1d26] text-white/90 border-0 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 hover:bg-[#1e212a] transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#1a1d26] text-white/60">
                  Semestre
                </option>
                {semestres.map((s) => (
                  <option
                    key={s.codigo}
                    value={s.codigo}
                    className="bg-[#1a1d26] text-white"
                  >
                    {s.codigo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-[#0b0d12] px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <FilterIcon />
              Aplicar filtros
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a1d26] text-white/80 px-5 py-2.5 text-sm font-medium hover:bg-[#1e212a] hover:text-white transition-colors"
            >
              <ClearIcon />
              Quitar filtros
            </button>
            {loading && (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                Cargando…
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p, index) => (
            <div key={p.id} className="relative">
              <ProfessorCard
                id={p.id}
                name={p.nombreCompleto}
                department={p.departamento}
                university={p.universidad}
                rating={p.calificacionPromedio ?? undefined}
                reviewsCount={p.cantidadResenas}
                materias={p.materias}
              />
              {/* Indicador de relevancia semántica */}
              {query.trim() &&
                useSemanticSearchEnabled &&
                "relevanciaScore" in p && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>{Math.round((p.relevanciaScore || 0) * 100)}%</span>
                  </div>
                )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="mt-16 text-center text-white/60">
            No se encontraron profesores{" "}
            {query ? (
              <>para &quot;{query}&quot;.</>
            ) : (
              <>con los filtros seleccionados.</>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"></polygon>
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
}
