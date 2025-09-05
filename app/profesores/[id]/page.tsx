import Link from "next/link"
import { notFound } from "next/navigation"

// Datos de ejemplo (mismos ids que el dashboard)
const DEMO = [
  {
    id: "1",
    name: "Ana María Gómez",
    department: "Matemáticas",
    university: "EAFIT",
    rating: 4.7,
    reviewsCount: 128,
    materias: ["Cálculo", "Estadística"],
    bio:
      "Profesora con enfoque práctico en fundamentos de cálculo y estadística aplicada.",
  },
  {
    id: "2",
    name: "Carlos Pérez",
    department: "Ingeniería de Sistemas",
    university: "EAFIT",
    rating: 4.3,
    reviewsCount: 86,
    materias: ["Algoritmos", "Arquitectura"],
    bio: "Interesado en diseño de sistemas escalables y complejidad algorítmica.",
  },
  {
    id: "3",
    name: "Laura Restrepo",
    department: "Humanidades",
    university: "EAFIT",
    rating: 4.9,
    reviewsCount: 204,
    materias: ["Escritura", "Ética"],
    bio: "Énfasis en pensamiento crítico y escritura académica efectiva.",
  },
  {
    id: "4",
    name: "Julián Ramírez",
    department: "Finanzas",
    university: "EAFIT",
    rating: 4.5,
    reviewsCount: 73,
    materias: ["Econometría", "Mercados"],
    bio: "Analiza mercados con herramientas cuantitativas aplicadas.",
  },
  {
    id: "5",
    name: "María Fernanda Toro",
    department: "Diseño",
    university: "EAFIT",
    rating: 4.2,
    reviewsCount: 51,
    materias: ["UX", "Prototipado"],
    bio: "Explora experiencias centradas en el usuario y procesos de prototipado.",
  },
] as const

function getProfessor(id: string) {
  return DEMO.find((p) => p.id === id)
}

export default function ProfessorProfile({
  params,
}: {
  params: { id: string }
}) {
  const prof = getProfessor(params.id)
  if (!prof) return notFound()

  return (
    <main className="min-h-dvh bg-[#0b0d12] text-primary font-sans">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            aria-label="Volver al dashboard"
            className="inline-flex items-center justify-center p-2 rounded-full border border-white/10 bg-[#0b0d12] text-primary hover:opacity-90 transition"
          >
            <ArrowLeftIcon />
          </Link>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-[#121621] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-[#0b0d12] grid place-items-center border border-white/10 text-white/80 text-lg font-medium">
                {prof.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join("")}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-medium text-white">
                  {prof.name}
                </h1>
                <div className="mt-1 text-sm text-white/60">
                  {prof.department} · {prof.university}
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0b0d12] px-4 py-2 text-sm text-white/80">
              <span className="text-primary font-medium">{prof.rating.toFixed(1)}</span>
              <span className="text-white/50">({prof.reviewsCount} reseñas)</span>
            </div>
          </div>

          {prof.bio && (
            <p className="mt-6 text-white/80 leading-relaxed">{prof.bio}</p>
          )}

          {prof.materias?.length ? (
            <div className="mt-8">
              <div className="text-xs uppercase tracking-widest text-white/60">
                Materias activas
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {prof.materias.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center rounded-full border border-white/10 bg-[#0b0d12] px-2.5 py-1 text-xs text-white/70"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Sección de reseñas (placeholder) */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#121621] p-6 md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Reseñas recientes</h2>
            <span className="text-xs text-white/60">Próximamente</span>
          </div>
          <div className="mt-4 text-white/60 text-sm">
            Aún no hay reseñas disponibles en esta demo.
          </div>
        </div>
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

