import { z } from 'zod'
import { SemestreCreateSchema, SemestreUpdateSchema } from '@/lib/admin/schemas/semestres'
import { createSemestre, deleteSemestre, listSemestres, updateSemestre } from '@/lib/admin/dao/semestres'

export const dynamic = 'force-dynamic'

async function getData() {
	return await listSemestres()
}

export default async function AdminSemestresPage() {
	const semestres = await getData()
	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<h2 className="text-lg font-medium">Semestres</h2>
				<p className="text-white/70 text-sm mt-1">Código derivado (YYYY-1/2)</p>
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<CreateForm />
			</section>

			<section className="rounded-2xl border border-white/10 bg-[#121621] p-0 overflow-hidden">
				<table className="w-full text-sm">
					<thead className="bg-[#0b0d12]/60 text-white/70">
						<tr>
							<th className="text-left px-4 py-3">Código</th>
							<th className="text-left px-4 py-3">Año</th>
							<th className="text-left px-4 py-3">Término</th>
							<th className="text-right px-4 py-3">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{semestres.map((s) => (
							<tr key={s.codigo} className="border-t border-white/10">
								<td className="px-4 py-2">{s.codigo}</td>
								<td className="px-4 py-2">{s.anio}</td>
								<td className="px-4 py-2">{s.termino}</td>
								<td className="px-4 py-2 text-right">
									<EditForm codigo={s.codigo} anio={s.anio} termino={s.termino} />
									<DeleteForm codigo={s.codigo} />
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
	const parsed = SemestreCreateSchema.safeParse({
		anio: formData.get('anio'),
		termino: formData.get('termino'),
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await createSemestre(parsed.data)
}

async function actionUpdate(formData: FormData) {
	'use server'
	const parsed = SemestreUpdateSchema.safeParse({
		codigo: formData.get('codigo'),
		anio: formData.get('anio'),
		termino: formData.get('termino'),
	})
	if (!parsed.success) throw new Error('Datos inválidos')
	await updateSemestre(parsed.data)
}

async function actionDelete(formData: FormData) {
	'use server'
	const codigo = String(formData.get('codigo') || '')
	if (!z.string().regex(/^[0-9]{4}-(1|2)$/).safeParse(codigo).success) throw new Error('Código inválido')
	await deleteSemestre(codigo)
}

function YearSelect({ name, defaultValue }: { name: string; defaultValue?: number }) {
	const current = new Date().getFullYear()
	const years = Array.from({ length: 10 }, (_, i) => current - 5 + i)
	return (
		<select name={name} defaultValue={defaultValue} className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm">
			{years.map((y) => (
				<option key={y} value={y}>{y}</option>
			))}
		</select>
	)
}

function TermSelect({ name, defaultValue }: { name: string; defaultValue?: number }) {
	return (
		<select name={name} defaultValue={defaultValue} className="h-10 rounded-lg bg-[#0b0d12] border border-white/15 px-3 text-sm">
			<option value={1}>1</option>
			<option value={2}>2</option>
		</select>
	)
}

function CreateForm() {
	return (
		<form action={actionCreate} className="flex items-end gap-3">
			<div>
				<label className="block text-xs text-white/70 mb-1">Año</label>
				<YearSelect name="anio" />
			</div>
			<div>
				<label className="block text-xs text-white/70 mb-1">Término</label>
				<TermSelect name="termino" />
			</div>
			<button type="submit" className="h-10 px-4 rounded-lg bg-primary text-[#0b0d12] text-sm font-medium">Crear</button>
		</form>
	)
}

function EditForm({ codigo, anio, termino }: { codigo: string; anio: number; termino: number }) {
	return (
		<form action={actionUpdate} className="inline-flex items-center gap-2 mr-2">
			<input type="hidden" name="codigo" value={codigo} />
			<YearSelect name="anio" defaultValue={anio} />
			<TermSelect name="termino" defaultValue={termino} />
			<button type="submit" className="h-9 px-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/5">Guardar</button>
		</form>
	)
}

import { DeleteAssistant } from '@/app/admin/components/delete-assistant'

function DeleteForm({ codigo }: { codigo: string }) {
	return (
		<DeleteAssistant
			title="Eliminar semestre"
			description="Las reseñas asociadas podrían quedar re-agrupadas o sin referencia si existe lógica dependiente."
			impact={undefined}
			action={actionDelete}
			hiddenFields={{ codigo }}
			triggerClassName="h-9 px-3 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10"
		/>
	)
}
