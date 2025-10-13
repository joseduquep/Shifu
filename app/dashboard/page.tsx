"use client"

import { useEffect, useMemo, useState } from "react"
import { ProfessorCard } from "../components/ProfessorCard"
import Link from "next/link"

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

  // Catálogos
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [semestres, setSemestres] = useState<Semestre[]>([])

  // Filtros seleccionados (panel) y aplicados (consulta)
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<string>("")
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>("")
  const [selectedSemestreCodigo, setSelectedSemestreCodigo] = useState<string>("")

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
      } catch (e) {
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
          ? `/api/materias?departamentoId=${encodeURIComponent(selectedDepartamentoId)}`
          : "/api/materias"
        const res = await fetch(url)
        const data = await res.json()
        setMaterias(data || [])
      } catch (e) {
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
        if (appliedDepartamentoId) params.set("departamentoId", appliedDepartamentoId)
        if (appliedMateriaId) params.set("materiaId", appliedMateriaId)
        if (appliedSemestreCodigo) params.set("semestreCodigo", appliedSemestreCodigo)
        const res = await fetch(`/api/profesores?${params.toString()}`)
        const json = await res.json()
        setProfesores(Array.isArray(json.items) ? json.items : [])
      } catch (e) {
        setProfesores([])
      } finally {
        setLoading(false)
      }
    }
    loadProfesores()
  }, [appliedDepartamentoId, appliedMateriaId, appliedSemestreCodigo])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return profesores
    return profesores.filter((p) =>
      [p.nombreCompleto, p.departamento, p.universidad, ...(p.materias || [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    )
  }, [profesores, query])

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

        {/* Panel de filtros */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <select
              value={selectedDepartamentoId}
              onChange={(e) => {
                setSelectedDepartamentoId(e.target.value)
                // Reinicia materia al cambiar departamento
                setSelectedMateriaId("")
              }}
              className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 border border-white/15 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Programa/Departamento</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <select
              value={selectedMateriaId}
              onChange={(e) => setSelectedMateriaId(e.target.value)}
              className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 border border-white/15 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Materia</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedSemestreCodigo}
              onChange={(e) => setSelectedSemestreCodigo(e.target.value)}
              className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 border border-white/15 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Semestre</option>
              {semestres.map((s) => (
                <option key={s.codigo} value={s.codigo}>{s.codigo}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-5 flex items-center gap-3">
            <button
              onClick={handleApply}
              className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-4 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              Aplicar filtros
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center rounded-full border border-white/15 text-white px-4 py-2 text-sm font-medium hover:bg-white/5 transition"
            >
              Quitar filtros
            </button>
            {loading && (
              <span className="text-white/60 text-sm">Cargando…</span>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProfessorCard
              key={p.id}
              id={p.id}
              name={p.nombreCompleto}
              department={p.departamento}
              university={p.universidad}
              rating={p.calificacionPromedio ?? undefined}
              reviewsCount={p.cantidadResenas}
              materias={p.materias}
            />
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="mt-16 text-center text-white/60">
            No se encontraron profesores {query ? (
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

