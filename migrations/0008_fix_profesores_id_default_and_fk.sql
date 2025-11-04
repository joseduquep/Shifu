-- 0008_fix_profesores_id_default_and_fk.sql — Arregla default de profesores.id y FK errónea

-- Asegurar extensión para UUID si no existe
create extension if not exists pgcrypto;

-- 1) Quitar FK equivocada sobre profesores.id si existe
alter table if exists public.profesores
	drop constraint if exists profesores_id_fkey;

-- 2) Asegurar que la PK siga siendo la columna id
alter table if exists public.profesores
	alter column id drop default;

-- 3) Establecer default correcto para generar UUIDs automáticamente
alter table if exists public.profesores
	alter column id set default gen_random_uuid();

-- 4) Reafirmar NOT NULL por si algún motor lo quitó
alter table if exists public.profesores
	alter column id set not null;

-- Nota: La FK correcta es profesores.user_id -> auth.users(id) y ya está
-- definida en 0003_link_profesores_auth.sql como fk_profesores_user.


