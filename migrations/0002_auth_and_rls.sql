-- 0002_auth_and_rls.sql — Supabase Auth (email/password) + RLS y políticas
-- Este script añade la tabla de perfiles enlazada a auth.users, dispara la
-- creación de perfiles tras el registro y activa RLS con políticas coherentes
-- para no romper los listados públicos existentes.

-- Tabla de perfiles (enlaza con auth.users)
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	email text not null unique,
	role text not null check (role in ('student','professor')),
	epik_id text unique,
	full_name text not null,
	avatar_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- Trigger para updated_at
create or replace function public.set_updated_at() returns trigger as $$
begin
	new.updated_at = now();
	return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
	before update on public.profiles
	for each row execute function public.set_updated_at();

-- Trigger para crear profile al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
	insert into public.profiles (id, email, role, epik_id, full_name, avatar_url)
	values (
		new.id,
		new.email,
		coalesce(new.raw_user_meta_data->>'role','student'),
		nullif(new.raw_user_meta_data->>'epik_id',''),
		coalesce(new.raw_user_meta_data->>'full_name', new.email),
		new.raw_user_meta_data->>'avatar_url'
	)
	on conflict (id) do nothing;
	return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- Habilitar RLS en todas las tablas del dominio público
alter table if exists public.universidades enable row level security;
alter table if exists public.departamentos enable row level security;
alter table if exists public.profesores enable row level security;
alter table if exists public.materias enable row level security;
alter table if exists public.profesores_materias enable row level security;
alter table if exists public.semestres enable row level security;
alter table if exists public.estudiantes enable row level security;
alter table if exists public.resenas enable row level security;
alter table if exists public.profiles enable row level security;

-- Políticas de lectura pública para catálogos y listados
DROP POLICY IF EXISTS "universidades_public_select" ON public.universidades;
CREATE POLICY "universidades_public_select"
  ON public.universidades FOR SELECT USING (true);

DROP POLICY IF EXISTS "departamentos_public_select" ON public.departamentos;
CREATE POLICY "departamentos_public_select"
  ON public.departamentos FOR SELECT USING (true);

DROP POLICY IF EXISTS "profesores_public_select" ON public.profesores;
CREATE POLICY "profesores_public_select"
  ON public.profesores FOR SELECT USING (true);

DROP POLICY IF EXISTS "materias_public_select" ON public.materias;
CREATE POLICY "materias_public_select"
  ON public.materias FOR SELECT USING (true);

DROP POLICY IF EXISTS "profesores_materias_public_select" ON public.profesores_materias;
CREATE POLICY "profesores_materias_public_select"
  ON public.profesores_materias FOR SELECT USING (true);

DROP POLICY IF EXISTS "semestres_public_select" ON public.semestres;
CREATE POLICY "semestres_public_select"
  ON public.semestres FOR SELECT USING (true);

-- Reseñas: por ahora solo lectura pública (no abrimos escritura todavía)
DROP POLICY IF EXISTS "resenas_public_select" ON public.resenas;
CREATE POLICY "resenas_public_select"
  ON public.resenas FOR SELECT USING (true);

-- Estudiantes: dueño puede leer/actualizar su propio registro
DROP POLICY IF EXISTS "estudiantes_own_select" ON public.estudiantes;
CREATE POLICY "estudiantes_own_select"
  ON public.estudiantes FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "estudiantes_own_update" ON public.estudiantes;
CREATE POLICY "estudiantes_own_update"
  ON public.estudiantes FOR UPDATE USING (auth.uid() = user_id);

-- Profiles: dueño puede leer/actualizar su perfil
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
CREATE POLICY "profiles_own_select"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
CREATE POLICY "profiles_own_update"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Nota: el rol service_role (backend) bypass RLS automáticamente en Supabase.
