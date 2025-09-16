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
	// Siempre crear usuario de Auth y vincularlo
	const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
		email: input.email,
		password: input.password,
		email_confirm: true,
		user_metadata: {
			full_name: `${input.nombres} ${input.apellidos}`.trim(),
			role: 'student',
			epik_id: input.epik_id,
		},
	})
	if (authErr) throw authErr
	const userId = created.user?.id ?? null

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
	// Actualizamos fila y recuperamos user_id y valores actuales para construir metadata
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
		.select('id, user_id, nombres, apellidos, email, epik_id')
		.single()
	if (error) throw error

	// Sincronizar con Auth
	if (data.user_id) {
		const attrs: Record<string, unknown> = {}
		if (input.email) attrs.email = input.email
		if (input.password) attrs.password = input.password
		const meta: Record<string, unknown> = {}
		if (input.nombres !== undefined || input.apellidos !== undefined) {
			meta.full_name = `${input.nombres ?? data.nombres} ${input.apellidos ?? data.apellidos}`.trim()
		}
		if (input.epik_id !== undefined) meta.epik_id = input.epik_id
		if (Object.keys(meta).length) attrs.user_metadata = meta
		if (Object.keys(attrs).length) {
			const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, attrs)
			if (upErr) throw upErr
		}
	} else {
		// No tiene usuario aún: obligar a crearlo si hay cambio o si así se solicita
		if (input.password) {
			const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
				email: input.email ?? data.email,
				password: input.password,
				email_confirm: true,
				user_metadata: {
					full_name: `${input.nombres ?? data.nombres} ${input.apellidos ?? data.apellidos}`.trim(),
					role: 'student',
					epik_id: input.epik_id ?? data.epik_id,
				},
			})
			if (cErr) throw cErr
			const uid = created.user?.id
			if (uid) {
				const { error: linkErr } = await supabaseAdmin
					.from('estudiantes')
					.update({ user_id: uid })
					.eq('id', data.id)
				if (linkErr) throw linkErr
			}
		} else {
			throw new Error('Este estudiante no tiene usuario de Auth vinculado. Proporciona una contraseña para crearlo y sincronizar.')
		}
	}

	return data
}

export async function deleteEstudiante(id: string) {
	// Obtener user_id antes de eliminar
	const { data: row, error: selErr } = await supabaseAdmin
		.from('estudiantes')
		.select('user_id')
		.eq('id', id)
		.single()
	if (selErr) throw selErr

	const { error } = await supabaseAdmin.from('estudiantes').delete().eq('id', id)
	if (error) throw error

	if (row?.user_id) {
		const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(row.user_id)
		if (delErr) throw delErr
	}
}
