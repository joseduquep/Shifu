-- 0001_init.sql — Esquema inicial normalizado (3FN) para Shifu
-- Idioma: español, snake_case plural
-- Notas:
-- - RLS desactivada por ahora (se activará cuando definamos roles)
-- - Sin datos seed (los creará la pantalla de Admin)
-- - Incluye vistas de agregados para listados y perfil

-- Extensiones útiles
create extension if not exists pgcrypto;

-- Universidades (aunque por ahora solo EAFIT)
create table if not exists universidades (
	id uuid primary key default gen_random_uuid(),
	nombre text not null unique,
	created_at timestamptz not null default now()
);

-- Departamentos (pertenecen a una universidad)
create table if not exists departamentos (
	id uuid primary key default gen_random_uuid(),
	universidad_id uuid not null references universidades(id) on delete cascade,
	nombre text not null,
	created_at timestamptz not null default now()
);
-- índice único case-insensitive por universidad+nombre
create unique index if not exists ux_departamentos_universidad_nombre
	on departamentos (universidad_id, lower(nombre));

-- Profesores
create table if not exists profesores (
	id uuid primary key default gen_random_uuid(),
	departamento_id uuid not null references departamentos(id) on delete restrict,
	nombre_completo text not null,
	email text,
	bio text,
	created_at timestamptz not null default now()
);
create unique index if not exists ux_profesores_departamento_nombre
	on profesores (departamento_id, lower(nombre_completo));

-- Materias (asignaturas) asociadas a un departamento
create table if not exists materias (
	id uuid primary key default gen_random_uuid(),
	departamento_id uuid not null references departamentos(id) on delete restrict,
	nombre text not null,
	codigo text,
	created_at timestamptz not null default now()
);
create unique index if not exists ux_materias_departamento_nombre
	on materias (departamento_id, lower(nombre));

-- Relación M:N entre profesores y materias, con bandera de actividad
create table if not exists profesores_materias (
	profesor_id uuid not null references profesores(id) on delete cascade,
	materia_id uuid not null references materias(id) on delete cascade,
	activo boolean not null default true,
	primary key (profesor_id, materia_id)
);

-- Semestres (solo términos 1 y 2)
create table if not exists semestres (
	codigo text primary key,
	anio int not null,
	termino smallint not null,
	check (termino in (1, 2)),
	check (codigo ~ '^[0-9]{4}-(1|2)$'),
	check (codigo = (anio::text || '-' || termino::text))
);

-- Estudiantes (perfil, auth se integra luego)
create table if not exists estudiantes (
	id uuid primary key default gen_random_uuid(),
	user_id uuid, -- enlazará a auth.users.id en el futuro
	nombres text not null,
	apellidos text not null,
	email text not null,
	epik_id text not null,
	telefono text,
	fecha_nacimiento date,
	created_at timestamptz not null default now()
);
create unique index if not exists ux_estudiantes_email_ci on estudiantes (lower(email));
create unique index if not exists ux_estudiantes_epik_ci on estudiantes (lower(epik_id));

-- Reseñas (aún no expondremos POST; se deja el modelo)
create table if not exists resenas (
	id uuid primary key default gen_random_uuid(),
	profesor_id uuid not null references profesores(id) on delete cascade,
	estudiante_id uuid references estudiantes(id) on delete set null,
	materia_id uuid references materias(id) on delete set null,
	semestre_codigo text not null references semestres(codigo) on delete restrict,
	rating numeric(3,1) not null,
	comentario text,
	anonimo boolean not null default false,
	created_at timestamptz not null default now(),
	check (rating >= 0.5 and rating <= 5.0),
	check (rating*10 % 5 = 0) -- incrementos de 0.5
);

-- Evitar duplicado: misma persona reseñando al mismo profesor en mismo semestre
-- Aplicable solo cuando estudiante_id no es null
create unique index if not exists resenas_unicas_por_estudiante
	on resenas (profesor_id, estudiante_id, semestre_codigo)
	where estudiante_id is not null;

-- Índices para búsquedas comunes
create index if not exists idx_profesores_nombre on profesores (lower(nombre_completo));
create index if not exists idx_materias_nombre on materias (lower(nombre));
create index if not exists idx_departamentos_nombre on departamentos (lower(nombre));
create index if not exists idx_resenas_prof_sem on resenas (profesor_id, semestre_codigo, created_at desc);

-- Vistas de agregados para listados y perfil
create or replace view v_profesores_estadisticas as
select
	p.id as profesor_id,
	avg(r.rating)::numeric(3,2) as calificacion_promedio,
	count(r.id) as cantidad_resenas
from profesores p
left join resenas r on r.profesor_id = p.id
group by p.id;

create or replace view v_profesores_ratings_por_semestre as
select
	r.profesor_id,
	r.semestre_codigo,
	avg(r.rating)::numeric(3,2) as calificacion_promedio,
	count(r.id) as cantidad_resenas
from resenas r
group by r.profesor_id, r.semestre_codigo
order by r.profesor_id, r.semestre_codigo;

create or replace view v_profesores_materias_activas as
select pm.profesor_id, m.id as materia_id, m.nombre
from profesores_materias pm
join materias m on m.id = pm.materia_id
where pm.activo = true;

-- Permisos (RLS desactivado explícitamente). En Supabase, el rol anon/authenticated
-- podrá leer si no habilitamos RLS. Aquí documentamos la intención:
-- alter table <tabla> disable row level security; -- por defecto están deshabilitadas

-- Sin seeds: los catálogos se cargarán desde la pantalla de Admin más adelante.
