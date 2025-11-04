import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const path = request.nextUrl.pathname
  // const isAuthPage =
  //     path.startsWith('/login') ||
  //     path.startsWith('/register') ||
  //     path.startsWith('/profesores/login')

  // Ya NO redirigimos automáticamente desde páginas de auth si hay sesión.
  // if (user && isAuthPage) { ... }  <-- Eliminado

  // Rutas protegidas (mantenemos /profesores/dashboard protegido)
  const studentProtected: string[] = [] // Dejamos /dashboard público
  const professorProtected = ["/profesores/dashboard"]
  const adminProtected = ["/admin"]

  if (studentProtected.some((p) => path.startsWith(p))) {
    if (!user)
      return Response.redirect(new URL("/login?redirect=" + path, request.url))
    const role =
      (user?.user_metadata as { role?: "student" | "professor" } | undefined)
        ?.role ?? "student"
    if (role === "professor") {
      return Response.redirect(new URL("/profesores/dashboard", request.url))
    }
  }

  if (professorProtected.some((p) => path.startsWith(p))) {
    if (!user)
      return Response.redirect(
        new URL("/profesores/login?redirect=" + path, request.url)
      )
    const role =
      (user?.user_metadata as { role?: "student" | "professor" } | undefined)
        ?.role ?? "student"
    if (role !== "professor")
      return Response.redirect(new URL("/dashboard", request.url))
  }

  // Proteger /admin: requiere usuario con rol admin o cookie de bypass en dev
  if (adminProtected.some((p) => path.startsWith(p))) {
    const bypass = request.cookies.get("admin_bypass")?.value === "1"
    const role = (user?.user_metadata as { role?: string } | undefined)?.role ?? ""
    if (!user && !bypass) {
      return Response.redirect(new URL("/login?redirect=" + path, request.url))
    }
    if (user && role !== "admin" && !bypass) {
      return Response.redirect(new URL("/dashboard", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
