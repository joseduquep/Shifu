'use client'

import { useEffect, useState } from 'react'

export default function ProfesoresLoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [mounted, setMounted] = useState(false)
	const [showPassword, setShowPassword] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsLoading(true)
		try {
			// TODO: integrar API de auth (profesores)
			await new Promise((r) => setTimeout(r, 600))
			console.log({ email, password })
		} finally {
			setIsLoading(false)
		}
	}

	if (!mounted) return null

	return (
		<main className="bg-[#0b0d12] text-primary font-sans">
			<section className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-6">
				<div className="w-full max-w-md text-center">
					<h1 className="text-3xl md:text-4xl font-medium">
						Acceso para Profesores
					</h1>

					<form className="mt-8 space-y-4" onSubmit={handleSubmit}>
						<input
							id="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="correo@eafit.edu.co"
							className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
						/>

						<div className="relative">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								className="w-full h-12 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50"
							/>
							<button
								type="button"
								onClick={() => setShowPassword((v) => !v)}
								aria-label={
									showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
								}
								className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30"
							>
								{showPassword ? (
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a21.77 21.77 0 015.06-6.94" />
										<path d="M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.77 21.77 0 01-3.16 4.19" />
										<line x1="1" y1="1" x2="23" y2="23" />
									</svg>
								) : (
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
										<circle cx="12" cy="12" r="3" />
									</svg>
								)}
							</button>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full h-12 inline-flex items-center justify-center rounded-xl bg-primary text-[#0b0d12] text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
						>
							{isLoading ? 'Accediendo…' : 'Acceder'}
						</button>
					</form>
				</div>
			</section>
		</main>
	)
}
