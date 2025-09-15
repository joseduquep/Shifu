import { supabaseAdmin } from './base'
import type { UserCreate, UserUpdate } from '@/lib/admin/schemas/users'

export type AdminUser = {
	id: string
	email: string
	full_name: string | null
	role: 'student' | 'professor' | null
	epik_id: string | null
	avatar_url: string | null
	created_at: string
}

export async function listUsers(): Promise<AdminUser[]> {
	// No hay list API directo por PostgREST para auth.users; usamos profiles como base
	const { data, error } = await supabaseAdmin.from('profiles').select('id, email, full_name, role, epik_id, avatar_url, created_at').order('created_at', { ascending: false })
	if (error) throw new Error(error.message)
	return (data || []) as AdminUser[]
}

export async function createUser(input: UserCreate) {
	// Crear usuario en Auth con metadata
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: input.email,
		password: input.password,
		email_confirm: true,
		user_metadata: {
			full_name: input.full_name,
			role: input.role,
			epik_id: input.epik_id,
			avatar_url: input.avatar_url,
		},
	})
	if (error) throw error
	return data.user
}

export async function updateUser(input: UserUpdate) {
	const updates: any = {}
	if (input.email) updates.email = input.email
	if (input.password) updates.password = input.password
	if (input.full_name || input.role || input.epik_id || input.avatar_url) {
		updates.user_metadata = {}
		if (input.full_name) updates.user_metadata.full_name = input.full_name
		if (input.role) updates.user_metadata.role = input.role
		if (input.epik_id !== undefined) updates.user_metadata.epik_id = input.epik_id
		if (input.avatar_url) updates.user_metadata.avatar_url = input.avatar_url
	}
	const { data, error } = await supabaseAdmin.auth.admin.updateUserById(input.id, updates)
	if (error) throw error
	return data.user
}

export async function deleteUserById(id: string) {
	const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
	if (error) throw error
}
