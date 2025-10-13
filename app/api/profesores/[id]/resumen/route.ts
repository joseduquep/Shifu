import { NextRequest, NextResponse } from 'next/server'
import { supabasePublic } from '@/lib/supabase/public-client'

// Definir tipos basados en el archivo de perfil que ya funciona
type ProfesorRow = {
    id: string
    nombre_completo: string
    bio: string | null
    departamentos: {
        id: string
        nombre: string
        universidades: {
            id: string
            nombre: string
        } | null
    } | null
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params

    // Verificar la API key
    const GROQ_API_KEY = process.env.GROQ_API_KEY

    if (!GROQ_API_KEY) {
        console.error("API key no configurada")
        return NextResponse.json({
            resumen: "Profesor del departamento académico. Imparte cursos en la institución."
        })
    }

    try {
        // Obtener datos del profesor
        const { data, error } = await supabasePublic
            .from('profesores')
            .select(
                'id, nombre_completo, bio, departamentos:departamento_id ( id, nombre, universidades:universidad_id ( id, nombre ) )'
            )
            .eq('id', id)
            .single()

        if (error || !data) {
            console.error("Error al obtener profesor:", error)
            return NextResponse.json({
                resumen: "Información del profesor no disponible."
            })
        }

        const profesor = data as unknown as ProfesorRow

        // Obtener materias
        const { data: materias } = await supabasePublic
            .from('v_profesores_materias_activas')
            .select('nombre')
            .eq('profesor_id', id)

        const nombreProfesor = profesor.nombre_completo
        const bioProfesor = profesor.bio || 'No disponible'
        const nombreDepto = profesor.departamentos?.nombre || 'Departamento desconocido'
        const nombreUni = profesor.departamentos?.universidades?.nombre || 'Universidad desconocida'

        // Construir lista de materias
        const materiasTexto = materias?.map(m => m.nombre).join(', ') || 'ninguna'

        const prompt = `Genera un resumen profesional sobre este profesor universitario. IMPORTANTE:
- Escribe directamente en tercera persona SIN frases introductorias como "A continuación", "Este es un resumen", etc.
- Máximo 2-3 líneas
- Sin mencionar el nombre del profesor (ya se mostrará en otra parte)
- Comienza directamente con su rol, especialización o logros
- Menciona su departamento y materias si son relevantes
- Estilo formal y conciso

Datos:
Nombre: ${nombreProfesor}
Departamento: ${nombreDepto}
Universidad: ${nombreUni}
Materias: ${materiasTexto}
Bio: ${bioProfesor}`

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        {
                            role: 'system',
                            content: 'Genera resúmenes académicos concisos, en tercera persona, sin frases introductorias.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.5, // Reducido para mayor consistencia
                    max_tokens: 100, // Reducido para forzar concisión
                }),
            })

            if (!response.ok) {
                throw new Error(`Error en API: ${response.status}`)
            }

            const data = await response.json()
            let resumen = data.choices[0]?.message?.content || 'No se pudo generar resumen'

            // Limpiar posibles introducciones que quedaron
            resumen = resumen.replace(/^(A continuación|Este es|El siguiente|Aquí hay|Te presento|Presento|Resumen)[^:]*:?\s*/i, '')
            resumen = resumen.replace(/^(El profesor|La profesora|El docente|La docente)\s+[A-Za-zÁ-Úá-úÑñ\s]+\s+es\b/i, 'Es')
            resumen = resumen.replace(/^(.*?)\s+se destaca\b/i, 'Se destaca')

            return NextResponse.json({ resumen })

        } catch (apiError) {
            console.error('Error en API de generación:', apiError)
            return NextResponse.json({
                resumen: `Profesor en ${nombreDepto} especializado en ${materiasTexto !== 'ninguna' ? materiasTexto : 'su área académica'}.`
            })
        }
    } catch (error) {
        console.error('Error generando resumen:', error)
        return NextResponse.json({
            resumen: "Especialista académico con experiencia en docencia universitaria."
        })
    }
}
