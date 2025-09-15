'use server'

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE

if (!url || !serviceRole) {
	throw new Error('Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE')
}

// ¡Nunca expongas este cliente al cliente! Solo uso en handlers server-side.
export const supabaseAdmin = createClient(url, serviceRole, {
	persistSession: false,
	autoRefreshToken: false,
	auth: { persistSession: false },
	fetch: (...args) => fetch(...args),
})