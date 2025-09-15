import { z } from 'zod'
import { ProfesorCreateSchema, ProfesorUpdateSchema } from '@/lib/admin/schemas/profesores'
import { createProfesor, deleteProfesor, listProfesores, updateProfesor } from '@/lib/admin/dao/profesores'
import { listMaterias } from '@/lib/admin/dao/materias'
import { listMateriasDeProfesor, setMateriasDeProfesor } from '@/lib/admin/dao/profesores_materias'

export const dynamic = 'force-dynamic'

async function getData() {
	const [profesores, materias] = await Promise.all([
		listProfesores(),
		listMaterias(),
	])
	return { profesores, materias }
}

export default async function AdminProfesoresPage() {
	const { profesores, materias } = await getData()
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<h2 className="text-lg font-medium">Profesores</h2>
				<p className="text-white/70 text-sm mt-1">Crear con opción de cuenta Auth. Gestiona materias activas.</p>
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<CreateForm materias={materias} />
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-0 overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-[#0b0d12]/60 text-white/70">
						<tr>
							<th className="text-left px-4 py-3">Nombre</th>
							<th className="text-left px-4 py-3">Email</th>
							<th className="text-right px-4 py-3">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{profesores.map((p) => (
							<tr key={p.id} className="border-t border-white/10">
								<td className="px-4 py-2">{p.nombre_completo}</td>
								<td className="px-4 py-2">{p.email ?? '—'}</td>
								<td className="px-4 py-2 text-right">
									<EditForm id={p.id} nombre_completo={p.nombre_completo} email={p.email ?? ''} bio={p.bio ?? ''} departamento_id={p.departamento_id} />
									<ManageSubjectsForm profesorId={p.id} materias={materias} />
									<DeleteForm id={p.id} />
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
	const parsed = ProfesorCreateSchema.safeParse({
		nombre_completo: formData.get('nombre_completo'),
		email: formData.get('email') || undefined,
		bio: formData.get('bio') || undefined,
		departamento_id: formData.get('departamento_id'),
		create_auth_user: formData.get('create_auth_user') === 'on',
		password: formData.get('password') || undefined,
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await createProfesor(parsed.data)
}

async function actionUpdate(formData: FormData) {
	'use server'
	const parsed = ProfesorUpdateSchema.safeParse({
		id: formData.get('id'),
		nombre_completo: formData.get('nombre_completo') || undefined,
		email: formData.get('email') || undefined,
		bio: formData.get('bio') || undefined,
		departamento_id: formData.get('departamento_id') || undefined,
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await updateProfesor(parsed.data)
}

async function actionDelete(formData: FormData) {
	'use server'
	const id = String(formData.get('id') || '')
	if (!z.string().uuid().safeParse(id).success) throw new Error('ID inválido')
	await deleteProfesor(id)
}

async function actionSetMaterias(formData: FormData) {
	'use server'
	const profesorId = String(formData.get('profesorId') || '')
	if (!z.string().uuid().safeParse(profesorId).success) throw new Error('Profesor inválido')
	// Recoger checkboxes: materias[] y para cada una verificar si viene en el form y si tiene *_activo
	const materias = JSON.parse(String(formData.get('materias_json') || '[]')) as { id: string }[]
	const entries = materias.map((m) => ({
		materia_id: m.id,
		activo: formData.get(`activo_${m.id}`) === 'on',
	}))
	await setMateriasDeProfesor(profesorId, entries)
}

function CreateForm({ materias }: { materias: { id: string; nombre: string; departamento_id: string }[] }) {
	return (
		<form action={actionCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
			<div className="md:col-span-2">
				<label className="block text-xs text-white/70 mb-1">Nombre completo</label>
				<input name="nombre_completo" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" required />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Email</label>
				<input name="email" type="email" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" />
			</div>
			<div className="md:col-span-3">
				<label className="block text-xs text-white/70 mb-1">Bio</label>
				<input name="bio" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Departamento</label>
				{/* Para simplificar, reusaremos el id directamente; una mejora posterior puede cargar departamentos aquí */}
				<input name="departamento_id" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-full" placeholder="UUID del departamento" required />
			</div>
			<div className="md:col-span-3 flex items-center gap-3">
				<label className="inline-flex items-center gap-2 text-sm text-white/80">
					<input type="checkbox" name="create_auth_user" />
					Crear usuario de Auth
				</label>
				<input name="password" type="password" placeholder="Contraseña (requerida si creas usuario)" className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-96" />
			</div>
			<div className="md:col-span-3">
				<button type="submit" className="h-10 px-4 rounded-lg bg-primary text-[#0b0d12] text-sm font-medium">Crear profesor</button>
			</div>
		</form>
	)
}

function EditForm({ id, nombre_completo, email, bio, departamento_id }: { id: string; nombre_completo: string; email: string; bio: string; departamento_id: string }) {
	return (
		<form action={actionUpdate} className="inline-flex items-center gap-2 mr-2 flex-wrap">
			<input type="hidden" name="id" value={id} />
			<input name="nombre_completo" defaultValue={nombre_completo} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-56" />
			<input name="email" defaultValue={email} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-56" />
			<input name="bio" defaultValue={bio} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-64" />
			<input name="departamento_id" defaultValue={departamento_id} className="h-9 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm w-64" />
			<button type="submit" className="h-9 px-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/5">Guardar</button>
		</form>
	)
}

async function getMateriasState(profesorId: string) {
	const rows = await listMateriasDeProfesor(profesorId)
	const map = new Map(rows.map((r) => [r.materia_id, r.activo]))
	return map
}

async function ManageSubjectsForm({ profesorId, materias }: { profesorId: string; materias: { id: string; nombre: string }[] }) {
	const state = await getMateriasState(profesorId)
	return (
		<form action={actionSetMaterias} className="inline-flex items-center gap-2 mr-2">
			<input type="hidden" name="profesorId" value={profesorId} />
			<input type="hidden" name="materias_json" value={JSON.stringify(materias.map((m) => ({ id: m.id })))} />
			<div className="inline-flex flex-wrap gap-2 max-w-[560px]">
				{materias.map((m) => (
					<label key={m.id} className="inline-flex items-center gap-1 text-xs text-white/80 border border-white/15 rounded-lg px-2 py-1">
						<input type="checkbox" name={`activo_${m.id}`} defaultChecked={state.get(m.id) || false} />
						{m.nombre}
					</label>
				))}
			</div>
			<button type="submit" className="h-9 px-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/5">Guardar materias</button>
		</form>
	)
}

import { DeleteAssistant } from '@/app/admin/components/delete-assistant'

function DeleteForm({ id }: { id: string }) {
	return (
		<DeleteAssistant
			title="Eliminar profesor"
			description="Se eliminarán reseñas del profesor (por on delete cascade) y vínculos con materias."
			impact={undefined}
			action={actionDelete}
			hiddenFields={{ id }}
			triggerClassName="h-9 px-3 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10"
		/>
	)
}
