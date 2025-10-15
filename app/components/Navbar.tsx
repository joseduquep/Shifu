"use client"

import Link from "next/link"
import { useCallback, useRef, useState } from "react"

type MenuKey = "explorar" | "acerca" | null

import { NavbarUserMenu } from "./navbar-user-menu"

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
              href="/profesores"
              className="text-white/80 hover:text-white transition"
            >
              Profesores
            </Link>
          </div>

          {/* Favoritos */}
          <Link
            href="/favoritos"
            className="text-white/80 hover:text-white transition"
          >
            Favoritos
          </Link>

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
          <NavbarUserMenu />
        </div>
      </div>

      {/* Panel Explorar */}
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
                Explorar perfiles
              </div>
              <ul className="mt-3 space-y-2 text-white">
                <li>
                  <Link href="/profesores" className="hover:underline">
                    Directorio completo
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profesores?view=destacados"
                    className="hover:underline"
                  >
                    Perfiles destacados
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
                  <Link href="/profesores" className="hover:underline">
                    Buscar y filtrar
                  </Link>
                </li>
                <li>
                  <Link href="/favoritos" className="hover:underline">
                    Ver favoritos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60">
                Atajos
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Link
                  href="/profesores#recientes"
                  className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-center text-xs text-white/80 hover:bg-white/5 transition"
                >
                  Recientes
                </Link>
                <Link
                  href="/profesores?filtro=especialidades"
                  className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-center text-xs text-white/80 hover:bg-white/5 transition"
                >
                  Especialidades
                </Link>
                <Link
                  href="/share/profesor"
                  className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-center text-xs text-white/80 hover:bg-white/5 transition"
                >
                  Compartir
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Acerca */}
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
              <p className="mt-3">Únete y aporta información responsable.</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
