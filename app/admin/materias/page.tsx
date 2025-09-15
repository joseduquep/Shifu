import { z } from 'zod'
import { MateriaCreateSchema, MateriaUpdateSchema } from '@/lib/admin/schemas/materias'
import { listDepartamentos } from '@/lib/admin/dao/departamentos'
import { createMateria, deleteMateria, listMaterias, updateMateria } from '@/lib/admin/dao/materias'

export const dynamic = 'force-dynamic'

async function getData(departamentoId?: string) {
	const [departamentos, materias] = await Promise.all([
		listDepartamentos(),
		listMaterias(departamentoId),
	])
	return { departamentos, materias }
}

export default async function AdminMateriasPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
	const sp = (await searchParams) || {}
	const departamentoId = sp.departamentoId
	const { departamentos, materias } = await getData(departamentoId)
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<h2 className="text-lg font-medium">Materias</h2>
				<p className="text-white/70 text-sm mt-1">CRUD con filtro por departamento</p>
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<Filter departamentos={departamentos} selected={departamentoId} />
				<div className="mt-4">
					<CreateForm departamentos={departamentos} />
				</div>
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-0 overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-[#0b0d12]/60 text-white/70">
						<tr>
							<th className="text-left px-4 py-3">Nombre</th>
							<th className="text-left px-4 py-3">Código</th>
							<th className="text-left px-4 py-3">Departamento</th>
							<th className="text-right px-4 py-3">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{materias.map((m) => {
							const dept = departamentos.find((d) => d.id === m.departamento_id)
							return (
								<tr key={m.id} className="border-t border-white/10">
									<td className="px-4 py-2">{m.nombre}</td>
									<td className="px-4 py-2">{m.codigo ?? '—'}</td>
									<td className="px-4 py-2">{dept?.nombre ?? '—'}</td>
									<td className="px-4 py-2 text-right">
										<EditForm id={m.id} nombre={m.nombre} codigo={m.codigo ?? ''} departamentoId={m.departamento_id} departamentos={departamentos} />
										<DeleteForm id={m.id} />
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</section>
		</div>
	)
}

async function actionCreate(formData: FormData) {
	'use server'
	const parsed = MateriaCreateSchema.safeParse({
		departamentoId: formData.get('departamentoId'),
		nombre: formData.get('nombre'),
		codigo: formData.get('codigo'),
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await createMateria(parsed.data)
}

async function actionUpdate(formData: FormData) {
	'use server'
	const parsed = MateriaUpdateSchema.safeParse({
		id: formData.get('id'),
		departamentoId: formData.get('departamentoId'),
		nombre: formData.get('nombre'),
		codigo: formData.get('codigo'),
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await updateMateria(parsed.data)
}

async function actionDelete(formData: FormData) {
	'use server'
	const id = String(formData.get('id') || '')
	if (!z.string().uuid().safeParse(id).success) throw new Error('ID inválido')
	await deleteMateria(id)
}

function Filter({ departamentos, selected }: { departamentos: { id: string; nombre: string }[]; selected?: string }) {
	return (
		<form className="flex items-end gap-3" action="/admin/materias" method="get">
			<div>
				<label className="block text-xs text-white/70 mb-1">Departamento</label>
				<select name="departamentoId" defaultValue={selected} className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm min-w-56">
					<option value="">Todos</option>
					{departamentos.map((d) => (
						<option key={d.id} value={d.id}>{d.nombre}</option>
					))}
				</select>
			</div>
			<button type="submit" className="h-10 px-4 rounded-lg border border-white/20 text-white/80 hover:bg-white/5">Filtrar</button>
		</form>
	)
}

function CreateForm({ departamentos }: { departamentos: { id: string; nombre: string }[] }) {
	return (
		<form action={actionCreate} className="flex items-end gap-3">
			<div>
				<label className="block text-xs text-white/70 mb-1">Departamento</label>
				<select name="departamentoId" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm min-w-56" required>
					{departamentos.map((d) => (
						<option key={d.id} value={d.id}>{d.nombre}</option>
					))}
				</select>
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Nombre</label>
				<input name="nombre" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm" required />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Código</label>
				<input name="codigo" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm" placeholder="Opcional" />
			</div>
			<button type="submit" className="h-10 px-4 rounded-lg bg-primary text-[#0b0d12] text-sm font-medium">Crear</button>
		</form>
	)
}

function EditForm({ id, nombre, codigo, departamentoId, departamentos }: { id: string; nombre: string; codigo: string; departamentoId: string; departamentos: { id: string; nombre: string }[] }) {
	return (
		<form action={actionUpdate} className="inline-flex items-center gap-2 mr-2">
			<input type="hidden" name="id" value={id} />
			<select name="departamentoId" defaultValue={departamentoId} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm">
				{departamentos.map((d) => (
					<option key={d.id} value={d.id}>{d.nombre}</option>
				))}
			</select>
			<input name="nombre" defaultValue={nombre} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-56" />
			<input name="codigo" defaultValue={codigo} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-40" placeholder="Opcional" />
			<button type="submit" className="h-9 px-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/5">Guardar</button>
		</form>
	)
}

import { DeleteAssistant } from '@/app/admin/components/delete-assistant'

function DeleteForm({ id }: { id: string }) {
	return (
		<DeleteAssistant
			title="Eliminar materia"
			description="Las relaciones con profesores serán eliminadas. Las reseñas pueden quedar con materia vacía."
			impact={undefined}
			action={actionDelete}
			hiddenFields={{ id }}
			triggerClassName="h-9 px-3 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10"
		/>
	)
}
