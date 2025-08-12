"use client"

import Link from "next/link"
import { useCallback, useRef, useState } from "react"

type MenuKey =
  | "explorar"
  | "profesores"
  | "calificar"
  | "ranking"
  | "acerca"
  | null

export function Navbar() {
  const [active, setActive] = useState<MenuKey>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const open = useCallback(
    (key: Exclude<MenuKey, null>) => {
      clearCloseTimer()
      setActive(key)
    },
    [clearCloseTimer]
  )

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setActive(null), 250)
  }, [clearCloseTimer])

  const panelBase =
    "fixed inset-x-0 top-16 px-6 transition duration-200 ease-out z-40"
  const panelHidden = "opacity-0 translate-y-2 invisible pointer-events-none"
  const panelVisible = "opacity-100 translate-y-0 visible pointer-events-auto"

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0d12]/80 supports-[backdrop-filter]:backdrop-blur">
      <div className="mx-auto max-w-7xl h-16 px-6 flex items-center justify-between relative">
        <Link href="/" className="text-xl font-semibold text-primary">
          Shifu
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          {/* Explorar */}
          <div
            className="relative"
            onMouseEnter={() => open("explorar")}
            onMouseLeave={scheduleClose}
          >
            <Link
              href="/explorar"
              className="text-white/80 hover:text-white transition"
            >
              Explorar
            </Link>
          </div>

          {/* Profesores */}
          <div
            className="relative"
            onMouseEnter={() => open("profesores")}
            onMouseLeave={scheduleClose}
          >
            <Link
              href="/profesores"
              className="text-white/80 hover:text-white transition"
            >
              Profesores
            </Link>
          </div>

          {/* Calificar */}
          <div
            className="relative"
            onMouseEnter={() => open("calificar")}
            onMouseLeave={scheduleClose}
          >
            <Link
              href="/calificar"
              className="text-white/80 hover:text-white transition"
            >
              Calificar
            </Link>
          </div>

          {/* Ranking */}
          <div
            className="relative"
            onMouseEnter={() => open("ranking")}
            onMouseLeave={scheduleClose}
          >
            <Link
              href="/ranking"
              className="text-white/80 hover:text-white transition"
            >
              Ranking
            </Link>
          </div>

          {/* Acerca */}
          <div
            className="relative"
            onMouseEnter={() => open("acerca")}
            onMouseLeave={scheduleClose}
          >
            <Link
              href="/about"
              className="text-white/80 hover:text-white transition"
            >
              Acerca
            </Link>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full border border-white/20 text-white px-4 py-2 text-sm hover:bg-white/5 transition"
          >
            Ingresar
          </Link>
        </div>
      </div>

      {/* Panels (full-width, one visible at a time) */}
      <div
        className={`${panelBase} ${
          active === "explorar" ? panelVisible : panelHidden
        }`}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        <div className="border border-white/10 bg-[#10141d] shadow-2xl">
          <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-3 gap-8 p-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Explorar profesores
              </div>
              <ul className="mt-3 space-y-2 text-white">
                <li>
                  <Link href="/profesores" className="hover:underline">
                    Buscar por nombre
                  </Link>
                </li>
                <li>
                  <Link href="/ranking" className="hover:underline">
                    Top calificados
                  </Link>
                </li>
                <li>
                  <Link href="/nuevos" className="hover:underline">
                    Nuevos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Acciones
              </div>
              <ul className="mt-3 space-y-2 text-white">
                <li>
                  <Link href="/calificar" className="hover:underline">
                    Calificar ahora
                  </Link>
                </li>
                <li>
                  <Link href="/comparar" className="hover:underline">
                    Comparar profesores
                  </Link>
                </li>
                <li>
                  <Link href="/recursos" className="hover:underline">
                    Guías y recursos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Destacados
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Link
                  href="/ranking"
                  className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-center text-xs text-white/80 hover:bg-white/5 transition"
                >
                  Top 10
                </Link>
                <Link
                  href="/profesores?tag=mejores-docentes"
                  className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-center text-xs text-white/80 hover:bg-white/5 transition"
                >
                  Mejores
                </Link>
                <Link
                  href="/profesores?tag=tendencia"
                  className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-center text-xs text-white/80 hover:bg-white/5 transition"
                >
                  Tendencia
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${panelBase} ${
          active === "profesores" ? panelVisible : panelHidden
        }`}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        <div className="border border-white/10 bg-[#10141d] shadow-2xl">
          <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8 p-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Filtrar
              </div>
              <ul className="mt-3 space-y-2 text-white">
                <li>
                  <Link
                    href="/profesores?dep=matematicas"
                    className="hover:underline"
                  >
                    Matemáticas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profesores?dep=ingenieria"
                    className="hover:underline"
                  >
                    Ingeniería
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profesores?dep=humanidades"
                    className="hover:underline"
                  >
                    Humanidades
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Accesos
              </div>
              <ul className="mt-3 space-y-2 text-white">
                <li>
                  <Link href="/profesores" className="hover:underline">
                    Todos
                  </Link>
                </li>
                <li>
                  <Link href="/ranking" className="hover:underline">
                    Mejor valorados
                  </Link>
                </li>
                <li>
                  <Link href="/nuevos" className="hover:underline">
                    Agregados recientemente
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 hidden md:block">
              <div className="text-xs uppercase tracking-widest text-white/60">
                Destacado
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-[#0b0d12] p-6 text-white/80">
                Descubre docentes con impacto positivo en su comunidad
                académica.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${panelBase} ${
          active === "calificar" ? panelVisible : panelHidden
        }`}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        <div className="border border-white/10 bg-[#10141d] shadow-2xl">
          <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Comienza
              </div>
              <ul className="mt-3 space-y-2 text-white">
                <li>
                  <Link href="/calificar" className="hover:underline">
                    Buscar profesor
                  </Link>
                </li>
                <li>
                  <Link
                    href="/calificar?mode=anonimo"
                    className="hover:underline"
                  >
                    Calificación anónima
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Guías
              </div>
              <ul className="mt-3 space-y-2 text-white">
                <li>
                  <Link
                    href="/recursos/guia-calificacion"
                    className="hover:underline"
                  >
                    Cómo calificar bien
                  </Link>
                </li>
                <li>
                  <Link href="/recursos/politica" className="hover:underline">
                    Políticas y ética
                  </Link>
                </li>
              </ul>
            </div>
            <div className="hidden md:block">
              <div className="text-xs uppercase tracking-widest text-white/60">
                Beneficios
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-[#0b0d12] p-6 text-white/80">
                Ayuda a que otros estudiantes elijan mejor y mejora la calidad
                docente.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${panelBase} ${
          active === "ranking" ? panelVisible : panelHidden
        }`}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        <div className="border border-white/10 bg-[#10141d] shadow-2xl">
          <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8 p-8">
            <Link
              href="/ranking?scope=global"
              className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-center text-sm text-white/80 hover:bg-white/5 transition"
            >
              Global
            </Link>
            <Link
              href="/ranking?scope=universidad"
              className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-center text-sm text-white/80 hover:bg-white/5 transition"
            >
              Por universidad
            </Link>
            <Link
              href="/ranking?scope=departamento"
              className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-center text-sm text-white/80 hover:bg-white/5 transition"
            >
              Por departamento
            </Link>
            <Link
              href="/ranking?scope=tendencia"
              className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-center text-sm text-white/80 hover:bg-white/5 transition"
            >
              En tendencia
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`${panelBase} ${
          active === "acerca" ? panelVisible : panelHidden
        }`}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        <div className="border border-white/10 bg-[#10141d] shadow-2xl">
          <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8 p-8 text-white/80">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Nuestra misión
              </div>
              <p className="mt-3">
                Transparencia académica para que todos tomen mejores decisiones.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Contacto
              </div>
              <p className="mt-3">Escríbenos para alianzas o feedback.</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Comunidad
              </div>
              <p className="mt-3">
                Únete y aporta calificaciones responsables.
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
