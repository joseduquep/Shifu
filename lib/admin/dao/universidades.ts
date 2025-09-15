import { supabaseAdmin } from './base'
import { type UniversidadCreate, type UniversidadUpdate } from '@/lib/admin/schemas/universidades'

export async function listUniversidades() {
	const { data, error } = await supabaseAdmin
		.from('universidades')
		.select('id, nombre')
		.order('nombre', { ascending: true })
	if (error) throw new Error(error.message)
	return data || []
}

export async function createUniversidad(input: UniversidadCreate) {
	const { data, error } = await supabaseAdmin
		.from('universidades')
		.insert({ nombre: input.nombre })
		.select('id, nombre')
		.single()
	if (error) throw error
	return data!
}

export async function updateUniversidad(input: UniversidadUpdate) {
	const { data, error } = await supabaseAdmin
		.from('universidades')
		.update({ nombre: input.nombre })
		.eq('id', input.id)
		.select('id, nombre')
		.single()
	if (error) throw error
	return data!
}

export async function deleteUniversidad(id: string) {
	// Borrado asistido se implementará en UI/acciones más adelante
	const { error } = await supabaseAdmin
		.from('universidades')
		.delete()
		.eq('id', id)
	if (error) throw error
}
