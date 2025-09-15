import { supabaseAdmin } from './base'

export type ProfesorMateria = {
	profesor_id: string
	materia_id: string
	activo: boolean
}

export async function listMateriasDeProfesor(profesorId: string) {
	const { data, error } = await supabaseAdmin
		.from('profesores_materias')
		.select('profesor_id, materia_id, activo')
		.eq('profesor_id', profesorId)
	if (error) throw new Error(error.message)
	return (data || []) as ProfesorMateria[]
}

export async function setMateriasDeProfesor(
	profesorId: string,
	entries: { materia_id: string; activo: boolean }[],
) {
	// Simplificación: limpiar y reinsertar (para demo). En fase posterior, optimizar con upserts diferenciales.
	const { error: delErr } = await supabaseAdmin
		.from('profesores_materias')
		.delete()
		.eq('profesor_id', profesorId)
	if (delErr) throw delErr
	if (!entries.length) return
	const rows = entries.map((e) => ({ profesor_id: profesorId, materia_id: e.materia_id, activo: e.activo }))
	const { error } = await supabaseAdmin.from('profesores_materias').insert(rows)
	if (error) throw error
}
