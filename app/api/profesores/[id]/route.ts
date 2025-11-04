// File: `app/api/profesores/[id]/route.ts`
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabasePublic } from '@/lib/supabase/public-client';

const ParamsSchema = z.object({ id: z.string().uuid() });

type MateriaRow = {
    materia_id: string;
    materia_nombre: string;
    materia_codigo: string | null;
    departamento_id: string;
    departamento_nombre: string;
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const parsed = ParamsSchema.safeParse({ id });
    if (!parsed.success) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const { data, error } = await supabasePublic
        .from('profesores')
        .select(
            'id, nombre_completo, email, bio, fotografia, raw_scraped_data, created_at, departamentos:departamento_id ( id, nombre, universidades:universidad_id ( id, nombre ) )',
        )
        .eq('id', id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const { data: materias } = await supabasePublic
        .from('v_profesores_materias_activas')
        .select('materia_id, materia_nombre, materia_codigo, departamento_id, departamento_nombre')
        .eq('profesor_id', id);

    type Raw = {
        fotografia?: string | null
        scrapedData?: {
            fotografia?: string | null;
            email?: string | null;
            bio?: string | null;
            areasConocimiento?: string[];
            programas?: string[];
            gruposInvestigacion?: string[];
        }
        areasConocimiento?: string[]
        programas?: string[]
        gruposInvestigacion?: string[]
    } | null

    type ProfesorDb = {
        id: string
        nombre_completo: string
        email: string | null
        bio: string | null
        fotografia: string | null
        raw_scraped_data: Raw
        created_at: string
        departamentos?: { nombre?: string; universidades?: { nombre?: string } | null } | null
    }

    const row = data as unknown as ProfesorDb
    const raw = row.raw_scraped_data
    const scraped = raw?.scrapedData

    const fotografia = row.fotografia ?? raw?.fotografia ?? scraped?.fotografia ?? null

    const email = row.email ?? scraped?.email ?? null
    const bio = row.bio ?? scraped?.bio ?? null

    const arr = (a?: unknown, b?: unknown) =>
        (Array.isArray(a) && a.length ? a : Array.isArray(b) ? b : []) as string[];

    return NextResponse.json({
        id: row.id,
        nombreCompleto: row.nombre_completo,
        email,
        miembroDesde: row.created_at,
        bio,
        departamento: row.departamentos?.nombre ?? '',
        universidad: row.departamentos?.universidades?.nombre ?? '',
        areasConocimiento: arr(raw?.areasConocimiento, scraped?.areasConocimiento),
        programas: arr(raw?.programas, scraped?.programas),
        gruposInvestigacion: arr(raw?.gruposInvestigacion, scraped?.gruposInvestigacion),
        fotografia,
        materias: ((materias as MateriaRow[] | null) ?? []).map((m) => ({
            id: m.materia_id,
            nombre: m.materia_nombre,
            codigo: m.materia_codigo,
            departamento: m.departamento_nombre,
            departamento_id: m.departamento_id,
        })),
    });
}
