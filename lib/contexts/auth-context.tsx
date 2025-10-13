'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'

type UserRole = 'student' | 'professor'

export interface Profile {
    id: string
    email: string
    role: UserRole
    epik_id: string | null
    full_name: string
    avatar_url: string | null
    created_at: string
    updated_at: string
}

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const supabase = useMemo(() => createClient(), [])
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = useCallback(
        async (uid: string) => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single()

            if (error) throw error
            return (data as Profile | null) ?? null
        },
        [supabase]
    )

    const syncAuth = useCallback(async () => {
        try {
            // getUser() valida con el backend y refresca si el access token expiró
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user ?? null)

            if (user) {
                try {
                    const p = await fetchProfile(user.id)
                    setProfile(p)
                } catch {
                    // Si falló (p.ej. token desfasado), intenta refrescar y reintentar una vez
                    await supabase.auth.refreshSession()
                    const retry = await fetchProfile(user.id)
                    setProfile(retry)
                }
            } else {
                setProfile(null)
            }
        } finally {
            setLoading(false)
        }
    }, [supabase, fetchProfile])

    useEffect(() => {
        let mounted = true

        // Sincroniza al montar
        syncAuth()

        // Reacciona a cambios de auth (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
        const { data: sub } = supabase.auth.onAuthStateChange(async () => {
            if (!mounted) return
            await syncAuth()
        })

        // Re-sincroniza al recuperar foco/visibilidad
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                syncAuth()
            }
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            mounted = false
            sub.subscription.unsubscribe()
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [supabase, syncAuth])

    // Re-sincroniza en cada cambio de ruta (por si el middleware actualizó cookies)
    useEffect(() => {
        // Evita bloquear la UI: corre asincrónicamente
        syncAuth()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    const signOut = async () => {
        // 1) Limpia estado inmediatamente: la Navbar se actualiza al instante
        setUser(null)
        setProfile(null)

        // 2) Ejecuta ambos cierres en paralelo (cliente + servidor), sin bloquear la UI
        const clientLogout = supabase.auth.signOut().catch((e) => {
            console.warn('supabase.auth.signOut() falló:', e)
        })
        const serverLogout = fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        }).catch((e) => {
            console.warn('POST /api/auth/logout falló:', e)
        })

        // Damos un margen corto para finalizar los llamados, pero no bloqueamos la UI
        await Promise.race([
            Promise.allSettled([clientLogout, serverLogout]),
            new Promise((resolve) => setTimeout(resolve, 1200)),
        ])

        // 3) Redirige (opcional). Si prefieres no navegar, comenta la línea siguiente.
        window.location.assign('/')
    }


    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
    return ctx
}
