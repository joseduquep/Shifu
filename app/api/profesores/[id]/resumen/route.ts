import { NextRequest, NextResponse } from 'next/server'
import { supabasePublic } from '@/lib/supabase/public-client'

type ProfesorRow = {
    id: string
    nombre_completo: string
    bio: string | null
    raw_scraped_data: any | null
    departamentos: {
        id: string
        nombre: string
        universidades: { id: string; nombre: string } | null
    } | null
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params
    const GROQ_API_KEY = process.env.GROQ_API_KEY

    try {
        // Profesor + raw_scraped_data para usar la bio y tags reales del perfil
        const { data, error } = await supabasePublic
            .from('profesores')
            .select(
                'id, nombre_completo, bio, raw_scraped_data, departamentos:departamento_id ( id, nombre, universidades:universidad_id ( id, nombre ) )'
            )
            .eq('id', id)
            .single()

        if (error || !data) {
            console.error('Error al obtener profesor:', error)
            return NextResponse.json({
                resumen: 'Información del profesor no disponible.',
            })
        }

        const profesor = data as unknown as ProfesorRow

        // Materias desde la vista (campo correcto: materia_nombre)
        const { data: materias } = await supabasePublic
            .from('v_profesores_materias_activas')
            .select('materia_nombre')
            .eq('profesor_id', id)

        const nombreProfesor = profesor.nombre_completo
        const raw = profesor.raw_scraped_data || {}
        const scraped = (raw?.scrapedData ?? {}) as any

        // Preferir bio scrapeada si existe
        const bioProfesor =
            scraped?.bio?.trim?.() ||
            profesor.bio?.trim?.() ||
            'No disponible'

        const nombreDepto = profesor.departamentos?.nombre || 'Departamento desconocido'
        const nombreUni = profesor.departamentos?.universidades?.nombre || 'Universidad desconocida'

        const materiasTexto =
            (materias?.map((m: any) => m.materia_nombre).filter(Boolean) || []).join(', ') || 'ninguna'

        // Chips del scrape (si existen) para enriquecer el prompt
        const areas = (raw?.areasConocimiento || scraped?.areasConocimiento || []) as string[]
        const programas = (raw?.programas || scraped?.programas || []) as string[]
        const grupos = (raw?.gruposInvestigacion || scraped?.gruposInvestigacion || []) as string[]

        const extrasTexto = [
            areas.length ? `Áreas: ${areas.slice(0, 5).join(', ')}` : '',
            programas.length ? `Programas: ${programas.slice(0, 5).join(', ')}` : '',
            grupos.length ? `Grupos: ${grupos.slice(0, 5).join(', ')}` : '',
        ]
            .filter(Boolean)
            .join('\n')

        const prompt = `Genera un resumen profesional sobre este profesor universitario. IMPORTANTE:
- Escribe en tercera persona SIN frases introductorias.
- Máximo 5-6 líneas.
- No menciones el nombre (ya se muestra).
- Comienza con su rol/especialidad/logros.
- Menciona su departamento y materias si aportan contexto.
- Estilo formal y conciso.

Datos:
Departamento: ${nombreDepto}
Universidad: ${nombreUni}
Materias: ${materiasTexto}
${extrasTexto ? extrasTexto + '\n' : ''}Bio: ${bioProfesor}`

        // Si no hay API key, devolver fallback razonable usando los datos reales
        if (!GROQ_API_KEY) {
            console.error('GROQ_API_KEY no configurada')
            const fallback = construirFallback(nombreDepto, materiasTexto, areas)
            return NextResponse.json({ resumen: fallback })
        }

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        {
                            role: 'system',
                            content: 'Genera resúmenes académicos concisos, en tercera persona, sin frases introductorias.',
                        },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.4,
                    max_tokens: 110,
                }),
            })

            if (!response.ok) {
                throw new Error(`Error en API: ${response.status}`)
            }

            const body = await response.json()
            let resumen = body.choices?.[0]?.message?.content || ''

            // Limpieza de posibles introducciones o redundancias
            resumen = resumen.replace(/^(A continuación|Este es|El siguiente|Aquí hay|Te presento|Presento|Resumen)[^:]*:?\s*/i, '')
            resumen = resumen.replace(/^(El profesor|La profesora|El docente|La docente)\s+[A-Za-zÁ-Úá-úÑñ\s]+\s+es\b/i, 'Es')
            resumen = resumen.replace(/^\s+|\s+$/g, '')

            if (!resumen) {
                const fallback = construirFallback(nombreDepto, materiasTexto, areas)
                return NextResponse.json({ resumen: fallback })
            }

            return NextResponse.json({ resumen })
        } catch (apiError) {
            console.error('Error en API de generación:', apiError)
            const fallback = construirFallback(nombreDepto, materiasTexto, areas)
            return NextResponse.json({ resumen: fallback })
        }
    } catch (err) {
        console.error('Error generando resumen:', err)
        return NextResponse.json({
            resumen: 'Especialista académico con experiencia en docencia universitaria.',
        })
    }
}

function construirFallback(departamento: string, materiasTexto: string, areas: string[]) {
    const areaPrincipal = areas?.[0]
    if (materiasTexto !== 'ninguna' && areaPrincipal) {
        return `Docente del departamento de ${departamento}, con enfoque en ${areaPrincipal} y experiencia impartiendo ${materiasTexto}.`
    }
    if (materiasTexto !== 'ninguna') {
        return `Docente del departamento de ${departamento}, con experiencia impartiendo ${materiasTexto}.`
    }
    if (areaPrincipal) {
        return `Docente del departamento de ${departamento}, con enfoque en ${areaPrincipal}.`
    }
    return `Docente del departamento de ${departamento}.`
}
