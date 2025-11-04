// File: `app/api/profesores/route.ts`
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabasePublic } from "@/lib/supabase/public-client";

const QuerySchema = z.object({
    q: z.string().trim().optional(),
    departamentoId: z.string().uuid().optional(),
    universidadId: z.string().uuid().optional(),
    materiaId: z.string().uuid().optional(),
    semestreCodigo: z
        .string()
        .trim()
        .regex(/^[0-9]{4}-(1|2)$/)
        .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

type MateriaRow = { materia_id: string; nombre: string };

type MateriaActivaRow = {
    profesor_id: string;
    materia_id: string;
    nombre: string;
};

type ProfesorRow = {
    id: string;
    nombre_completo: string;
    fotografia?: string | null; // NUEVO
    departamentos?: {
        nombre?: string;
        universidades?: { nombre?: string } | null;
    } | null;
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
        return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }
    const {
        q,
        departamentoId,
        universidadId,
        materiaId,
        semestreCodigo, // no usado (legacy), se mantiene para compat
        limit,
        offset,
    } = parsed.data;

    const base = supabasePublic
        .from("profesores")
        .select(
            "id, nombre_completo, fotografia, raw_scraped_data, departamentos:departamento_id ( id, nombre, universidades:universidad_id ( id, nombre ) )",
            { count: "exact" }
        )
        .range(offset, offset + limit - 1);

    let query = base;

    if (departamentoId) {
        query = query.eq("departamento_id", departamentoId);
    }
    if (universidadId) {
        query = query.eq("departamentos.universidad_id", universidadId);
    }
    if (q) {
        query = query.ilike("nombre_completo", `%${q}%`);
    }

    if (materiaId) {
        const { data: pids, error: perr } = await supabasePublic
            .from('profesores_materias')
            .select('profesor_id')
            .eq('materia_id', materiaId)
            .eq('activo', true);
        const allowed = Array.from(new Set((pids || []).map((r: { profesor_id: string }) => r.profesor_id)));
        if (perr) {
            return NextResponse.json({ error: perr.message }, { status: 500 });
        }
        if (allowed.length === 0) {
            return NextResponse.json({ items: [], count: 0 });
        }
        query = query.in('id', allowed);
    }

    const { data, error } = await query;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ids = (data || []).map((d) => d.id);
    const materiasPorProfesor = new Map<string, MateriaRow[]>();
    if (ids.length) {
        const { data: mrows, error: mErr } = await supabasePublic
            .from("v_profesores_materias_activas")
            .select("profesor_id, materia_id, nombre")
            .in("profesor_id", ids);
        if (!mErr && mrows) {
            for (const r of mrows as MateriaActivaRow[]) {
                const arr = materiasPorProfesor.get(r.profesor_id) || [];
                arr.push({ materia_id: r.materia_id, nombre: r.nombre });
                materiasPorProfesor.set(r.profesor_id, arr);
            }
        }
    }

    const rows: ProfesorRow[] = (data ?? []) as ProfesorRow[];
    const out = rows.map((row) => {
        const raw = (row as any).raw_scraped_data as any;
        const fotoCol = (row as any).fotografia;
        const fotoRaw = raw?.fotografia || raw?.scrapedData?.fotografia || null;

        return {
            id: row.id,
            nombreCompleto: row.nombre_completo,
            departamento: row.departamentos?.nombre ?? '',
            universidad: row.departamentos?.universidades?.nombre ?? '',
            materias: (materiasPorProfesor.get(row.id) || []).map((m) => m.nombre),
            fotografia: fotoCol ?? fotoRaw, // preferir columna
        };
    });

    return NextResponse.json({ items: out, count: out.length });
}
