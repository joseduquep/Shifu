'use client'

import { useMemo, useState } from 'react'

interface SemesterRecord {
	semester: string
	summary: string
	rating: number
}

type TabKey = 'perfil' | 'calificacion' | 'historico'

const SEMESTERS: SemesterRecord[] = [
	{
		semester: '2025-1',
		rating: 4.4,
		summary:
			'Los estudiantes destacan la claridad en las explicaciones y la '
			+ 'disposición para resolver dudas. Se sugiere diversificar los '
			+ 'recursos de apoyo y profundizar en ejemplos prácticos.',
	},
	{
		semester: '2024-2',
		rating: 4.2,
		summary:
			'Se valora la retroalimentación oportuna y el dominio del tema. '
			+ 'Algunos grupos reportan carga de trabajo irregular cerca de '
			+ 'parciales.',
	},
	{
		semester: '2024-1',
		rating: 4.0,
		summary:
			'Buen acompañamiento durante el curso. Oportunidad de mejora en '
			+ 'la puntualidad de publicación de notas intermedias.',
	},
]

export default function ProfesoresDashboardPage() {
	const [activeTab, setActiveTab] = useState<TabKey>('perfil')
	const [isSaving, setIsSaving] = useState(false)

	// Perfil (estado local simulado)
	const [name, setName] = useState('Nombre del Profesor')
	const [email, setEmail] = useState('profesor@eafit.edu.co')
	const [department, setDepartment] = useState('Departamento Académico')
	const [bio, setBio] = useState(
		'Breve descripción profesional, líneas de trabajo e intereses '
		+ 'académicos.',
	)

	// Calificación general (simulada a partir del histórico)
	const overallRating = useMemo(() => {
		if (!SEMESTERS.length) return 0
		const sum = SEMESTERS.reduce((acc, s) => acc + s.rating, 0)
		return Math.round((sum / SEMESTERS.length) * 10) / 10
	}, [])

	const [selectedSemester, setSelectedSemester] = useState(SEMESTERS[0].semester)
	const selectedRecord = useMemo(() => {
		return SEMESTERS.find((s) => s.semester === selectedSemester) ?? SEMESTERS[0]
	}, [selectedSemester])

	async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsSaving(true)
		try {
			// TODO: integrar API para actualizar perfil del profesor
			await new Promise((r) => setTimeout(r, 700))
			console.log({ name, email, department, bio })
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<main className="bg-[#0b0d12] text-primary font-sans">
			<section className="min-h-[calc(100dvh-4rem)] px-6 py-10">
				<div className="mx-auto max-w-6xl">
					<header className="flex items-center justify-between">
						<h1 className="text-3xl md:text-4xl font-medium">
							Panel Docente
						</h1>
					</header>

					<nav className="mt-8">
						<div
							className="inline-flex rounded-lg border border-white/15 p-1 bg-white/5"
						>
							<button
								type="button"
								aria-pressed={activeTab === 'perfil'}
								onClick={() => setActiveTab('perfil')}
								className={
									'px-3 py-2 text-sm rounded-md transition ' +
									(activeTab === 'perfil'
										? 'bg-primary text-[#0b0d12]'
										: 'text-white/80 hover:text-white')
								}
							>
								Perfil
							</button>
							<button
								type="button"
								aria-pressed={activeTab === 'calificacion'}
								onClick={() => setActiveTab('calificacion')}
								className={
									'px-3 py-2 text-sm rounded-md transition ' +
									(activeTab === 'calificacion'
										? 'bg-primary text-[#0b0d12]'
										: 'text-white/80 hover:text-white')
								}
							>
								Calificación
							</button>
							<button
								type="button"
								aria-pressed={activeTab === 'historico'}
								onClick={() => setActiveTab('historico')}
								className={
									'px-3 py-2 text-sm rounded-md transition ' +
									(activeTab === 'historico'
										? 'bg-primary text-[#0b0d12]'
										: 'text-white/80 hover:text-white')
								}
							>
								Histórico
							</button>
						</div>
					</nav>

					<div className="mt-8 space-y-8">
						{activeTab === 'perfil' && (
							<section
								aria-label="Perfil del profesor"
								className="rounded-2xl border border-white/15 p-6 bg-white/5"
							>
								<h2 className="text-xl font-medium">Perfil del profesor</h2>
								<form className="mt-6 space-y-4" onSubmit={handleSaveProfile}>
									<div>
										<label
											htmlFor="name"
											className="block text-sm text-white/80"
										>
											Nombre completo
										</label>
										<input
											id="name"
											type="text"
											required
											value={name}
											onChange={(e) => setName(e.target.value)}
											className="mt-1 w-full h-11 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
										/>
									</div>

									<div>
										<label
											htmlFor="email"
											className="block text-sm text-white/80"
										>
											Correo institucional
										</label>
										<input
											id="email"
											type="email"
											required
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="mt-1 w-full h-11 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
										/>
									</div>

									<div>
										<label
											htmlFor="department"
											className="block text-sm text-white/80"
										>
											Departamento
										</label>
										<input
											id="department"
											type="text"
											required
											value={department}
											onChange={(e) => setDepartment(e.target.value)}
											className="mt-1 w-full h-11 rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
										/>
									</div>

									<div>
										<label
											htmlFor="bio"
											className="block text-sm text-white/80"
										>
											Biografía / presentación
										</label>
										<textarea
											id="bio"
											rows={4}
											value={bio}
											onChange={(e) => setBio(e.target.value)}
											className="mt-1 w-full rounded-xl bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
										/>
									</div>

									<div className="pt-2">
										<button
											type="submit"
											disabled={isSaving}
											className="h-11 px-4 inline-flex items-center justify-center rounded-xl bg-primary text-[#0b0d12] text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
										>
											{isSaving ? 'Guardando…' : 'Guardar cambios'}
										</button>
									</div>
								</form>
							</section>
						)}

						{activeTab === 'calificacion' && (
							<section
								aria-label="Calificación general"
								className="rounded-2xl border border-white/15 p-6 bg-white/5"
							>
								<div className="flex flex-col md:flex-row md:items-start gap-6">
									<div className="md:w-1/3 w-full">
										<h2 className="text-xl font-medium">Calificación general</h2>
										<div className="mt-4 flex items-center gap-3">
											<span className="text-4xl font-medium">
												{overallRating}
											</span>
											<Stars value={overallRating} />
										</div>
										<p className="mt-2 text-sm text-white/70">
											Escala de 0 a 5 basada en evaluaciones estudiantiles.
										</p>
									</div>
									<div className="md:flex-1 w-full">
										<h3 className="text-sm text-white/80">
											Resumen de comentarios (IA)
										</h3>
										<div
											className="mt-2 min-h-[140px] rounded-xl border border-white/15 bg-[#0b0d12] p-4 text-white/85"
										>
											<p className="text-sm leading-6">
												Este espacio mostrará un resumen generado de forma
												automática a partir de los comentarios de los
												estudiantes. (Placeholder de IA generativa)
											</p>
										</div>
									</div>
								</div>
							</section>
						)}

						{activeTab === 'historico' && (
							<section
								aria-label="Histórico por semestre"
								className="rounded-2xl border border-white/15 p-6 bg-white/5"
							>
								<div className="flex flex-col md:flex-row md:items-center gap-4">
									<div className="md:w-1/3">
										<h2 className="text-xl font-medium">Histórico</h2>
										<p className="mt-1 text-sm text-white/70">
											Filtra por semestre para ver el resumen asociado.
										</p>
									</div>
									<div className="md:flex-1">
										<label
											htmlFor="semester"
											className="block text-sm text-white/80"
										>
											Semestre
										</label>
										<select
											id="semester"
											value={selectedSemester}
											onChange={(e) => setSelectedSemester(e.target.value)}
											className="mt-1 w-full h-11 rounded-xl bg-[#0b0d12] text-white/90 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
										>
											{SEMESTERS.map((s) => (
												<option key={s.semester} value={s.semester}>
													{s.semester}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className="mt-6 grid grid-cols-1 gap-4">
									<article className="rounded-xl border border-white/15 p-5 bg-[#0b0d12]">
										<header className="flex items-center justify-between">
											<h3 className="text-lg font-medium">
												Semestre {selectedRecord.semester}
											</h3>
											<div className="flex items-center gap-2">
												<span className="text-sm text-white/70">Rating</span>
												<span className="text-base font-medium">
													{selectedRecord.rating}
												</span>
												<Stars value={selectedRecord.rating} />
											</div>
										</header>
										<p className="mt-3 text-white/85 text-sm leading-6">
											{selectedRecord.summary}
										</p>
									</article>
								</div>
							</section>
						)}
					</div>
				</div>
			</section>
		</main>
	)
}

function Stars({ value }: { value: number }) {
	const full = Math.floor(value)
	const hasHalf = value - full >= 0.5
	const empty = 5 - full - (hasHalf ? 1 : 0)
	const items = [
		...Array(full).fill('full'),
		...(hasHalf ? (['half'] as const) : []),
		...Array(empty).fill('empty'),
	]
	return (
		<div className="flex items-center gap-1 text-primary">
			{items.map((t, i) => (
				<span key={i} aria-hidden>
					{t === 'full' && <StarFull />}
					{t === 'half' && <StarHalf />}
					{t === 'empty' && <StarEmpty />}
				</span>
			))}
			<span className="sr-only">{value} de 5</span>
		</div>
	)
}

function StarFull() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden
		>
			<path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.402 8.167L12 18.896l-7.336 3.867 1.402-8.167L.132 9.21l8.2-1.192L12 .587z" />
		</svg>
	)
}

function StarHalf() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			aria-hidden
		>
			<defs>
				<linearGradient id="half">
					<stop offset="50%" stopColor="currentColor" />
					<stop offset="50%" stopColor="transparent" />
				</linearGradient>
			</defs>
			<path
				d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.402 8.167L12 18.896l-7.336 3.867 1.402-8.167L.132 9.21l8.2-1.192L12 .587z"
				fill="url(#half)"
				stroke="currentColor"
				strokeWidth="1"
			/>
		</svg>
	)
}

function StarEmpty() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			aria-hidden
		>
			<path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.402 8.167L12 18.896l-7.336 3.867 1.402-8.167L.132 9.21l8.2-1.192L12 .587z" />
		</svg>
	)
}
