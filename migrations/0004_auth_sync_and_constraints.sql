-- 0004_auth_sync_and_constraints.sql — Sincronización de email/metadatos desde auth.users
-- y consolidación de FKs/índices en estudiantes

-- Asegurar columna user_id en estudiantes y su FK
alter table if exists public.estudiantes
	add column if not exists user_id uuid;

alter table if exists public.estudiantes
	drop constraint if exists fk_estudiantes_user;

alter table if exists public.estudiantes
	add constraint fk_estudiantes_user
	foreign key (user_id) references auth.users(id)
	on delete set null;

create unique index if not exists ux_estudiantes_user_id
	on public.estudiantes(user_id)
	where user_id is not null;

-- Función de sincronización tras cambios en auth.users
create or replace function public.sync_on_auth_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	-- Sincroniza perfiles
	update public.profiles
	set email = new.email,
		full_name = coalesce(new.raw_user_meta_data->>'full_name', full_name),
		role = coalesce(new.raw_user_meta_data->>'role', role),
		avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', avatar_url),
		updated_at = now()
	where id = new.id;

	-- Sincroniza estudiantes.email si está vinculado
	update public.estudiantes
	set email = new.email
	where user_id = new.id;

	-- Sincroniza profesores.email si está vinculado
	update public.profesores
	set email = new.email
	where user_id = new.id;

	return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update on auth.users
for each row execute function public.sync_on_auth_user_update();
