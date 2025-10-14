import { useState, useCallback } from 'react'

export type SemanticSearchResult = {
  id: string
  nombreCompleto: string
  departamento: string
  universidad: string
  bio?: string
  materias?: string[]
  relevanciaScore?: number
}

export type SemanticSearchResponse = {
  profesores: SemanticSearchResult[]
  total: number
  query: string
  semanticSearch: boolean
}

export function useSemanticSearch() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [total, setTotal] = useState(0)

  const search = useCallback(async (query: string, limit: number = 20) => {
    if (!query.trim()) {
      setResults([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim(), limit }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const data: SemanticSearchResponse = await response.json()
      setResults(data.profesores)
      setTotal(data.total)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setResults([])
      setTotal(0)
      console.error('Semantic search error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setTotal(0)
    setError(null)
  }, [])

  return {
    search,
    clearResults,
    results,
    total,
    isLoading,
    error,
  }
}
