import { NextResponse } from 'next/server'
import { supabasePublic } from '@/lib/supabase/public-client'

export async function GET() {
	const { data, error } = await supabasePublic
		.from('semestres')
		.select('codigo, anio, termino')
		.order('codigo', { ascending: true })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json((data || []).map((s) => ({ codigo: s.codigo, anio: s.anio, termino: s.termino })))
}


