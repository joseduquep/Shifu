import Link from "next/link"
import { notFound } from "next/navigation"
import { supabasePublic } from "@/lib/supabase/public-client"

export const dynamic = "force-dynamic"

type MateriaRow = { materia_id: string; nombre: string }

type StatRow = {
    profesor_id: string
    calificacion_promedio: number | null
    cantidad_resenas: number
}

type SerieRow = {
    semestre_codigo: string
    calificacion_promedio: number | string
    cantidad_resenas: number
}

type ProfesorJoined = {
    id: string
    nombre_completo: string
    bio: string | null
    departamentos: {
        id: string
        nombre?: string
        universidades?: { id: string; nombre?: string } | null
    } | null
}

interface ApiMateria {
    id: string
    nombre: string
}

interface ApiResponse {
    id: string
    nombreCompleto: string
    bio: string | null
    departamento: string
    universidad: string
    materias: ApiMateria[]
    calificacionPromedio: number | null
    cantidadResenas: number
    ratingsPorSemestre: { semestre: string; rating: number }[]
}

function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")
}

async function fetchProfessor(id: string): Promise<ApiResponse | null> {
    try {
        const { data, error } = await supabasePublic
            .from('profesores')
            .select(
                'id, nombre_completo, bio, departamentos:departamento_id ( id, nombre, universidades:universidad_id ( id, nombre ) )'
            )
            .eq('id', id)
            .single()

        if (error || !data) {
            console.error("Error fetching professor:", error)
            return null
        }

        const row = data as unknown as ProfesorJoined

        const { data: srow } = await supabasePublic
            .from('v_profesores_estadisticas')
            .select('profesor_id, calificacion_promedio, cantidad_resenas')
            .eq('profesor_id', id)
            .single()

        const { data: materias } = await supabasePublic
            .from('v_profesores_materias_activas')
            .select('materia_id, nombre')
            .eq('profesor_id', id)

        const { data: series } = await supabasePublic
            .from('v_profesores_ratings_por_semestre')
            .select('semestre_codigo, calificacion_promedio, cantidad_resenas')
            .eq('profesor_id', id)
            .order('semestre_codigo', { ascending: true })

        return {
            id: row.id,
            nombreCompleto: row.nombre_completo,
            bio: row.bio ?? null,
            departamento: row.departamentos?.nombre ?? '',
            universidad: row.departamentos?.universidades?.nombre ?? '',
            materias: ((materias as MateriaRow[] | null) ?? []).map((m) => ({ id: m.materia_id, nombre: m.nombre })),
            calificacionPromedio: (srow as StatRow | null)?.calificacion_promedio ?? null,
            cantidadResenas: (srow as StatRow | null)?.cantidad_resenas ?? 0,
            ratingsPorSemestre: ((series as SerieRow[] | null) ?? []).map((s) => ({ semestre: s.semestre_codigo, rating: Number(s.calificacion_promedio) })),
        }
    } catch (error) {
        console.error("Error fetching professor:", error)
        return null
    }
}

export default async function ProfessorProfile(
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const prof = await fetchProfessor(id)
    if (!prof) notFound()

    return (
        <main className="min-h-dvh bg-[#0b0d12] text-primary font-sans">
            <section className="mx-auto max-w-4xl px-6 py-8">
                {/* Botón volver */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-white/70 hover:text-white transition text-sm"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Volver al dashboard
                </Link>

                {/* Card del profesor */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-[#121621] p-8">
                    {/* Header con avatar e info */}
                    <div className="flex items-start gap-6">
                        <div className="size-20 rounded-2xl bg-[#0b0d12] grid place-items-center border border-white/10 text-white text-2xl font-medium shrink-0">
                            {initials(prof.nombreCompleto)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-3xl font-medium text-white">{prof.nombreCompleto}</h1>
                            <div className="mt-2 text-white/60">
                                {prof.departamento}
                                {prof.universidad && ` · ${prof.universidad}`}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {prof.bio && (
                        <div className="mt-6">
                            <h2 className="text-xs uppercase tracking-widest text-white/60 mb-3">Biografía</h2>
                            <p className="text-white/80 leading-relaxed">{prof.bio}</p>
                        </div>
                    )}

                    {/* Materias activas */}
                    {prof.materias.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xs uppercase tracking-widest text-white/60 mb-3">
                                Materias activas
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {prof.materias.map(m => (
                                    <span
                                        key={m.id}
                                        className="inline-flex items-center rounded-full border border-white/10 bg-[#0b0d12] px-3 py-1.5 text-sm text-white/70"
                                    >
                                        {m.nombre}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}
