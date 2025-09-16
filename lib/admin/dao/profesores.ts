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
	// Siempre crear usuario de Auth y vincularlo
	const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
		email: input.email,
		password: input.password,
		email_confirm: true,
		user_metadata: {
			full_name: input.nombre_completo,
			role: 'professor',
		},
	})
	if (authErr) throw authErr
	const userId = created.user?.id ?? null

	const { data: prof, error: e2 } = await supabaseAdmin
		.from('profesores')
		.insert({
			nombre_completo: input.nombre_completo,
			email: input.email,
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
		.select('id, user_id, nombre_completo, email')
		.single()
	if (error) throw error

	if (data.user_id) {
		const attrs: any = {}
		if (input.email) attrs.email = input.email
		if (input.password) attrs.password = input.password
		const meta: any = {}
		if (input.nombre_completo !== undefined) meta.full_name = input.nombre_completo
		if (Object.keys(meta).length) attrs.user_metadata = meta
		if (Object.keys(attrs).length) {
			const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, attrs)
			if (upErr) throw upErr
		}
	} else {
		if (input.password && (input.email || data.email)) {
			const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
				email: input.email ?? data.email!,
				password: input.password,
				email_confirm: true,
				user_metadata: { full_name: input.nombre_completo ?? data.nombre_completo, role: 'professor' },
			})
			if (cErr) throw cErr
			const uid = created.user?.id
			if (uid) {
				const { error: linkErr } = await supabaseAdmin
					.from('profesores')
					.update({ user_id: uid })
					.eq('id', data.id)
				if (linkErr) throw linkErr
			}
		} else {
			throw new Error('Este profesor no tiene usuario de Auth vinculado. Proporciona una contraseña para crearlo y sincronizar.')
		}
	}

	return data
}

export async function deleteProfesor(id: string) {
	// Obtener user_id antes de eliminar
	const { data: row, error: selErr } = await supabaseAdmin
		.from('profesores')
		.select('user_id')
		.eq('id', id)
		.single()
	if (selErr) throw selErr

	const { error } = await supabaseAdmin.from('profesores').delete().eq('id', id)
	if (error) throw error

	if (row?.user_id) {
		const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(row.user_id)
		if (delErr) throw delErr
	}
}
