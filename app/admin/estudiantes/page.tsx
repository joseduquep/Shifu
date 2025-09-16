import { z } from 'zod'
import { EstudianteCreateSchema, EstudianteUpdateSchema } from '@/lib/admin/schemas/estudiantes'
import { createEstudiante, deleteEstudiante, listEstudiantes, updateEstudiante } from '@/lib/admin/dao/estudiantes'

export const dynamic = 'force-dynamic'

async function getData() {
	return await listEstudiantes()
}

export default async function AdminEstudiantesPage() {
	const items = await getData()
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<h2 className="text-lg font-medium">Estudiantes</h2>
				<p className="text-white/70 text-sm mt-1">Se crea y sincroniza usuario de Auth automáticamente.</p>
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<CreateForm />
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-0 overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-[#0b0d12]/60 text-white/70">
						<tr>
							<th className="text-left px-4 py-3">Nombre</th>
							<th className="text-left px-4 py-3">Email</th>
							<th className="text-left px-4 py-3">EPIK ID</th>
							<th className="text-right px-4 py-3">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{items.map((e) => (
							<tr key={e.id} className="border-t border-white/10">
								<td className="px-4 py-2">{e.nombres} {e.apellidos}</td>
								<td className="px-4 py-2">{e.email}</td>
								<td className="px-4 py-2">{e.epik_id}</td>
								<td className="px-4 py-2 text-right">
									<EditForm id={e.id} nombres={e.nombres} apellidos={e.apellidos} email={e.email} epik_id={e.epik_id} telefono={e.telefono ?? ''} fecha_nacimiento={e.fecha_nacimiento ?? ''} />
									<DeleteForm id={e.id} />
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
	const parsed = EstudianteCreateSchema.safeParse({
		nombres: formData.get('nombres'),
		apellidos: formData.get('apellidos'),
		email: formData.get('email'),
		epik_id: formData.get('epik_id'),
		telefono: formData.get('telefono') || undefined,
		fecha_nacimiento: formData.get('fecha_nacimiento') || undefined,
		password: formData.get('password'),
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await createEstudiante(parsed.data)
}

async function actionUpdate(formData: FormData) {
	'use server'
	const parsed = EstudianteUpdateSchema.safeParse({
		id: formData.get('id'),
		nombres: formData.get('nombres') || undefined,
		apellidos: formData.get('apellidos') || undefined,
		email: formData.get('email') || undefined,
		epik_id: formData.get('epik_id') || undefined,
		telefono: formData.get('telefono') || undefined,
		fecha_nacimiento: formData.get('fecha_nacimiento') || undefined,
		password: formData.get('password') || undefined,
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await updateEstudiante(parsed.data)
}

async function actionDelete(formData: FormData) {
	'use server'
	const id = String(formData.get('id') || '')
	if (!z.string().uuid().safeParse(id).success) throw new Error('ID inválido')
	await deleteEstudiante(id)
}

function CreateForm() {
	return (
		<form action={actionCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
			<div>
				<label className="block text-xs text-white/70 mb-1">Nombres</label>
				<input name="nombres" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" required />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Apellidos</label>
				<input name="apellidos" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" required />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Email</label>
				<input name="email" type="email" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" required />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">EPIK ID</label>
				<input name="epik_id" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" required />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Teléfono</label>
				<input name="telefono" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Fecha de nacimiento</label>
				<input name="fecha_nacimiento" type="date" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" />
			</div>
			<div className="md:col-span-3 flex items-center gap-3">
				<input name="password" type="password" placeholder="Contraseña" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-96" required />
			</div>
			<div className="md:col-span-3">
				<button type="submit" className="h-10 px-4 rounded-lg bg-primary text-[#0b0d12] text-sm font-medium">Crear estudiante</button>
			</div>
		</form>
	)
}

function EditForm({ id, nombres, apellidos, email, epik_id, telefono, fecha_nacimiento }: { id: string; nombres: string; apellidos: string; email: string; epik_id: string; telefono: string; fecha_nacimiento: string }) {
	return (
		<form action={actionUpdate} className="inline-flex items-center gap-2 mr-2 flex-wrap">
			<input type="hidden" name="id" value={id} />
			<input name="nombres" defaultValue={nombres} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-40" />
			<input name="apellidos" defaultValue={apellidos} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-40" />
			<input name="email" defaultValue={email} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-56" />
			<input name="epik_id" defaultValue={epik_id} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-40" />
			<input name="telefono" defaultValue={telefono} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-40" />
			<input name="fecha_nacimiento" defaultValue={fecha_nacimiento} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-40" />
			<input name="password" type="password" placeholder="Nueva contraseña (opcional, requerida si no tiene Auth)" className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-64" />
			<button type="submit" className="h-9 px-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/5">Guardar</button>
		</form>
	)
}

import { DeleteAssistant } from '@/app/admin/components/delete-assistant'

function DeleteForm({ id }: { id: string }) {
	return (
		<DeleteAssistant
			title="Eliminar estudiante"
			description="Puedes desvincular o eliminar por completo. Si tiene usuario de Auth, evalúa borrarlo en /admin/users."
			impact={undefined}
			action={actionDelete}
			hiddenFields={{ id }}
			triggerClassName="h-9 px-3 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10"
		/>
	)
}
