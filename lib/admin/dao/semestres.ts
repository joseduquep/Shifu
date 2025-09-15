import { supabaseAdmin } from './base'
import { type SemestreCreate, type SemestreUpdate } from '@/lib/admin/schemas/semestres'

export async function listSemestres() {
	const { data, error } = await supabaseAdmin
		.from('semestres')
		.select('codigo, anio, termino')
		.order('codigo', { ascending: true })
	if (error) throw new Error(error.message)
	return data || []
}

export async function createSemestre(input: SemestreCreate) {
	const codigo = `${input.anio}-${input.termino}`
	const { data, error } = await supabaseAdmin
		.from('semestres')
		.insert({ codigo, anio: input.anio, termino: input.termino })
		.select('codigo, anio, termino')
		.single()
	if (error) throw error
	return data!
}

export async function updateSemestre(input: SemestreUpdate) {
	const codigo = `${input.anio}-${input.termino}`
	const { data, error } = await supabaseAdmin
		.from('semestres')
		.update({ codigo, anio: input.anio, termino: input.termino })
		.eq('codigo', input.codigo)
		.select('codigo, anio, termino')
		.single()
	if (error) throw error
	return data!
}

export async function deleteSemestre(codigo: string) {
	const { error } = await supabaseAdmin
		.from('semestres')
		.delete()
		.eq('codigo', codigo)
	if (error) throw error
}
