'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/auth-context'

export default function ProfesoresDashboardPage() {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = useMemo(() => createClient(), [])
    const { user, loading } = useAuth()

    // UI state
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditMode, setIsEditMode] = useState(false)

    // datos del profesor
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [department, setDepartment] = useState('')
    const [bio, setBio] = useState('')

    // Guard: si terminó de cargar el contexto y no hay usuario, redirigir al login
    useEffect(() => {
        if (!loading && !user) {
            const redirect = encodeURIComponent(pathname || '/profesores/dashboard')
            router.replace(`/profesores/login?redirect=${redirect}`)
        }
    }, [loading, user, pathname, router])

    const loadProfesorData = useCallback(async () => {
        if (!user) return
        setIsLoading(true)
        try {
            // Carga base
            const { data, error } = await supabase
                .from('profesores')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) {
                console.error('Error al cargar datos del profesor:', error)
                setName('')
                setEmail('')
                setBio('')
                setDepartment('')
                return
            }

            if (data) {
                setName(data.nombre_completo || '')
                setEmail(data.email || '')
                setBio(data.bio || '')

                if (data.departamento_id) {
                    const { data: deptData } = await supabase
                        .from('departamentos')
                        .select('nombre')
                        .eq('id', data.departamento_id)
                        .single()
                    setDepartment(deptData?.nombre || '')
                } else {
                    setDepartment('')
                }
            }
        } finally {
            setIsLoading(false)
        }
    }, [supabase, user])

    // Carga inicial + reintentos cuando el token se refresca o volvemos a la pestaña
    useEffect(() => {
        let mounted = true
        if (user) loadProfesorData()

        const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
            if (!mounted) return
            if (evt === 'TOKEN_REFRESHED' || evt === 'SIGNED_IN') {
                loadProfesorData()
            }
            if (evt === 'SIGNED_OUT') {
                setName('')
                setEmail('')
                setDepartment('')
                setBio('')
            }
        })

        const onVisibility = () => {
            if (document.visibilityState === 'visible') loadProfesorData()
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            mounted = false
            sub.subscription.unsubscribe()
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [supabase, user, loadProfesorData])

    async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!user) {
            const redirect = encodeURIComponent(pathname || '/profesores/dashboard')
            router.replace(`/profesores/login?redirect=${redirect}`)
            return
        }

        if (!isEditMode) {
            setIsEditMode(true)
            return
        }

        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profesores')
                .upsert([{
                    id: user.id,
                    nombre_completo: name,
                    email,
                    bio,
                    departamento_id: null,
                }])
                .select()

            if (!error) setIsEditMode(false)
        } finally {
            setIsSaving(false)
        }
    }

    // Render: si el contexto sigue cargando muestra un loader corto
    if (loading) {
        return (
            <main className="bg-[#0b0d12] text-primary font-sans">
                <section className="min-h-[calc(100dvh-4rem)] px-6 py-10">
                    <div className="mx-auto max-w-6xl">
                        <div className="py-8 text-center text-white/70">
                            <p>Cargando…</p>
                        </div>
                    </div>
                </section>
            </main>
        )
    }

    // Si no hay usuario (y ya no estamos loading), mostramos CTA en vez de spinner infinito
    if (!user) {
        const redirect = encodeURIComponent(pathname || '/profesores/dashboard')
        return (
            <main className="bg-[#0b0d12] text-primary font-sans">
                <section className="min-h-[calc(100dvh-4rem)] px-6 py-10">
                    <div className="mx-auto max-w-6xl text-center text-white/80">
                        <p className="mb-4">Tu sesión ha finalizado.</p>
                        <a
                            href={`/profesores/login?redirect=${redirect}`}
                            className="inline-block rounded-xl bg-primary text-[#0b0d12] px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                        >
                            Ingresar
                        </a>
                    </div>
                </section>
            </main>
        )
    }

    return (
        <main className="bg-[#0b0d12] text-primary font-sans">
            <section className="min-h-[calc(100dvh-4rem)] px-6 py-10">
                <div className="mx-auto max-w-6xl">
                    <header className="flex items-center justify-between">
                        <h1 className="text-3xl md:text-4xl font-medium">Perfil de profesor</h1>
                    </header>

                    <section
                        aria-label="Formulario de profesor"
                        className="mt-8 rounded-2xl border border-white/15 p-6 bg-white/5"
                    >
                        {isLoading ? (
                            <div className="py-8 text-center text-white/70">
                                <p>Cargando información...</p>
                            </div>
                        ) : (
                            <form className="mt-6 space-y-4" onSubmit={handleFormSubmit}>
                                <div>
                                    <label htmlFor="name" className="block text-sm text-white/80">
                                        Nombre
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={!isEditMode}
                                        className="mt-1 w-full h-11 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-70"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="department" className="block text-sm text-white/80">
                                        Departamento
                                    </label>
                                    <input
                                        id="department"
                                        type="text"
                                        required
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        disabled={!isEditMode}
                                        className="mt-1 w-full h-11 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-70"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="bio" className="block text-sm text-white/80">
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        rows={4}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        disabled={!isEditMode}
                                        className="mt-1 w-full rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-70"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="h-11 px-4 inline-flex items-center justify-center rounded-xl bg-primary text-[#0b0d12] text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                                    >
                                        {isSaving ? 'Guardando…' : isEditMode ? 'Guardar cambios' : 'Editar'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            </section>
        </main>
    )
}
