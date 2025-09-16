"use client"

import { useMemo, useState } from "react"
import { ProfessorCard } from "../components/ProfessorCard"
import Link from "next/link"

export default function DashboardPage() {
  const [query, setQuery] = useState("")

  const professors = useMemo(
    () => [
      {
        id: "1",
        name: "Ana María Gómez",
        department: "Matemáticas",
        university: "EAFIT",
        rating: 4.7,
        reviewsCount: 128,
        materias: ["Cálculo", "Estadística"],
      },
      {
        id: "2",
        name: "Carlos Pérez",
        department: "Ingeniería de Sistemas",
        university: "EAFIT",
        rating: 4.3,
        reviewsCount: 86,
        materias: ["Algoritmos", "Arquitectura"],
      },
      {
        id: "3",
        name: "Laura Restrepo",
        department: "Humanidades",
        university: "EAFIT",
        rating: 4.9,
        reviewsCount: 204,
        materias: ["Escritura", "Ética"],
      },
      {
        id: "4",
        name: "Julián Ramírez",
        department: "Finanzas",
        university: "EAFIT",
        rating: 4.5,
        reviewsCount: 73,
        materias: ["Econometría", "Mercados"],
      },
      {
        id: "5",
        name: "María Fernanda Toro",
        department: "Diseño",
        university: "EAFIT",
        rating: 4.2,
        reviewsCount: 51,
        materias: ["UX", "Prototipado"],
      },
    ],
    []
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return professors
    return professors.filter((p) =>
      [p.name, p.department, p.university, ...(p.materias || [])]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    )
  }, [professors, query])

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

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProfessorCard key={p.id} {...p} />
          ))}
        </div>

          {filtered.length === 0 && (
          <div className="mt-16 text-center text-white/60">
            No se encontraron profesores para &quot;{query}&quot;.
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

