import Link from "next/link"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { FavoriteButton } from "@/app/components/FavoriteButton"
import { ShareProfileButton } from "@/app/components/ShareProfileButton"

export default async function ProfessorProfile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const hdrs = await headers()
  const envBase = process.env.NEXT_PUBLIC_BASE_URL
  const proto = hdrs.get("x-forwarded-proto") || "http"
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000"
  const runtimeBase = `${proto}://${host}`
  const baseUrl = envBase && /^https?:\/\//.test(envBase) ? envBase : runtimeBase
  const res = await fetch(`${baseUrl}/api/profesores/${id}`, { cache: "no-store" })
  if (!res.ok) return notFound()
  const prof = await res.json()

  // Obtener resumen generado por IA
  let resumenIA = null
  try {
    const resumenRes = await fetch(`${baseUrl}/api/profesores/${id}/resumen`, { cache: "no-store" })
    if (resumenRes.ok) {
      const resumenData = await resumenRes.json()
      resumenIA = resumenData.resumen
    }
  } catch (error) {
    console.error('Error obteniendo resumen:', error)
  }

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
                {prof.nombreCompleto
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p: string) => p[0]?.toUpperCase())
                  .join("")}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-medium text-white">
                  {prof.nombreCompleto}
                </h1>
                <div className="mt-1 text-sm text-white/60">
                  {prof.departamento} · {prof.universidad}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShareProfileButton profesorId={id} nombreProfesor={prof.nombreCompleto} />
              <FavoriteButton 
                profesorId={id} 
                size="md" 
                variant="both"
              />
            </div>
            </div>

            {/* Resumen generado por IA */}
            {resumenIA && (
              <div className="mt-6 p-4 rounded-2xl bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-primary mb-1">Resumen Profesional</h3>
                    <p className="text-white/90 text-sm leading-relaxed">{resumenIA}</p>
                  </div>
                </div>
              </div>
            )}

            {prof.bio && (
              <p className="mt-6 text-white/80 leading-relaxed">{prof.bio}</p>
            )}

          {Array.isArray(prof.materias) && prof.materias.length ? (
            <div className="mt-8">
              <div className="text-xs uppercase tracking-widest text-white/60">
                Materias activas
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {prof.materias.map((m: any) => (
                  <span
                    key={m.id ?? m}
                    className="inline-flex items-center rounded-full border border-white/10 bg-[#0b0d12] px-2.5 py-1 text-xs text-white/70"
                  >
                    {typeof m === 'string' ? m : m.nombre}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Materias que imparte */}
        {Array.isArray(prof.materias) && prof.materias.length > 0 && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#121621] p-6">
            <div className="text-xs uppercase tracking-widest text-white/60">
              Materias que imparte
            </div>
            <div className="mt-4 space-y-3">
              {prof.materias.map((materia: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-[#0b0d12]">
                  <div>
                    <div className="text-white font-medium">{materia.nombre || materia}</div>
                    <div className="text-xs text-white/60 mt-1">
                      {materia.departamento ? `Departamento de ${materia.departamento}` : prof.departamento}
                    </div>
                  </div>
                  <div className="text-xs text-white/40">
                    {materia.departamento || prof.departamento}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

// Eliminado: StarIcon ya no es necesario sin calificaciones
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

