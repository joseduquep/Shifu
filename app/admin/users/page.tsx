import { z } from 'zod'
import { UserCreateSchema, UserUpdateSchema } from '@/lib/admin/schemas/users'
import { createUser, deleteUserById, listUsers, updateUser } from '@/lib/admin/dao/users'

export const dynamic = 'force-dynamic'

async function getData() {
	return await listUsers()
}

export default async function AdminUsersPage() {
	const users = await getData()
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<h2 className="text-lg font-medium">Usuarios (Auth + Profiles)</h2>
				<p className="text-white/70 text-sm mt-1">Crear/editar/borrar usuarios de Auth. Se sincronizan perfiles por trigger.</p>
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<CreateForm />
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-0 overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-[#0b0d12]/60 text-white/70">
						<tr>
							<th className="text-left px-4 py-3">Email</th>
							<th className="text-left px-4 py-3">Nombre</th>
							<th className="text-left px-4 py-3">Rol</th>
							<th className="text-right px-4 py-3">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{users.map((u) => (
							<tr key={u.id} className="border-t border-white/10">
								<td className="px-4 py-2">{u.email}</td>
								<td className="px-4 py-2">{u.full_name ?? '—'}</td>
								<td className="px-4 py-2">{u.role ?? '—'}</td>
								<td className="px-4 py-2 text-right">
									<EditForm id={u.id} email={u.email} full_name={u.full_name ?? ''} role={u.role ?? 'student'} />
									<DeleteForm id={u.id} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</div>
	)
}

async function actionCreate(formData: FormData) {
	'use server'
	const parsed = UserCreateSchema.safeParse({
		email: formData.get('email'),
		password: formData.get('password'),
		full_name: formData.get('full_name'),
		role: formData.get('role'),
		epik_id: formData.get('epik_id'),
		avatar_url: formData.get('avatar_url'),
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await createUser(parsed.data)
}

async function actionUpdate(formData: FormData) {
	'use server'
	const parsed = UserUpdateSchema.safeParse({
		id: formData.get('id'),
		email: formData.get('email') || undefined,
		password: formData.get('password') || undefined,
		full_name: formData.get('full_name') || undefined,
		role: formData.get('role') || undefined,
		epik_id: formData.get('epik_id') || undefined,
		avatar_url: formData.get('avatar_url') || undefined,
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await updateUser(parsed.data)
}

async function actionDelete(formData: FormData) {
	'use server'
	const id = String(formData.get('id') || '')
	if (!z.string().uuid().safeParse(id).success) throw new Error('ID inválido')
	await deleteUserById(id)
}

function CreateForm() {
	return (
		<form action={actionCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
			<div>
				<label className="block text-xs text-white/70 mb-1">Email</label>
				<input name="email" type="email" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" required />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Contraseña</label>
				<input name="password" type="password" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" required />
			</div>
			<div className="md:col-span-3">
				<label className="block text-xs text-white/70 mb-1">Nombre completo</label>
				<input name="full_name" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" required />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Rol</label>
				<select name="role" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full">
					<option value="student">student</option>
					<option value="professor">professor</option>
				</select>
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">EPIK ID</label>
				<input name="epik_id" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Avatar URL</label>
				<input name="avatar_url" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" />
			</div>
			<div className="md:col-span-3">
				<button type="submit" className="h-10 px-4 rounded-lg bg-primary text-[#0b0d12] text-sm font-medium">Crear usuario</button>
			</div>
		</form>
	)
}

function EditForm({ id, email, full_name, role }: { id: string; email: string; full_name: string; role: 'student' | 'professor' }) {
	return (
		<form action={actionUpdate} className="inline-flex items-center gap-2 mr-2">
			<input type="hidden" name="id" value={id} />
			<input name="email" defaultValue={email} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-56" />
			<input name="full_name" defaultValue={full_name} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-56" />
			<select name="role" defaultValue={role} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm">
				<option value="student">student</option>
				<option value="professor">professor</option>
			</select>
			<input name="password" type="password" placeholder="Nueva contraseña (opcional)" className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-64" />
			<button type="submit" className="h-9 px-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/5">Guardar</button>
		</form>
	)
}

import { DeleteAssistant } from '@/app/admin/components/delete-assistant'

function DeleteForm({ id }: { id: string }) {
	return (
		<DeleteAssistant
			title="Eliminar usuario"
			description="Eliminará el usuario en Auth y el perfil asociado. Asegúrate de revisar vínculos en estudiantes/profesores."
			impact={undefined}
			action={actionDelete}
			hiddenFields={{ id }}
			triggerClassName="h-9 px-3 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10"
		/>
	)
}
