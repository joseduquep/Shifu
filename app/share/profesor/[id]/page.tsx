import Link from "next/link"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { Metadata } from "next"
import { ShareButton } from "./ShareButton"

// Componente para generar metadatos dinámicos
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const hdrs = await headers()
  const envBase = process.env.NEXT_PUBLIC_BASE_URL
  const proto = hdrs.get("x-forwarded-proto") || "http"
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000"
  const runtimeBase = `${proto}://${host}`
  const baseUrl = envBase && /^https?:\/\//.test(envBase) ? envBase : runtimeBase

  try {
    const res = await fetch(`${baseUrl}/api/profesores/${id}`, { cache: "no-store" })
    if (!res.ok) {
      return {
        title: "Profesor no encontrado - Shifu",
        description: "El perfil del profesor no está disponible",
      }
    }
    const prof = await res.json()

    return {
      title: `${prof.nombreCompleto} - Profesor en Shifu`,
      description: `Conoce a ${prof.nombreCompleto}, profesor de ${prof.departamento} en ${prof.universidad}. ${prof.bio ? prof.bio.substring(0, 150) + '...' : 'Especialista en su área académica.'}`,
      openGraph: {
        title: `${prof.nombreCompleto} - Profesor en Shifu`,
        description: `Conoce a ${prof.nombreCompleto}, profesor de ${prof.departamento} en ${prof.universidad}.`,
        type: "profile",
        url: `${baseUrl}/share/profesor/${id}`,
        images: [
          {
            url: `${baseUrl}/api/og/profesor/${id}`, // Futuro: imagen generada
            width: 1200,
            height: 630,
            alt: `Perfil de ${prof.nombreCompleto}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${prof.nombreCompleto} - Profesor en Shifu`,
        description: `Conoce a ${prof.nombreCompleto}, profesor de ${prof.departamento} en ${prof.universidad}.`,
        images: [`${baseUrl}/api/og/profesor/${id}`],
      },
    }
  } catch (error) {
    return {
      title: "Profesor no encontrado - Shifu",
      description: "El perfil del profesor no está disponible",
    }
  }
}

export default async function SharedProfessorProfile({
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
  } catch (err) {
    console.error('Error obteniendo resumen:', err)
  }

  return (
    <main className="min-h-dvh bg-[#0b0d12] text-primary font-sans">
      {/* Header con logo y CTA */}
      <header className="border-b border-white/10 bg-[#0b0d12]/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-primary">
              Shifu
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-4 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              Explorar más profesores
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-[#121621] p-6 md:p-8">
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
              <ShareButton profesorId={id} nombreProfesor={prof.nombreCompleto} />
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

          {/* Materias que imparte */}
          {Array.isArray(prof.materias) && prof.materias.length > 0 && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#1a1d26] p-6">
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

          {/* Sección de compartir */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-white">¿Te interesa este profesor?</h3>
                <p className="text-sm text-white/60 mt-1">
                  Únete a Shifu para ver más profesores y acceder a funciones avanzadas
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <ShareButton profesorId={id} nombreProfesor={prof.nombreCompleto} />
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-6 py-3 text-sm font-medium hover:opacity-90 transition"
                >
                  Explorar Shifu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

