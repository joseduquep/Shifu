import { supabaseAdmin } from './base'
import type { ProfesorCreate, ProfesorUpdate } from '@/lib/admin/schemas/profesores'

export async function listProfesores() {
	const { data, error } = await supabaseAdmin
		.from('profesores')
		.select('id, user_id, nombre_completo, email, bio, departamento_id, created_at')
		.order('created_at', { ascending: false })
	if (error) throw new Error(error.message)
	return data || []
}

export async function createProfesor(input: ProfesorCreate) {
	let userId: string | null = null
	if (input.create_auth_user) {
		if (!input.email) throw new Error('Email requerido para crear usuario de Auth')
		if (!input.password) throw new Error('Se requiere contraseña para crear usuario de Auth')
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email: input.email,
			password: input.password,
			email_confirm: true,
			user_metadata: {
				full_name: input.nombre_completo,
				role: 'professor',
			},
		})
		if (error) throw error
		userId = data.user?.id ?? null
	}
	const { data: prof, error: e2 } = await supabaseAdmin
		.from('profesores')
		.insert({
			nombre_completo: input.nombre_completo,
			email: input.email ?? null,
			bio: input.bio ?? null,
			departamento_id: input.departamento_id,
			user_id: userId,
		})
		.select('*')
		.single()
	if (e2) throw e2
	return prof
}

export async function updateProfesor(input: ProfesorUpdate) {
	const { data, error } = await supabaseAdmin
		.from('profesores')
		.update({
			nombre_completo: input.nombre_completo,
			email: input.email,
			bio: input.bio,
			departamento_id: input.departamento_id,
		})
		.eq('id', input.id)
		.select('*')
		.single()
	if (error) throw error
	return data
}

export async function deleteProfesor(id: string) {
	const { error } = await supabaseAdmin.from('profesores').delete().eq('id', id)
	if (error) throw error
}
