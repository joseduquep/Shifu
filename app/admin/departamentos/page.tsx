import { z } from 'zod'
import { DepartamentoCreateSchema, DepartamentoUpdateSchema } from '@/lib/admin/schemas/departamentos'
import { listUniversidades } from '@/lib/admin/dao/universidades'
import { createDepartamento, deleteDepartamento, listDepartamentos, updateDepartamento } from '@/lib/admin/dao/departamentos'

export const dynamic = 'force-dynamic'

async function getData(universidadId?: string) {
	const [universidades, departamentos] = await Promise.all([
		listUniversidades(),
		listDepartamentos(universidadId),
	])
	return { universidades, departamentos }
}

export default async function AdminDepartamentosPage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
	const sp = (await searchParams) || {}
	const universidadId = sp.universidadId
	const { universidades, departamentos } = await getData(universidadId)
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<h2 className="text-lg font-medium">Departamentos</h2>
				<p className="text-white/70 text-sm mt-1">CRUD con filtro por universidad</p>
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<Filter universidades={universidades} selected={universidadId} />
				<div className="mt-4">
					<CreateForm universidades={universidades} />
				</div>
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-0 overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-[#0b0d12]/60 text-white/70">
						<tr>
							<th className="text-left px-4 py-3">Nombre</th>
							<th className="text-left px-4 py-3">Universidad</th>
							<th className="text-right px-4 py-3">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{departamentos.map((d) => {
							const uni = universidades.find((u) => u.id === d.universidad_id)
							return (
								<tr key={d.id} className="border-t border-white/10">
									<td className="px-4 py-2">{d.nombre}</td>
									<td className="px-4 py-2">{uni?.nombre ?? '—'}</td>
									<td className="px-4 py-2 text-right">
										<EditForm id={d.id} nombre={d.nombre} universidadId={d.universidad_id} universidades={universidades} />
										<DeleteForm id={d.id} />
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
	const parsed = DepartamentoCreateSchema.safeParse({
		universidadId: formData.get('universidadId'),
		nombre: formData.get('nombre'),
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await createDepartamento(parsed.data)
}

async function actionUpdate(formData: FormData) {
	'use server'
	const parsed = DepartamentoUpdateSchema.safeParse({
		id: formData.get('id'),
		universidadId: formData.get('universidadId'),
		nombre: formData.get('nombre'),
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await updateDepartamento(parsed.data)
}

async function actionDelete(formData: FormData) {
	'use server'
	const id = String(formData.get('id') || '')
	if (!z.string().uuid().safeParse(id).success) throw new Error('ID inválido')
	await deleteDepartamento(id)
}

function Filter({ universidades, selected }: { universidades: { id: string; nombre: string }[]; selected?: string }) {
	return (
		<form className="flex items-end gap-3" action="/admin/departamentos" method="get">
			<div>
				<label className="block text-xs text-white/70 mb-1">Universidad</label>
				<select name="universidadId" defaultValue={selected} className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm min-w-56">
					<option value="">Todas</option>
					{universidades.map((u) => (
						<option key={u.id} value={u.id}>{u.nombre}</option>
					))}
				</select>
			</div>
			<button type="submit" className="h-10 px-4 rounded-lg border border-white/20 text-white/80 hover:bg-white/5">Filtrar</button>
		</form>
	)
}

function CreateForm({ universidades }: { universidades: { id: string; nombre: string }[] }) {
	return (
		<form action={actionCreate} className="flex items-end gap-3">
			<div>
				<label className="block text-xs text-white/70 mb-1">Universidad</label>
				<select name="universidadId" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm min-w-56" required>
					{universidades.map((u) => (
						<option key={u.id} value={u.id}>{u.nombre}</option>
					))}
				</select>
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Nombre</label>
				<input name="nombre" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm" required />
			</div>
			<button type="submit" className="h-10 px-4 rounded-lg bg-primary text-[#0b0d12] text-sm font-medium">Crear</button>
		</form>
	)
}

function EditForm({ id, nombre, universidadId, universidades }: { id: string; nombre: string; universidadId: string; universidades: { id: string; nombre: string }[] }) {
	return (
		<form action={actionUpdate} className="inline-flex items-center gap-2 mr-2">
			<input type="hidden" name="id" value={id} />
			<select name="universidadId" defaultValue={universidadId} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm">
				{universidades.map((u) => (
					<option key={u.id} value={u.id}>{u.nombre}</option>
				))}
			</select>
			<input name="nombre" defaultValue={nombre} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-56" />
			<button type="submit" className="h-9 px-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/5">Guardar</button>
		</form>
	)
}

import { DeleteAssistant } from '@/app/admin/components/delete-assistant'

function DeleteForm({ id }: { id: string }) {
	// Nota: en una iteración futura, podemos cargar conteos de profesores/materias dependientes para mostrarlos en impact
	return (
		<DeleteAssistant
			title="Eliminar departamento"
			description="Si hay profesores o materias en este departamento, considera re-asignarlos antes para evitar errores."
			impact={undefined}
			action={actionDelete}
			hiddenFields={{ id }}
			triggerClassName="h-9 px-3 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10"
		/>
	)
}
