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
    semesterRatings: [
      { semester: "2023-1", rating: 4.5 },
      { semester: "2023-2", rating: 4.6 },
      { semester: "2024-1", rating: 4.7 },
      { semester: "2024-2", rating: 4.7 },
    ],
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
    semesterRatings: [
      { semester: "2023-1", rating: 4.0 },
      { semester: "2023-2", rating: 4.1 },
      { semester: "2024-1", rating: 4.2 },
      { semester: "2024-2", rating: 4.3 },
    ],
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
    semesterRatings: [
      { semester: "2023-1", rating: 4.8 },
      { semester: "2023-2", rating: 4.9 },
      { semester: "2024-1", rating: 4.9 },
      { semester: "2024-2", rating: 4.9 },
    ],
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
    semesterRatings: [
      { semester: "2023-1", rating: 4.3 },
      { semester: "2023-2", rating: 4.4 },
      { semester: "2024-1", rating: 4.5 },
      { semester: "2024-2", rating: 4.5 },
    ],
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
    semesterRatings: [
      { semester: "2023-1", rating: 4.0 },
      { semester: "2023-2", rating: 4.1 },
      { semester: "2024-1", rating: 4.2 },
      { semester: "2024-2", rating: 4.2 },
    ],
  },
] as const

function getProfessor(id: string) {
  return DEMO.find((p) => p.id === id)
}

export default async function ProfessorProfile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const prof = getProfessor(id)
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

        {/* Widgets de estadísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Widget de calificación promedio */}
          <div className="rounded-2xl border border-white/10 bg-[#121621] p-6">
            <div className="text-xs uppercase tracking-widest text-white/60">
              Calificación promedio
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-medium text-primary">
                {prof.rating.toFixed(1)}
              </span>
              <span className="text-sm text-white/60">
                ({prof.reviewsCount} reseñas)
              </span>
            </div>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={star <= Math.round(prof.rating) ? "text-primary" : "text-white/20"}
                />
              ))}
            </div>
          </div>

          {/* Widget de evolución por semestre */}
          <div className="rounded-2xl border border-white/10 bg-[#121621] p-6">
            <div className="text-xs uppercase tracking-widest text-white/60">
              Evolución por semestre
            </div>
            {prof.semesterRatings && (
              <div className="mt-4">
                <RatingChart data={prof.semesterRatings} />
              </div>
            )}
          </div>
        </div>

        {/* Sección de reseñas (placeholder) */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-[#121621] p-6 md:p-8">
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

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.402 8.169L12 18.896l-7.336 3.87 1.402-8.169L.132 9.211l8.2-1.193L12 .587z" />
    </svg>
  )
}

type Point = { semester: string; rating: number }

function RatingChart({ data }: { data: readonly Point[] }) {
  const width = 480
  const height = 160
  const padding = 24

  const xs = data.map((_, i) => padding + (i * (width - padding * 2)) / Math.max(1, data.length - 1))

  // Escala fija 1..5 como eje principal
  const yMin = 1
  const yMax = 5
  const y = (r: number) => padding + (height - padding * 2) * (1 - (r - yMin) / (yMax - yMin))

  const dPath = xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y(data[i].rating).toFixed(1)}`)
    .join(" ")

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-40 text-white/15"
        role="img"
        aria-label="Evolución de calificación por semestre"
      >
        <rect x="0" y="0" width={width} height={height} fill="none" />

        {/* Grid y ticks del eje Y (1 a 5) */}
        {[1, 2, 3, 4, 5].map((val) => {
          const gy = y(val)
          return (
            <g key={`y-${val}`}>
              <line
                x1={padding}
                y1={gy}
                x2={width - padding}
                y2={gy}
                stroke="currentColor"
                className="text-white/10"
                strokeDasharray="2 3"
              />
              <text x={padding - 8} y={gy + 3} textAnchor="end" fontSize="10" fill="#9aa3b2">
                {val}
              </text>
            </g>
          )
        })}

        {/* Ejes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" />

        {/* Línea principal */}
        <path d={dPath} fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" />

        {/* Puntos con tooltip (burbuja) */}
        {xs.map((x, i) => {
          const yy = y(data[i].rating)
          return (
            <g key={i} className="group">
              <circle
                cx={x}
                cy={yy}
                r={3}
                className="fill-[#b9d9ff] stroke-[#0b0d12]"
                strokeWidth="1"
              />
              {/* Tooltip */}
              <g
                transform={`translate(${x}, ${yy - 18})`}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
              >
                <rect x={-22} y={-16} width={44} height={18} rx={6} fill="#0b0d12" stroke="rgba(255,255,255,0.15)" />
                <text x={0} y={-4} textAnchor="middle" fontSize="10" fill="#b9d9ff">
                  {data[i].rating.toFixed(1)}
                </text>
                <polygon points="0,0 -4,6 4,6" fill="#0b0d12" stroke="rgba(255,255,255,0.15)" />
              </g>
            </g>
          )
        })}

        {/* Labels de semestre (eje X) */}
        {xs.map((x, i) => (
          <text key={`t-${i}`} x={x} y={height - padding + 14} textAnchor="middle" fontSize="10" fill="#9aa3b2">
            {data[i].semester}
          </text>
        ))}
      </svg>
    </div>
  )
}

