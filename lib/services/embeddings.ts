import { pipeline } from '@xenova/transformers'

// Cache para el modelo de embeddings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embeddingPipeline: any = null

/**
 * Inicializa el pipeline de embeddings
 */
export async function initializeEmbeddings() {
  if (!embeddingPipeline) {
    try {
      // Usar un modelo ligero de embeddings para texto
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2', // Modelo ligero y eficiente
        {
          quantized: true, // Usar versión cuantizada para mejor rendimiento
          progress_callback: undefined // Sin logging
        }
      )
      console.log('✅ Embeddings model loaded successfully')
    } catch (error) {
      console.error('❌ Error loading embeddings model:', error)
      throw error
    }
  }
  return embeddingPipeline
}

/**
 * Genera embeddings para un texto dado
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipeline = await initializeEmbeddings()
    
    // Limpiar y normalizar el texto
    const cleanText = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remover caracteres especiales
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim()
    
    if (!cleanText) {
      throw new Error('Empty text after cleaning')
    }
    
    // Generar embedding
    const result = await pipeline(cleanText, {
      pooling: 'mean', // Usar mean pooling para obtener vector de dimensión fija
      normalize: true // Normalizar el vector resultante
    })
    
    // Convertir a array de números
    return Array.from(result.data)
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Calcula la similitud coseno entre dos vectores de embeddings
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  
  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)
  
  if (normA === 0 || normB === 0) {
    return 0
  }
  
  return dotProduct / (normA * normB)
}

/**
 * Genera embeddings para múltiples textos en lote
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = []
  
  // Procesar en lotes para evitar sobrecarga de memoria
  const batchSize = 5
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    )
    embeddings.push(...batchEmbeddings)
  }
  
  return embeddings
}
