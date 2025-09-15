import { supabaseAdmin } from './base'
import { type MateriaCreate, type MateriaUpdate } from '@/lib/admin/schemas/materias'

export async function listMaterias(departamentoId?: string) {
	let q = supabaseAdmin.from('materias').select('id, nombre, codigo, departamento_id').order('nombre')
	if (departamentoId) q = q.eq('departamento_id', departamentoId)
	const { data, error } = await q
	if (error) throw new Error(error.message)
	return data || []
}

export async function createMateria(input: MateriaCreate) {
	const { data, error } = await supabaseAdmin
		.from('materias')
		.insert({ nombre: input.nombre, codigo: input.codigo, departamento_id: input.departamentoId })
		.select('id, nombre, codigo, departamento_id')
		.single()
	if (error) throw error
	return data!
}

export async function updateMateria(input: MateriaUpdate) {
	const { data, error } = await supabaseAdmin
		.from('materias')
		.update({ nombre: input.nombre, codigo: input.codigo, departamento_id: input.departamentoId })
		.eq('id', input.id)
		.select('id, nombre, codigo, departamento_id')
		.single()
	if (error) throw error
	return data!
}

export async function deleteMateria(id: string) {
	const { error } = await supabaseAdmin
		.from('materias')
		.delete()
		.eq('id', id)
	if (error) throw error
}
