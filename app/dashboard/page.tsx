"use client"

import { useEffect, useMemo, useState } from "react"
import { ProfessorCard } from "../components/ProfessorCard"
import Link from "next/link"

interface ApiProfesorItem {
    id: string
    nombreCompleto: string
    departamento: string
    universidad?: string
    materias?: string[]
    calificacionPromedio: number | null
    cantidadResenas: number
}

export default function DashboardPage() {
    const [query, setQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [items, setItems] = useState<ApiProfesorItem[]>([])

    // Cargar datos desde API cuando cambia la query (debounced simple)
    useEffect(() => {
        let cancelled = false
        const ctrl = new AbortController()
        setLoading(true)
        setError("")
        const q = query.trim()
        const url = new URL("/api/profesores", window.location.origin)
        if (q) url.searchParams.set("q", q)

        fetch(url.toString(), { signal: ctrl.signal, credentials: 'include' })
            .then(async (res) => {
                if (!res.ok) {
                    const j = await res.json().catch(() => ({}))
                    throw new Error(j?.error || 'No se pudo cargar profesores')
                }
                return res.json()
            })
            .then((j: { items: ApiProfesorItem[] }) => {
                if (!cancelled) setItems(Array.isArray(j.items) ? j.items : [])
            })
            .catch((e) => {
                if (!cancelled && e.name !== 'AbortError') setError(e.message || 'Error de red')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
            ctrl.abort()
        }
    }, [query])

    const mapped = useMemo(() => {
        return items.map((p) => ({
            id: p.id,
            name: p.nombreCompleto,
            department: p.departamento,
            university: p.universidad,
            materias: p.materias ?? [],
            // Se eliminan estas propiedades que causan problemas:
            // rating: p.calificacionPromedio ?? undefined,
            // reviewsCount: p.cantidadResenas,
        }))
    }, [items])

    return (
        <main className="min-h-dvh bg-[#0b0d12] text-primary font-sans">
            <section className="mx-auto max-w-7xl px-6 py-8">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl md:text-3xl font-medium">Dashboard</h1>

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

                {error && (
                    <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-3 py-2">
                        {error}
                    </div>
                )}

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mapped.map((p) => (
                        <ProfessorCard key={p.id} {...p} />
                    ))}
                </div>

                {!loading && mapped.length === 0 && (
                    <div className="mt-16 text-center text-white/60">
                        No se encontraron profesores{query ? ` para "${query}"` : ''}.
                    </div>
                )}

                {loading && (
                    <div className="mt-8 text-white/60 text-sm">Cargando profesores…</div>
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
