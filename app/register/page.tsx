"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Role = 'student' | 'professor'

interface UserMetadata {
  full_name: string
  role: Role
  epik_id?: string
}

type StudentForm = {
  firstName: string
  lastName: string
  email: string
  epikId: string
  phone: string
  birthDate: string
  password: string
  confirmPassword: string
  role: Role
}

const SPECIALS_SAFE = "!@#$%^&*_.-"

function getPasswordChecks(password: string) {
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasMinLength = password.length >= 8
  const hasSafeSpecial = new RegExp(
    "[" + SPECIALS_SAFE.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + "]"
  ).test(password)
  return { hasUppercase, hasLowercase, hasMinLength, hasSafeSpecial }
}

function Requirement({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`inline-grid size-5 place-items-center rounded-full border ${
          ok
            ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
            : "border-white/15 bg-[#0b0d12] text-white/60"
        }`}
      >
        {ok ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
          </svg>
        )}
      </span>
      <span className={ok ? "text-white/80" : "text-white/60"}>{label}</span>
    </div>
  )
}

export default function RegisterPage() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState<StudentForm>({
    firstName: "",
    lastName: "",
    email: "",
    epikId: "",
    phone: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
    role: 'student',
  })

  useEffect(() => setMounted(true), [])

  const checks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password]
  )
  const passwordsMatch =
    form.password.length > 0 && form.password === form.confirmPassword

  const emailValid = /.+@.+\..+/.test(form.email)
  const isStudent = form.role === 'student'

  const allValid =
    Boolean(form.firstName.trim()) &&
    Boolean(form.lastName.trim()) &&
    emailValid &&
    (!isStudent || Boolean(form.epikId.trim())) &&
    Boolean(form.phone.trim()) &&
    Boolean(form.birthDate) &&
    checks.hasUppercase &&
    checks.hasLowercase &&
    checks.hasMinLength &&
    checks.hasSafeSpecial &&
    passwordsMatch

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allValid) return
    setIsLoading(true)
    setError("")
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
      const metadata: UserMetadata = {
        full_name: fullName,
        role: form.role,
      }
      if (isStudent) metadata.epik_id = form.epikId

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: metadata },
      })
      if (error) throw error

      // Si la sesión no se crea (confirmación de email activada), enviamos a login
      const role =
        ((data.user?.user_metadata as { role?: Role } | undefined)?.role) ??
        form.role
      const target = role === 'professor' ? '/profesores/dashboard' : '/dashboard'

      if (data.session) {
        router.push(target)
      } else {
        router.push('/login?registered=1')
      }
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrarse'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  function update<K extends keyof StudentForm>(key: K, value: StudentForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  if (!mounted) return null

  return (
    <main className="bg-[#0b0d12] text-primary font-sans">
      <section className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <h1 className="text-3xl md:text-4xl font-medium text-center">
            Crea tu cuenta de estudiante
          </h1>

          <form
            className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="md:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-3 py-2">
                {error}
              </div>
            )}
            <div className="md:col-span-2 flex items-center gap-4">
              <label className="text-sm text-white/80">Tipo de cuenta</label>
              <div className="inline-flex rounded-full border border-white/15 overflow-hidden">
                <button
                  type="button"
                  onClick={() => update('role', 'student')}
                  className={`px-4 py-2 text-sm ${form.role === 'student' ? 'bg-primary text-[#0b0d12]' : 'text-white/80 hover:text-white'}`}
                >
                  Estudiante
                </button>
                <button
                  type="button"
                  onClick={() => update('role', 'professor')}
                  className={`px-4 py-2 text-sm ${form.role === 'professor' ? 'bg-primary text-[#0b0d12]' : 'text-white/80 hover:text-white'}`}
                >
                  Profesor
                </button>
              </div>
            </div>
            <input
              id="firstName"
              type="text"
              required
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Nombre"
              className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 md:col-span-1"
            />

            <input
              id="lastName"
              type="text"
              required
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Apellidos"
              className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 md:col-span-1"
            />

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="Correo institucional"
              className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 md:col-span-2"
            />

            {form.role === 'student' && (
              <input
                id="epikId"
                type="text"
                required
                value={form.epikId}
                onChange={(e) => update("epikId", e.target.value)}
                placeholder="ID de EPIK"
                className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 md:col-span-1"
              />
            )}

            <input
              id="phone"
              type="tel"
              inputMode="tel"
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="Número de celular"
              className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 md:col-span-1"
            />

            <input
              id="birthDate"
              type="date"
              required
              value={form.birthDate}
              onChange={(e) => update("birthDate", e.target.value)}
              placeholder="Fecha de nacimiento"
              className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 md:col-span-2"
            />

            <div className="relative md:col-span-2">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Crea una contraseña"
                className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30"
              >
                {showPassword ? (
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
                    <path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a21.77 21.77 0 015.06-6.94" />
                    <path d="M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.77 21.77 0 01-3.16 4.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
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
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative md:col-span-2">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                placeholder="Confirma tu contraseña"
                className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30"
              >
                {showConfirm ? (
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
                    <path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a21.77 21.77 0 015.06-6.94" />
                    <path d="M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.77 21.77 0 01-3.16 4.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
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
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="md:col-span-2 rounded-xl border border-white/10 bg-[#121621] p-4 space-y-2">
              <div className="text-xs uppercase tracking-widest text-white/60">
                Tu contraseña debe incluir
              </div>
              <Requirement
                ok={checks.hasUppercase}
                label="Al menos 1 mayúscula"
              />
              <Requirement
                ok={checks.hasLowercase}
                label="Al menos 1 minúscula"
              />
              <Requirement
                ok={checks.hasMinLength}
                label="Mínimo 8 caracteres"
              />
              <Requirement
                ok={checks.hasSafeSpecial}
                label={`Al menos 1 caracter especial permitido (${SPECIALS_SAFE})`}
              />
              <Requirement
                ok={passwordsMatch}
                label="Coincidir con la confirmación"
              />
              <div className="text-xs text-white/60">
                {form.role === 'student'
                  ? 'Tu cuenta será de estudiante y necesitará un EPIK ID.'
                  : 'Tu cuenta será de profesor.'}
              </div>
            </div>

            <button
              type="submit"
              disabled={!allValid || isLoading}
              className="md:col-span-2 w-full h-12 inline-flex items-center justify-center rounded-xl bg-primary text-[#0b0d12] text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {isLoading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-white/60">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-white/80 hover:text-white underline underline-offset-4"
            >
              Inicia sesión
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
