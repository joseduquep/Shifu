import { z } from 'zod'
import { UniversidadCreateSchema, UniversidadUpdateSchema } from '@/lib/admin/schemas/universidades'
import { createUniversidad, deleteUniversidad, listUniversidades, updateUniversidad } from '@/lib/admin/dao/universidades'

export const dynamic = 'force-dynamic'

async function getData() {
	return await listUniversidades()
}

export default async function AdminUniversidadesPage() {
	const universidades = await getData()
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<h2 className="text-lg font-medium">Universidades</h2>
				<p className="text-white/70 text-sm mt-1">CRUD básico</p>
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<CreateForm />
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-0 overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-[#0b0d12]/60 text-white/70">
						<tr>
							<th className="text-left px-4 py-3">Nombre</th>
							<th className="text-right px-4 py-3">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{universidades.map((u) => (
							<tr key={u.id} className="border-t border-white/10">
								<td className="px-4 py-2">{u.nombre}</td>
								<td className="px-4 py-2 text-right">
									<EditForm id={u.id} nombre={u.nombre} />
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
	const parsed = UniversidadCreateSchema.safeParse({ nombre: formData.get('nombre') })
	if (!parsed.success) throw new Error('Datos inválidos')
	await createUniversidad(parsed.data)
}

async function actionUpdate(formData: FormData) {
	'use server'
	const parsed = UniversidadUpdateSchema.safeParse({
		id: formData.get('id'),
		nombre: formData.get('nombre'),
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await updateUniversidad(parsed.data)
}

async function actionDelete(formData: FormData) {
	'use server'
	const id = String(formData.get('id') || '')
	if (!z.string().uuid().safeParse(id).success) throw new Error('ID inválido')
	await deleteUniversidad(id)
}

function CreateForm() {
	return (
		<form action={actionCreate} className="flex items-end gap-3">
			<div>
				<label htmlFor="nombre" className="block text-xs text-white/70 mb-1">Nombre</label>
				<input id="nombre" name="nombre" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm" required />
			</div>
			<button type="submit" className="h-10 px-4 rounded-lg bg-primary text-[#0b0d12] text-sm font-medium">Crear</button>
		</form>
	)
}

function EditForm({ id, nombre }: { id: string; nombre: string }) {
	return (
		<form action={actionUpdate} className="inline-flex items-center gap-2 mr-2">
			<input type="hidden" name="id" value={id} />
			<input name="nombre" defaultValue={nombre} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-56" />
			<button type="submit" className="h-9 px-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/5">Guardar</button>
		</form>
	)
}

import { DeleteAssistant } from '@/app/admin/components/delete-assistant'

function DeleteForm({ id }: { id: string }) {
	return (
		<DeleteAssistant
			title="Eliminar universidad"
			description="Puedes eliminar la universidad. Si tiene departamentos asociados, el borrado puede fallar por restricciones."
			impact={undefined}
			action={actionDelete}
			hiddenFields={{ id }}
			triggerClassName="h-9 px-3 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10"
		/>
	)
}
