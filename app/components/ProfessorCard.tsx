"use client"

import React from "react"
import Link from "next/link"
import { FavoriteButtonSimple } from "./FavoriteButtonSimple"
import { ShareProfileButton } from "./ShareProfileButton"

type ProfessorCardProps = {
  id: string
  name: string
  department: string
  university?: string
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

      <div className="mt-4 text-xs text-white/60">
        {department}
        {university ? ` · ${university}` : ""}
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
        <div className="flex items-center gap-2">
          <ShareProfileButton 
            profesorId={id} 
            nombreProfesor={name}
            size="sm" 
            variant="icon"
          />
          <FavoriteButtonSimple 
            profesorId={id} 
            size="sm" 
            variant="icon"
          />
        </div>
      </div>
    </div>
  )
}

// Eliminado: StarIcon ya no es necesario sin calificaciones

