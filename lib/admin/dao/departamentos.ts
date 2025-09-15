import { supabaseAdmin } from './base'
import { type DepartamentoCreate, type DepartamentoUpdate } from '@/lib/admin/schemas/departamentos'

export async function listDepartamentos(universidadId?: string) {
	let q = supabaseAdmin.from('departamentos').select('id, nombre, universidad_id').order('nombre')
	if (universidadId) q = q.eq('universidad_id', universidadId)
	const { data, error } = await q
	if (error) throw new Error(error.message)
	return data || []
}

export async function createDepartamento(input: DepartamentoCreate) {
	const { data, error } = await supabaseAdmin
		.from('departamentos')
		.insert({ nombre: input.nombre, universidad_id: input.universidadId })
		.select('id, nombre, universidad_id')
		.single()
	if (error) throw error
	return data!
}

export async function updateDepartamento(input: DepartamentoUpdate) {
	const { data, error } = await supabaseAdmin
		.from('departamentos')
		.update({ nombre: input.nombre, universidad_id: input.universidadId })
		.eq('id', input.id)
		.select('id, nombre, universidad_id')
		.single()
	if (error) throw error
	return data!
}

export async function deleteDepartamento(id: string) {
	const { error } = await supabaseAdmin
		.from('departamentos')
		.delete()
		.eq('id', id)
	if (error) throw error
}
