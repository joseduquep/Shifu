"use client"

import React from "react"
import Link from "next/link"
import { FavoriteButtonSimple } from "./FavoriteButtonSimple"

type ProfessorCardProps = {
  id: string
  name: string
  department: string
  university?: string
  rating?: number
  reviewsCount?: number
  materias?: string[]
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export function ProfessorCard({
  id,
  name,
  department,
  university,
  rating,
  reviewsCount,
  materias = [],
}: ProfessorCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121621] p-6 hover:border-white/20 transition">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-xl bg-[#0b0d12] grid place-items-center border border-white/10 text-white/80 font-medium">
          {initials(name)}
        </div>
        <div className="min-w-0">
          <div className="text-white font-medium truncate">{name}</div>
          <div className="text-xs text-white/60 truncate">
            {department}
            {university ? ` · ${university}` : ""}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-white/80">
        {typeof rating === "number" ? (
          <>
            <StarIcon className="text-primary" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            {typeof reviewsCount === "number" && (
              <span className="text-xs text-white/50">({reviewsCount} reseñas)</span>
            )}
          </>
        ) : (
          <span className="text-xs text-white/50">Sin calificaciones</span>
        )}
      </div>

      {materias.length > 0 && (
        <div className="mt-3">
          <div className="text-xs uppercase tracking-widest text-white/60">
            Materias activas
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {materias.map((m) => (
              <span
                key={m}
                className="inline-flex items-center rounded-full border border-white/10 bg-[#0b0d12] px-2.5 py-1 text-xs text-white/70"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          href={`/profesores/${id}`}
          className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-4 py-2 text-xs font-medium shadow-[0_0_0_2px_#0b0d12_inset] hover:opacity-90 transition"
        >
          Ver perfil
        </Link>
        <FavoriteButtonSimple 
          profesorId={id} 
          size="sm" 
          variant="icon"
        />
      </div>
    </div>
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

