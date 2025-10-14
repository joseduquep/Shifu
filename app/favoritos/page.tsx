"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { FavoriteButtonSimple } from "@/app/components/FavoriteButtonSimple"

type FavoritoWithProfessor = {
  id: string
  profesor_id: string
  nombre_completo: string
  departamento: string
  universidad: string
  created_at: string
}

export default function FavoritosPage() {
  const [favoritos, setFavoritos] = useState<FavoritoWithProfessor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar favoritos
  useEffect(() => {
    const loadFavoritos = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/favoritos')
        if (response.ok) {
          const data = await response.json()
          setFavoritos(data.favoritos)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Error al cargar favoritos')
        }
      } catch (err) {
        setError('Error de conexión')
        console.error('Error loading favorites:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadFavoritos()
  }, [])

  const handleFavoriteToggle = (profesorId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      // Eliminar de la lista local
      setFavoritos(prev => prev.filter(fav => fav.profesor_id !== profesorId))
    }
  }

  const initials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("")
  }

  return (
    <main className="min-h-dvh bg-[#0b0d12] text-primary font-sans">
      <section className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            aria-label="Volver al dashboard"
            className="inline-flex items-center justify-center p-2 rounded-full border border-white/10 bg-[#0b0d12] text-primary hover:opacity-90 transition"
          >
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="text-3xl font-medium text-white">Mis Profesores Favoritos</h1>
            <p className="text-white/60 mt-1">
              Profesores que has marcado como favoritos para acceso rápido
            </p>
          </div>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-white/60">Cargando favoritos...</span>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-900/10 p-6 text-center">
            <div className="text-red-400 font-medium mb-2">Error al cargar favoritos</div>
            <div className="text-red-300 text-sm mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition"
            >
              Reintentar
            </button>
          </div>
        ) : favoritos.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#121621] p-8 text-center">
            <HeartIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">No tienes favoritos aún</h2>
            <p className="text-white/60 mb-6">
              Explora profesores y marca los que más te gusten como favoritos para acceder a ellos rápidamente.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-6 py-3 font-medium hover:opacity-90 transition"
            >
              Explorar Profesores
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoritos.map((favorito) => (
              <div
                key={favorito.id}
                className="rounded-2xl border border-white/10 bg-[#121621] p-6 hover:border-white/20 transition"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-12 rounded-xl bg-[#0b0d12] grid place-items-center border border-white/10 text-white/80 font-medium">
                    {initials(favorito.nombre_completo)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium truncate">
                      {favorito.nombre_completo}
                    </div>
                    <div className="text-xs text-white/60 truncate">
                      {favorito.departamento} · {favorito.universidad}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-white/60 mb-4">
                  {favorito.departamento} · {favorito.universidad}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/profesores/${favorito.profesor_id}`}
                    className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-4 py-2 text-xs font-medium shadow-[0_0_0_2px_#0b0d12_inset] hover:opacity-90 transition"
                  >
                    Ver perfil
                  </Link>
                  <FavoriteButtonSimple 
                    profesorId={favorito.profesor_id} 
                    size="sm" 
                    variant="icon"
                    onToggle={(isFavorite) => handleFavoriteToggle(favorito.profesor_id, isFavorite)}
                  />
                </div>

                <div className="mt-3 text-xs text-white/40">
                  Agregado el {new Date(favorito.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
            ))}
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
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.402 8.169L12 18.896l-7.336 3.87 1.402-8.169L.132 9.211l8.2-1.193L12 .587z" />
    </svg>
  )
}
