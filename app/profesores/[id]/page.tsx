import Link from "next/link"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
// Estos componentes importados se asume que manejan su propio estilo y lógica.
import { FavoriteButton } from "@/app/components/FavoriteButton"
import { ShareProfileButton } from "@/app/components/ShareProfileButton"

export default async function ProfessorProfile({
                                                   params,
                                               }: {
    params: Promise<{ id: string }>
}) {
    // --- Lógica de Next.js (No modificada) ---
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

    // Obtener resumen generado por IA (Lógica no modificada)
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
    // --- Fin Lógica de Next.js ---


    return (
        <main className="min-h-dvh bg-[#0b0d12] text-white font-sans p-4 md:p-8">
            <section className="mx-auto max-w-4xl">

                {/* Botón de regreso minimalista y llamativo */}
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        aria-label="Volver al dashboard"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white transition duration-300 group"
                    >
                        <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                        <span className="text-sm font-medium tracking-wider">Volver</span>
                    </Link>
                </div>

                {/* Contenedor principal del perfil (Minimalista con efecto 'flotante') */}
                <div className="bg-[#121621] rounded-3xl p-6 md:p-10 shadow-2xl shadow-black/50 border border-white/5">

                    {/* 1. SECCIÓN DE ENCABEZADO Y ACCIONES */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-white/10 mb-8">
                        <div className="flex items-start gap-5">
                            {/* Avatar más grande y angular */}
                            {prof.fotografia ? (
                                <img
                                    src={prof.fotografia}
                                    alt={prof.nombreCompleto}
                                    className="size-20 rounded-xl object-cover border-2 border-white/20 shadow-lg"
                                />
                            ) : (
                                <div className="size-20 rounded-xl bg-[#0b0d12] grid place-items-center border border-white/10 text-white/80 text-2xl font-semibold flex-shrink-0">
                                    {prof.nombreCompleto
                                        .split(" ")
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((p: string) => p[0]?.toUpperCase())
                                        .join("")}
                                </div>
                            )}

                            {/* Título y Subtítulo */}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
                                    {prof.nombreCompleto}
                                </h1>
                                <div className="mt-1 text-base text-white/50 font-light">
                                    <span className="font-medium text-white/70">{prof.departamento}</span> en {prof.universidad}
                                </div>
                            </div>
                        </div>

                        {/* Botones de acción (Componentes externos) */}
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                            {/* Manteniendo la funcionalidad original de los componentes externos */}
                            <ShareProfileButton profesorId={id} nombreProfesor={prof.nombreCompleto} />
                            {/* Fix: Se eliminó el prop 'variant' para evitar el error TS2322 */}
                            <FavoriteButton profesorId={id} size="md" />
                        </div>
                    </div>

                    {/* 2. RESUMEN GENERADO POR IA (Efecto llamativo en tonos azules) */}
                    {resumenIA && (
                        <div className="mb-8 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg shadow-blue-500/10 transition duration-300 hover:shadow-blue-500/20">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                    <ZapIcon className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm uppercase tracking-widest font-bold text-white/70 mb-2">Resumen Profesional (IA)</h3>
                                    <p className="text-white/90 text-base leading-relaxed font-light">{resumenIA}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. BIOGRAFÍA */}
                    {prof.bio && (
                        <div className="mb-8 p-4 rounded-xl bg-white/5">
                            <p className="text-white/80 leading-loose text-sm italic">{prof.bio}</p>
                        </div>
                    )}

                    {/* 4. INFORMACIÓN CLAVE EN FORMATO GRID MODERNO */}
                    <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Card de Correo */}
                        <div className="rounded-xl p-4 bg-white/5 border border-white/5 shadow-inner shadow-black/20">
                            <div className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-1">Correo Electrónico</div>
                            <div className="text-white/90 font-medium break-words text-sm">{prof.email ?? 'No disponible'}</div>
                        </div>
                        {/* Card de Miembro Desde */}
                        <div className="rounded-xl p-4 bg-white/5 border border-white/5 shadow-inner shadow-black/20">
                            <div className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-1">Miembro Desde</div>
                            <div className="text-white/90 font-medium text-sm">{prof.miembroDesde ? new Date(prof.miembroDesde).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No disponible'}</div>
                        </div>
                        {/* Card de Departamento */}
                        <div className="rounded-xl p-4 bg-white/5 border border-white/5 shadow-inner shadow-black/20">
                            <div className="text-xs uppercase tracking-widest font-semibold text-white/60 mb-1">Departamento Principal</div>
                            <div className="text-white/90 font-medium text-sm">{prof.departamento}</div>
                        </div>
                    </div>

                    {/* 5. SECCIONES DE TAGS Y LISTAS (Materias, Áreas, Programas, Grupos) */}
                    <div className="space-y-6">

                        {/* Materias activas (Tags) */}
                        {Array.isArray(prof.materias) && prof.materias.length > 0 && (
                            <div>
                                {/* Detalle en azul */}
                                <div className="text-xs uppercase tracking-widest font-bold text-white/60 mb-3 border-l-4 border-blue-500 pl-2">
                                    Materias Activas
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {prof.materias.map((m: any) => (
                                        <span
                                            key={m.id ?? m}
                                            className="inline-flex items-center rounded-full bg-[#0b0d12] px-3 py-1 text-xs text-white/70 font-medium border border-white/10 hover:bg-white/10 transition"
                                        >
                      {typeof m === 'string' ? m : `${m.nombre}${m.codigo ? ` - ${m.codigo}` : ''}`}
                    </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Áreas de conocimiento */}
                        {Array.isArray(prof.areasConocimiento) && prof.areasConocimiento.length > 0 && (
                            <div>
                                {/* Detalle en azul */}
                                <div className="text-xs uppercase tracking-widest font-bold text-white/60 mb-3 border-l-4 border-blue-500 pl-2">Áreas de Conocimiento</div>
                                <div className="flex flex-wrap gap-2">
                                    {prof.areasConocimiento.map((t: string, i: number) => (
                                        <span key={i} className="inline-flex items-center rounded-full bg-[#0b0d12] px-3 py-1 text-xs text-white/70 font-light border border-white/10">
                      {t}
                    </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Programas y Grupos de investigación en una fila */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Programas */}
                            {Array.isArray(prof.programas) && prof.programas.length > 0 && (
                                <div>
                                    {/* Detalle en azul */}
                                    <div className="text-xs uppercase tracking-widest font-bold text-white/60 mb-3 border-l-4 border-blue-500 pl-2">Programas</div>
                                    <div className="flex flex-wrap gap-2">
                                        {prof.programas.map((t: string, i: number) => (
                                            <span key={i} className="inline-flex items-center rounded-full bg-[#0b0d12] px-3 py-1 text-xs text-white/70 font-light border border-white/10">
                                    {t}
                                </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Grupos de investigación */}
                            {Array.isArray(prof.gruposInvestigacion) && prof.gruposInvestigacion.length > 0 && (
                                <div>
                                    {/* Detalle en azul */}
                                    <div className="text-xs uppercase tracking-widest font-bold text-white/60 mb-3 border-l-4 border-blue-500 pl-2">Grupos de Investigación</div>
                                    <div className="flex flex-wrap gap-2">
                                        {prof.gruposInvestigacion.map((t: string, i: number) => (
                                            <span key={i} className="inline-flex items-center rounded-full bg-[#0b0d12] px-3 py-1 text-xs text-white/70 font-light border border-white/10">
                                    {t}
                                </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                </div>

                {/* 6. LISTA DETALLADA DE MATERIAS QUE IMPARTE */}
                {Array.isArray(prof.materias) && prof.materias.length > 0 && (
                    <div className="mt-8 rounded-3xl p-6 border border-white/10 bg-[#121621] shadow-xl shadow-black/50">
                        <h2 className="text-lg uppercase tracking-widest font-bold text-white/60 mb-4">Detalle de Cursos</h2>
                        <div className="space-y-3">
                            {prof.materias.map((materia: any, index: number) => (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/5 bg-[#0b0d12] transition duration-200 hover:bg-white/5">
                                    <div>
                                        <div className="text-white font-semibold text-base">{materia.nombre || materia}</div>
                                        <div className="text-sm text-white/50 mt-1">
                                            Código: {materia.codigo || 'N/A'}
                                            <span className="mx-2 text-white/30">•</span>
                                            Departamento: {materia.departamento || prof.departamento}
                                        </div>
                                    </div>
                                    <div className="text-sm text-white/40 font-mono mt-2 sm:mt-0 sm:text-right">
                                        {materia.codigo || (typeof materia === 'string' ? 'N/A' : prof.departamento.substring(0, 3).toUpperCase())}
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

// --- Componentes de Ícono (Helper Functions) ---

// Icono para el resumen de IA
// Fix: Tipificación explícita de props para evitar TS7006
function ZapIcon(props: { className?: string }) {
    return (
        <svg
            {...props}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
    )
}

// Icono para el botón de regreso
// Fix: Tipificación explícita de props para evitar TS7006
function ArrowLeftIcon(props: { className?: string }) {
    return (
        <svg
            {...props}
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
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    )
}
