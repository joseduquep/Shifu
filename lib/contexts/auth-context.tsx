'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'student' | 'professor'

export interface Profile {
	id: string
	email: string
	role: UserRole
	epik_id: string | null
	full_name: string
	avatar_url: string | null
	created_at: string
	updated_at: string
}

interface AuthContextType {
	user: User | null
	profile: Profile | null
	loading: boolean
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const supabase = useMemo(() => createClient(), [])
	const [user, setUser] = useState<User | null>(null)
	const [profile, setProfile] = useState<Profile | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let mounted = true
		const init = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession()
			if (!mounted) return
			setUser(session?.user ?? null)
			if (session?.user) {
				const { data } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', session.user.id)
					.single()
				setProfile((data as any) ?? null)
			}
			setLoading(false)
		}
		init()

		const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
			setUser(session?.user ?? null)
			if (session?.user) {
				const { data } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', session.user.id)
					.single()
				setProfile((data as any) ?? null)
			} else {
				setProfile(null)
			}
		})

		return () => {
			mounted = false
			sub.subscription.unsubscribe()
		}
	}, [supabase])

	const signOut = async () => {
		await supabase.auth.signOut()
		window.location.href = '/'
	}

	return (
		<AuthContext.Provider value={{ user, profile, loading, signOut }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
	return ctx
}