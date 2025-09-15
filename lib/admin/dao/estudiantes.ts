import { supabaseAdmin } from './base'
import type { EstudianteCreate, EstudianteUpdate } from '@/lib/admin/schemas/estudiantes'

export async function listEstudiantes() {
	const { data, error } = await supabaseAdmin
		.from('estudiantes')
		.select('id, user_id, nombres, apellidos, email, epik_id, telefono, fecha_nacimiento, created_at')
		.order('created_at', { ascending: false })
	if (error) throw new Error(error.message)
	return data || []
}

export async function createEstudiante(input: EstudianteCreate) {
	let userId: string | null = null
	if (input.create_auth_user) {
		if (!input.password) throw new Error('Se requiere contraseña para crear usuario de Auth')
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email: input.email,
			password: input.password,
			email_confirm: true,
			user_metadata: {
				full_name: `${input.nombres} ${input.apellidos}`.trim(),
				role: 'student',
				epik_id: input.epik_id,
			},
		})
		if (error) throw error
		userId = data.user?.id ?? null
	}
	const { data: est, error: e2 } = await supabaseAdmin
		.from('estudiantes')
		.insert({
			nombres: input.nombres,
			apellidos: input.apellidos,
			email: input.email,
			epik_id: input.epik_id,
			telefono: input.telefono,
			fecha_nacimiento: input.fecha_nacimiento || null,
			user_id: userId,
		})
		.select('*')
		.single()
	if (e2) throw e2
	return est
}

export async function updateEstudiante(input: EstudianteUpdate) {
	const { data, error } = await supabaseAdmin
		.from('estudiantes')
		.update({
			nombres: input.nombres,
			apellidos: input.apellidos,
			email: input.email,
			epik_id: input.epik_id,
			telefono: input.telefono,
			fecha_nacimiento: input.fecha_nacimiento,
		})
		.eq('id', input.id)
		.select('*')
		.single()
	if (error) throw error
	return data
}

export async function deleteEstudiante(id: string) {
	const { error } = await supabaseAdmin.from('estudiantes').delete().eq('id', id)
	if (error) throw error
}
