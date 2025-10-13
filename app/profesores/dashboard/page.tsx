'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function sleep(ms: number) { return new Promise((res) => setTimeout(res, ms)) }

export default function DiagnosticoGuardarProfesor() {
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditMode, setIsEditMode] = useState(false)
    // const [logs, setLogs] = useState<string[]>([])

    // const addLog = (line: string) => {
    //     console.log(line)
    //     setLogs((s) => [...s, `[${new Date().toISOString()}] ${line}`])
    // }

    // datos del profesor
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [department, setDepartment] = useState('')
    const [bio, setBio] = useState('')

    // supabase client
    const supabase = createClient()

    // Cargar datos del profesor al inicio
    useEffect(() => {
        async function loadProfesorData() {
            setIsLoading(true)
            try {
                // Obtener usuario actual
                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError || !user) {
                    console.error("No hay usuario autenticado")
                    return
                }

                // Consultar datos del profesor
                const { data, error } = await supabase
                    .from('profesores')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (error) {
                    console.error("Error al cargar datos del profesor:", error)
                    return
                }

                if (data) {
                    setName(data.nombre_completo || '')
                    setEmail(data.email || '')
                    setBio(data.bio || '')

                    // Cargar departamento si existe
                    if (data.departamento_id) {
                        const { data: deptData } = await supabase
                            .from('departamentos')
                            .select('nombre')
                            .eq('id', data.departamento_id)
                            .single()

                        if (deptData) {
                            setDepartment(deptData.nombre)
                        }
                    }
                }
            } finally {
                setIsLoading(false)
            }
        }

        loadProfesorData()
    }, [])

    async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        // Si no estamos en modo edición, activarlo y salir
        if (!isEditMode) {
            setIsEditMode(true)
            return
        }

        // De lo contrario, guardar cambios
        setIsSaving(true)
        // setLogs([])

        try {
            // addLog('🔎 Iniciando diagnóstico...')

            // 1) verificar env vars
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

            // addLog(`SUPABASE_URL: ${supabaseUrl ? 'OK' : 'VACÍO'}`)
            // addLog(`SUPABASE_KEY: ${supabaseKey ? 'OK' : 'VACÍO'}`)

            if (!supabaseUrl || !supabaseKey) {
                // addLog('❗ Las variables de entorno públicas están vacías. Revisa .env.local y reinicia Next.js.')
                return
            }

            // 2) probar select usando supabase-js
            // addLog('2) Probando select desde supabase-js (departamentos)...')
            try {
                const { data, error, status } = await supabase
                    .from('departamentos')
                    .select('id,nombre')
                    .limit(1)

                // addLog(`- supabase-js response status: ${status}`)
                // if (error) {
                //     addLog(`- supabase-js error: ${JSON.stringify(error)}`)
                // } else {
                //     addLog(`- supabase-js data: ${JSON.stringify(data)}`)
                // }
            } catch (err: any) {
                // addLog(`- supabase-js threw: ${err?.message ?? String(err)}`)
            }

            // 3) probar fetch directo al endpoint REST (detecta CORS/headers/key)
            // addLog('3) Probando fetch directo al REST endpoint /departamentos...')
            const restUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/departamentos?select=id,nombre&limit=1`
            // addLog(`- REST URL: ${restUrl}`)
            try {
                const resp = await fetch(restUrl, {
                    method: 'GET',
                    headers: {
                        apikey: supabaseKey,
                        Authorization: `Bearer ${supabaseKey}`,
                        Prefer: 'return=minimal'
                    }
                })

                // addLog(`- fetch status: ${resp.status}`)
                const text = await resp.text()
                // addLog(`- fetch body (truncated 1000 chars): ${text.slice(0, 1000)}`)
            } catch (err: any) {
                // addLog(`- fetch threw: ${err?.message ?? String(err)}`)
            }

            // 4) obtener usuario autenticado y luego intentar insertar profesor
            // addLog('4) Intentando insertar profesor (timeout 30s)...')

            // Obtener el usuario autenticado actual
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                // addLog(`❌ Error: No hay usuario autenticado. Debes iniciar sesión primero.`)
                // addLog(`- Auth error: ${authError ? JSON.stringify(authError) : 'No hay usuario'}`)
                return
            }

            // addLog(`- Usuario autenticado: ${user.id} (${user.email})`)

            const insertPromise = supabase
                .from('profesores')
                .upsert([{
                    id: user.id, // Usar el ID del usuario autenticado
                    nombre_completo: name,
                    email,
                    bio,
                    departamento_id: null
                }])
                .select()

            const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT_30s')), 30000))
            try {
                const res = await Promise.race([insertPromise, timeout]) as any
                // addLog(`- insert result: ${JSON.stringify(res)}`)
                setIsEditMode(false) // Volver al modo visualización después de guardar
            } catch (err: any) {
                // addLog(`- insert error: ${err?.message ?? String(err)}`)
            }

            // addLog('✅ Diagnóstico terminado.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <main className="bg-[#0b0d12] text-primary font-sans">
            <section className="min-h-[calc(100dvh-4rem)] px-6 py-10">
                <div className="mx-auto max-w-6xl">
                    <header className="flex items-center justify-between">
                        <h1 className="text-3xl md:text-4xl font-medium">
                            Perfil de profesor
                        </h1>
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
                                    <label
                                        htmlFor="name"
                                        className="block text-sm text-white/80"
                                    >
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
                                    <label
                                        htmlFor="department"
                                        className="block text-sm text-white/80"
                                    >
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
                                    <label
                                        htmlFor="bio"
                                        className="block text-sm text-white/80"
                                    >
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

                    {/* Sección de logs comentada
                    <section className="mt-8 rounded-2xl border border-white/15 p-6 bg-white/5">
                        <h2 className="text-xl font-medium">Logs</h2>
                        <div className="mt-4 bg-[#0b0d12] border border-white/15 p-4 rounded-xl max-h-[40vh] overflow-auto">
                            {logs.map((l, i) => (
                                <div key={i} className="text-xs font-mono mb-1 text-white/85">{l}</div>
                            ))}
                        </div>
                    </section>
                    */}
                </div>
            </section>
        </main>
    )
}
