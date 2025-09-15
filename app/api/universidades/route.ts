import { NextResponse } from 'next/server'
import { supabasePublic } from '@/lib/supabase/public-client'

export async function GET() {
	const { data, error } = await supabasePublic
		.from('universidades')
		.select('id, nombre')
		.order('nombre', { ascending: true })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json((data || []).map((u) => ({ id: u.id, nombre: u.nombre })))
}