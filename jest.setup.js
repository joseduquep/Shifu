import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
	useRouter() {
		return {
			push: jest.fn(),
			replace: jest.fn(),
			prefetch: jest.fn(),
			back: jest.fn(),
			forward: jest.fn(),
			refresh: jest.fn(),
		}
	},
	useSearchParams() {
		return new URLSearchParams()
	},
	usePathname() {
		return '/'
	},
}))

// Mock Supabase client (solo si existe el archivo)
try {
	require('@/lib/supabase/client')
	jest.mock('@/lib/supabase/client', () => ({
		supabase: {
			auth: {
				getUser: jest.fn(),
				signIn: jest.fn(),
				signUp: jest.fn(),
				signOut: jest.fn(),
			},
			from: jest.fn(() => ({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(),
					})),
					single: jest.fn(),
				})),
				insert: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
			})),
		},
	}))
} catch (e) {
	// El archivo no existe, no hacer mock
}

// Mock Supabase public client (solo si existe el archivo)
try {
	require('@/lib/supabase/public-client')
	jest.mock('@/lib/supabase/public-client', () => ({
		supabasePublic: {
			from: jest.fn(() => ({
				select: jest.fn(() => ({
					eq: jest.fn(() => ({
						single: jest.fn(),
					})),
					ilike: jest.fn(),
					range: jest.fn(),
					order: jest.fn(),
				})),
				insert: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
			})),
		},
	}))
} catch (e) {
	// El archivo no existe, no hacer mock
}