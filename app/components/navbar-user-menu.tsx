'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

export function NavbarUserMenu() {
    const { user, profile, signOut } = useAuth()
    const [open, setOpen] = useState(false)

    if (!user) {
        return (
            <div className="flex items-center gap-3">
                <Link
                    href="/login"
                    className="rounded-full border border-white/20 text-white px-4 py-2 text-sm hover:bg-white/5 transition"
                >
                    Ingresar
                </Link>
                <Link
                    href="/register"
                    className="rounded-full bg-primary text-[#0b0d12] px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                >
                    Registrarse
                </Link>
            </div>
        )
    }

    const isProfessor = profile?.role === 'professor'
    const dashboardHref = isProfessor ? '/profesores/dashboard' : '/dashboard'
    const dashboardLabel = isProfessor ? 'Perfil' : 'Dashboard'

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 text-white/90 hover:text-white"
            >
                <div className="size-8 rounded-full bg-primary grid place-items-center text-[#0b0d12] font-semibold">
                    {profile?.avatar_url ? (
                        <Image
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            width={32}
                            height={32}
                            className="size-8 rounded-full object-cover"
                            unoptimized
                        />
                    ) : (
                        <span>{initials(profile?.full_name || user.email || '')}</span>
                    )}
                </div>
                <span className="text-sm">{profile?.full_name || user.email}</span>
                <ChevronDownIcon />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#10141d] p-2 text-sm">
                    <Link
                        href={dashboardHref}
                        className="block rounded-lg px-3 py-2 text-white/80 hover:bg-white/5 hover:text-white"
                        onClick={() => setOpen(false)}
                    >
                        {dashboardLabel}
                    </Link>
                    <button
                        onClick={async () => {
                            try {
                                await signOut()
                                setOpen(false)
                            } catch (error) {
                                console.error('Error al cerrar sesión:', error)
                            }
                        }}
                        className="block w-full text-left rounded-lg px-3 py-2 text-white/80 hover:bg-white/5 hover:text-white"
                    >
                        Cerrar sesión
                    </button>
                </div>
            )}
        </div>
    )
}

function initials(name: string) {
    const parts = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
    return parts.map((p) => p[0]?.toUpperCase() || '').join('') || 'U'
}

function ChevronDownIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    )
}
