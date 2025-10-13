-- 0005_profesores_favoritos_simple.sql — Tabla para profesores favoritos de estudiantes
-- VERSIÓN SIMPLIFICADA: Solo lo esencial, sin dependencias de tablas que no existen

-- Tabla de profesores favoritos
CREATE TABLE IF NOT EXISTS public.profesores_favoritos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id uuid NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    profesor_id uuid NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    
    -- Evitar duplicados: un estudiante no puede tener el mismo profesor como favorito múltiples veces
    CONSTRAINT unique_estudiante_profesor UNIQUE (estudiante_id, profesor_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_profesores_favoritos_estudiante 
    ON public.profesores_favoritos(estudiante_id);

CREATE INDEX IF NOT EXISTS idx_profesores_favoritos_profesor 
    ON public.profesores_favoritos(profesor_id);

-- Habilitar RLS
ALTER TABLE public.profesores_favoritos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: estudiantes.id = auth.users.id directamente
CREATE POLICY "Students can view own favorites" ON public.profesores_favoritos
    FOR SELECT USING (
        estudiante_id = auth.uid()
    );

CREATE POLICY "Students can add own favorites" ON public.profesores_favoritos
    FOR INSERT WITH CHECK (
        estudiante_id = auth.uid()
    );

CREATE POLICY "Students can remove own favorites" ON public.profesores_favoritos
    FOR DELETE USING (
        estudiante_id = auth.uid()
    );

-- Función helper SIMPLIFICADA para verificar si un profesor es favorito de un estudiante
CREATE OR REPLACE FUNCTION public.is_profesor_favorito(
    p_estudiante_id uuid,
    p_profesor_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS(
        SELECT 1 FROM public.profesores_favoritos 
        WHERE estudiante_id = p_estudiante_id 
        AND profesor_id = p_profesor_id
    );
$$;

-- Función SIMPLIFICADA para obtener favoritos de un estudiante (sin calificaciones por ahora)
CREATE OR REPLACE FUNCTION public.get_favoritos_estudiante(p_estudiante_id uuid)
RETURNS TABLE (
    id uuid,
    profesor_id uuid,
    nombre_completo text,
    departamento text,
    universidad text,
    calificacion_promedio numeric,
    cantidad_resenas bigint,
    created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        pf.id,
        pf.profesor_id,
        p.nombre_completo,
        d.nombre as departamento,
        u.nombre as universidad,
        0::numeric as calificacion_promedio,  -- Valor por defecto
        0::bigint as cantidad_resenas,        -- Valor por defecto
        pf.created_at
    FROM public.profesores_favoritos pf
    JOIN public.profesores p ON pf.profesor_id = p.id
    JOIN public.departamentos d ON p.departamento_id = d.id
    JOIN public.universidades u ON d.universidad_id = u.id
    WHERE pf.estudiante_id = p_estudiante_id
    ORDER BY pf.created_at DESC;
$$;
