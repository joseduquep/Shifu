"use client"

import React, { useState } from "react"

type ShareButtonProps = {
  profesorId: string
  nombreProfesor: string
}

export function ShareButton({ profesorId, nombreProfesor }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  
  const handleShare = async () => {
    const url = `${window.location.origin}/share/profesor/${profesorId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${nombreProfesor} - Profesor en Shifu`,
          text: `Conoce a ${nombreProfesor} en Shifu`,
          url: url,
        })
      } catch {
        // Usuario canceló el compartir, no hacer nada
      }
    } else {
      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setShowTooltip(true)
      setTimeout(() => {
        setCopied(false)
        setShowTooltip(false)
      }, 2000)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0b0d12] px-4 py-2 text-sm text-white/80 hover:bg-white/5 transition"
      >
        <ShareIcon />
        {copied ? "¡Copiado!" : "Compartir"}
      </button>
      
      {/* Tooltip para mostrar estado de copiado */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-green-600 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50">
          ¡Enlace copiado!
        </div>
      )}
    </div>
  )
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
      <polyline points="16,6 12,2 8,6"></polyline>
      <line x1="12" y1="2" x2="12" y2="15"></line>
    </svg>
  )
}
