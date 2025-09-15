-- 0003_link_profesores_auth.sql — Enlazar profesores con auth.users
-- Añade columna user_id en profesores y su FK hacia auth.users

alter table if exists public.profesores
	add column if not exists user_id uuid;

alter table if exists public.profesores
	add constraint fk_profesores_user
	foreign key (user_id) references auth.users(id)
	on delete set null;

create unique index if not exists ux_profesores_user_id
	on public.profesores(user_id)
	where user_id is not null;
