"use client"

import { useEffect, useId, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type SearchItem = { id: string; nombreCompleto: string }

type Semestre = { codigo: string }

export default function NewReviewPage() {
  const router = useRouter()

  const [professorId, setProfessorId] = useState("")
  const [query, setQuery] = useState("")
  const [rating, setRating] = useState(0)
  const [semestres, setSemestres] = useState<Semestre[]>([])
  const [semester, setSemester] = useState<string>("")
  const [comment, setComment] = useState("")
  const [anonymous, setAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)

  const selectedProfessor = useMemo(
    () => results.find((p) => p.id === professorId) || null,
    [professorId, results]
  )

  // Buscar en API cuando el usuario escribe
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    const ctrl = new AbortController()
    const run = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/profesores?q=${encodeURIComponent(q)}&limit=8`,
          { signal: ctrl.signal }
        )
        const json = await res.json()
        const items = Array.isArray(json.items)
          ? (json.items as SearchItem[])
          : []
        setResults(
          items.map((it) => ({ id: it.id, nombreCompleto: it.nombreCompleto }))
        )
      } catch {
        if (!ctrl.signal.aborted) setResults([])
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }
    run()
    return () => ctrl.abort()
  }, [query])

  const canSubmit = useMemo(() => {
    return (
      Boolean(professorId) && rating >= 0.5 && rating <= 5 && Boolean(semester)
    )
  }, [professorId, rating, semester])

  // Cargar semestres reales
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/semestres")
        const data = await res.json()
        const list = Array.isArray(data) ? (data as Semestre[]) : []
        setSemestres(list)
        const last = list.length ? list[list.length - 1].codigo : ""
        setSemester((prev) => prev || last)
      } catch {}
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      // Persistir reseña real
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profesorId: professorId,
          rating,
          semestreCodigo: semester,
          comentario: comment || null,
          anonimo: anonymous,
        }),
      })
      if (!res.ok) {
        throw new Error("No se pudo guardar la reseña")
      }
      // Navegar al perfil del profesor
      router.push(`/profesores/${professorId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[#0b0d12] text-primary font-sans">
      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            aria-label="Volver al dashboard"
            className="inline-flex items-center justify-center p-2 rounded-full border border-white/10 bg-[#0b0d12] text-primary hover:opacity-90 transition"
          >
            <ArrowLeftIcon />
          </Link>
          <h1 className="text-2xl md:text-3xl font-medium">Nueva reseña</h1>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Profesor (buscador) */}
          <div>
            <label
              htmlFor="prof-search"
              className="block text-xs uppercase tracking-widest text-white/60 mb-2"
            >
              Buscar profesor
            </label>
            <div className="relative">
              <input
                id="prof-search"
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (professorId) setProfessorId("")
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 120)}
                placeholder="Escribe el nombre del profesor…"
                className="w-full h-12 rounded-full bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
                <SearchIcon />
              </div>

              {focused && query.trim() && (
                <div className="absolute z-10 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-white/10 bg-[#121621] p-1">
                  {results.length > 0 ? (
                    results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={() => {
                          setProfessorId(p.id)
                          setQuery(p.nombreCompleto)
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-white/80 hover:bg-white/5"
                      >
                        {p.nombreCompleto}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-white/60">
                      {loading ? "Buscando…" : "Sin resultados"}
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedProfessor && (
              <div className="mt-2 text-xs text-white/60">
                Seleccionado:{" "}
                <span className="text-white/80">
                  {selectedProfessor.nombreCompleto}
                </span>
              </div>
            )}
          </div>

          {/* Calificación (estrellas con 0.5) */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
              Calificación general
            </label>
            <div className="flex items-center justify-center gap-3 w-full">
              <StarRating value={rating} onChange={setRating} />
              <span className="inline-flex items-center rounded-full border border-white/10 bg-[#0b0d12] px-3 py-1 text-sm">
                {rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Semestre */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
              Semestre
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecciona un semestre</option>
              {semestres.map((s) => (
                <option
                  key={s.codigo}
                  value={s.codigo}
                  className="bg-[#0b0d12]"
                >
                  {s.codigo}
                </option>
              ))}
            </select>
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comparte detalles útiles para otros estudiantes…"
              className="w-full rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Anónimo */}
          <label className="inline-flex items-center gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="size-4 rounded border-white/20 bg-[#0b0d12]"
            />
            Publicar como anónimo
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="inline-flex items-center rounded-xl bg-primary text-[#0b0d12] px-6 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {isSubmitting ? "Enviando…" : "Enviar reseña"}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="11 18 6 12 11 6"></polyline>
      <line x1="18" y1="12" x2="6" y2="12"></line>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value

  function handleMouseMove(
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const rel = (e.clientX - rect.left) / rect.width
    const half = rel < 0.5 ? 0.5 : 1
    const newVal = index + half // index is 0-based
    setHover(Math.max(0.5, Math.min(5, newVal)))
  }

  function handleClick() {
    if (hover) onChange(Number(hover.toFixed(1)))
  }

  function fractionFor(starIndex: number) {
    const f = Math.max(0, Math.min(1, display - starIndex))
    if (f >= 1) return 1
    if (f >= 0.5) return 0.5
    return 0
  }

  return (
    <div
      className="flex items-center select-none"
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="p-1 cursor-pointer"
          onMouseMove={(e) => handleMouseMove(e, i)}
          onClick={handleClick}
          aria-label={`Star ${i + 1}`}
        >
          <Star fraction={fractionFor(i)} />
        </div>
      ))}
    </div>
  )
}

function Star({ fraction }: { fraction: 0 | 0.5 | 1 }) {
  const id = useId()
  const size = 22
  const path =
    "M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.402 8.169L12 18.896l-7.336 3.87 1.402-8.169L.132 9.211l8.2-1.193L12 .587z"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={24 * (fraction as number)} height="24" />
        </clipPath>
      </defs>
      {/* empty star outline */}
      <path d={path} fill="none" stroke="#3b4453" strokeWidth="1.2" />
      {/* filled part */}
      <g clipPath={`url(#${id})`}>
        <path d={path} fill="#b9d9ff" />
      </g>
    </svg>
  )
}
