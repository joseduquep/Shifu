"use client"

import React, { useState, useEffect } from "react"

type FavoriteButtonSimpleProps = {
  profesorId: string
  size?: "sm" | "md" | "lg"
  variant?: "icon" | "text" | "both"
  onToggle?: (isFavorite: boolean) => void
}

export function FavoriteButtonSimple({ 
  profesorId, 
  size = "md", 
  variant = "both",
  onToggle 
}: FavoriteButtonSimpleProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar estado inicial del favorito
  useEffect(() => {
    const loadFavoriteStatus = async () => {
      try {
        const response = await fetch(`/api/favoritos/${profesorId}`)
        if (response.ok) {
          const data = await response.json()
          setIsFavorite(data.es_favorito)
        }
      } catch (err) {
        console.error('Error cargando estado de favorito:', err)
      }
    }

    loadFavoriteStatus()
  }, [profesorId])

  const handleToggleFavorite = async () => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/favoritos/${profesorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const newFavoriteState = data.es_favorito
        setIsFavorite(newFavoriteState)
        onToggle?.(newFavoriteState)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al actualizar favoritos')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error toggling favorite:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: "p-2",
    md: "p-3",
    lg: "p-4"
  }

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 rounded-full border transition-all duration-200
          ${isFavorite 
            ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20' 
            : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:bg-white/10 hover:text-white/90'
          }
          ${sizeClasses[size]}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          disabled:opacity-50
        `}
        title={isFavorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
      >
        {isLoading ? (
          <div className={`${iconSizes[size]} animate-spin`}>
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          <>
            {(variant === "icon" || variant === "both") && (
              <HeartIcon 
                filled={isFavorite} 
                className={iconSizes[size]} 
              />
            )}
            {(variant === "text" || variant === "both") && (
              <span className={`font-medium ${textSizes[size]}`}>
                {isFavorite ? "En favoritos" : "Agregar a favoritos"}
              </span>
            )}
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-900/90 border border-red-500/50 rounded-lg text-red-100 text-xs whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  )
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  )
}
