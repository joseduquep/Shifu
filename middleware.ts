import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

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
    const professorProtected = ['/profesores/dashboard']

    if (studentProtected.some((p) => path.startsWith(p))) {
        if (!user) return Response.redirect(new URL('/login?redirect=' + path, request.url))
        const role =
            ((user?.user_metadata as { role?: 'student' | 'professor' } | undefined)?.role) ??
            'student'
        if (role === 'professor') {
            return Response.redirect(new URL('/profesores/dashboard', request.url))
        }
    }

    if (professorProtected.some((p) => path.startsWith(p))) {
        if (!user) return Response.redirect(new URL('/profesores/login?redirect=' + path, request.url))
        const role =
            ((user?.user_metadata as { role?: 'student' | 'professor' } | undefined)?.role) ??
            'student'
        if (role !== 'professor') return Response.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
