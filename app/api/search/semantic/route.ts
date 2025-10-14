import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding, cosineSimilarity } from '@/lib/services/embeddings'

type ProfesorConEmbedding = {
  id: string
  nombreCompleto: string
  departamento: string
  universidad: string
  bio?: string
  materias?: string[]
  embedding?: number[]
  relevanciaScore?: number
}

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 20 } = await request.json()
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Obtener todos los profesores con sus datos (sin resenas que no existe)
    const { data: profesores, error: profesoresError } = await supabase
      .from('profesores')
      .select(`
        id,
        nombre_completo,
        bio,
        departamentos!inner(
          nombre,
          universidades!inner(nombre)
        ),
        profesores_materias(
          materias(nombre)
        )
      `)

    if (profesoresError) {
      console.error('Error fetching professors:', profesoresError)
      return NextResponse.json({ error: 'Error fetching professors' }, { status: 500 })
    }

    if (!profesores || profesores.length === 0) {
      return NextResponse.json({ profesores: [], total: 0 })
    }

    // Generar embedding para la consulta de búsqueda
    const queryEmbedding = await generateEmbedding(query.trim())
    
    // Procesar profesores y calcular relevancia semántica
    const profesoresConRelevancia: ProfesorConEmbedding[] = []
    
    for (const prof of profesores) {
      // Construir texto descriptivo del profesor
      const textoProfesor = [
        prof.nombre_completo,
        prof.departamentos.nombre,
        prof.departamentos.universidades.nombre,
        prof.bio || '',
        ...(prof.profesores_materias || []).map((pm: { materias?: { nombre?: string } }) => pm.materias?.nombre || '').filter(Boolean)
      ].join(' ').trim()

      if (!textoProfesor) continue

      try {
        // Generar embedding para el profesor
        const profesorEmbedding = await generateEmbedding(textoProfesor)
        
        // Calcular similitud coseno
        const relevanciaScore = cosineSimilarity(queryEmbedding, profesorEmbedding)

        profesoresConRelevancia.push({
          id: prof.id,
          nombreCompleto: prof.nombre_completo,
          departamento: prof.departamentos.nombre,
          universidad: prof.departamentos.universidades.nombre,
          bio: prof.bio,
          materias: prof.profesores_materias?.map((pm: { materias?: { nombre?: string } }) => pm.materias?.nombre).filter(Boolean) || [],
          relevanciaScore
        })
      } catch (error) {
        console.error(`Error processing professor ${prof.id}:`, error)
        // Continuar con el siguiente profesor si hay error
      }
    }

    // Ordenar por relevancia semántica (mayor score primero)
    profesoresConRelevancia.sort((a, b) => (b.relevanciaScore || 0) - (a.relevanciaScore || 0))
    
    // Limitar resultados
    const resultadosLimitados = profesoresConRelevancia.slice(0, limit)

    return NextResponse.json({
      profesores: resultadosLimitados,
      total: profesoresConRelevancia.length,
      query: query.trim(),
      semanticSearch: true
    })

  } catch (error) {
    console.error('Error in semantic search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
