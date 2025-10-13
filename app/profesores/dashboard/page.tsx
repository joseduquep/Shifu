'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ProfessorCard } from '@/app/components/ProfessorCard'

interface SemesterRecord {
	semester: string
	summary: string
	rating: number
}

type TabKey = 'explorar' | 'perfil' | 'calificacion' | 'historico'

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
    const [activeTab, setActiveTab] = useState<TabKey>('explorar')
	const [isSaving, setIsSaving] = useState(false)

	// Explorer (datos compartidos con estudiante)
	const [query, setQuery] = useState('')
	const [departamentosFiltro, setDepartamentosFiltro] = useState<{ id: string; nombre: string }[]>([])
	const [materiasFiltro, setMateriasFiltro] = useState<{ id: string; nombre: string }[]>([])
	const [semestresFiltro, setSemestresFiltro] = useState<{ codigo: string }[]>([])
	const [selectedDepartamentoIdFiltro, setSelectedDepartamentoIdFiltro] = useState('')
	const [selectedMateriaIdFiltro, setSelectedMateriaIdFiltro] = useState('')
	const [selectedSemestreCodigoFiltro, setSelectedSemestreCodigoFiltro] = useState('')
	const [profesores, setProfesores] = useState<any[]>([])
	const [loadingProfes, setLoadingProfes] = useState(false)

	// Perfil (cargado desde API)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
	const [department, setDepartment] = useState('')
    const [bio, setBio] = useState('')
	const [departamentos, setDepartamentos] = useState<{ id: string; nombre: string }[]>([])
	const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<string>('')
	const [isNewProfile, setIsNewProfile] = useState<boolean>(false)
	const [saveError, setSaveError] = useState<string>('')

	useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/profesores/me', { cache: 'no-store' })
				if (res.status === 404) {
					setIsNewProfile(true)
					return
				}
				if (!res.ok) return
                const data = await res.json()
                setName(data.nombreCompleto || '')
                setEmail(data.email || '')
				setDepartment(data.departamento || '')
				setSelectedDepartamentoId(data.departamentoId || '')
                setBio(data.bio || '')
				setIsNewProfile(false)
            } catch {}
        }
        load()
    }, [])

	// Catálogo de departamentos
	useEffect(() => {
		const loadDeps = async () => {
			try {
				const res = await fetch('/api/departamentos')
				const data = await res.json()
				setDepartamentos(Array.isArray(data) ? data : [])
				setDepartamentosFiltro(Array.isArray(data) ? data : [])
			} catch {}
		}
		loadDeps()
	}, [])

	// Cargar materias cuando cambia el dep. del filtro
	useEffect(() => {
		const loadMats = async () => {
			try {
				const url = selectedDepartamentoIdFiltro ? `/api/materias?departamentoId=${encodeURIComponent(selectedDepartamentoIdFiltro)}` : '/api/materias'
				const res = await fetch(url)
				const data = await res.json()
				setMateriasFiltro(Array.isArray(data) ? data : [])
			} catch { setMateriasFiltro([]) }
		}
		loadMats()
	}, [selectedDepartamentoIdFiltro])

	// Cargar semestres
	useEffect(() => {
		const loadSems = async () => {
			try {
				const res = await fetch('/api/semestres')
				const data = await res.json()
				setSemestresFiltro(Array.isArray(data) ? data : [])
			} catch {}
		}
		loadSems()
	}, [])

	// Cargar lista inicial sin filtros
	useEffect(() => {
		aplicarFiltros()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const aplicarFiltros = async () => {
		setLoadingProfes(true)
		try {
			const params = new URLSearchParams()
			if (selectedDepartamentoIdFiltro) params.set('departamentoId', selectedDepartamentoIdFiltro)
			if (selectedMateriaIdFiltro) params.set('materiaId', selectedMateriaIdFiltro)
			if (selectedSemestreCodigoFiltro) params.set('semestreCodigo', selectedSemestreCodigoFiltro)
			const res = await fetch(`/api/profesores?${params.toString()}`)
			const json = await res.json()
			setProfesores(Array.isArray(json.items) ? json.items : [])
		} catch { setProfesores([]) }
		finally { setLoadingProfes(false) }
	}

	const limpiarFiltros = async () => {
		setSelectedDepartamentoIdFiltro('')
		setSelectedMateriaIdFiltro('')
		setSelectedSemestreCodigoFiltro('')
		await aplicarFiltros()
	}

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
		setSaveError('')
		try {
			if (isNewProfile && !selectedDepartamentoId) {
				setSaveError('Selecciona un departamento para crear tu perfil')
				return
			}
            const res = await fetch('/api/profesores/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nombreCompleto: name, email, bio, departamentoId: selectedDepartamentoId || undefined }),
            })
			if (!res.ok) {
				let msg = 'No se pudo guardar'
				try {
					const j = await res.json()
					if (j?.error) msg = j.error
				} catch {}
				setSaveError(msg)
				return
			}
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
                                aria-pressed={activeTab === 'explorar'}
                                onClick={() => setActiveTab('explorar')}
                                className={
                                    'px-3 py-2 text-sm rounded-md transition ' +
                                    (activeTab === 'explorar'
                                        ? 'bg-primary text-[#0b0d12]'
                                        : 'text-white/80 hover:text-white')
                                }
                            >
                                Explorar
                            </button>
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
                        {activeTab === 'explorar' && (
                            <section className="rounded-2xl border border-white/15 p-6 bg-white/5">
                                <div className="flex items-center justify-between gap-4">
                                    <h2 className="text-xl font-medium">Buscar profesores</h2>
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                                    >
                                        Ver como estudiante
                                    </Link>
                                </div>

                                <div className="mt-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Buscar por nombre, departamento o materia…"
                                            className="w-full h-12 rounded-full bg-[#0b0d12] text-white/90 placeholder:text-white/40 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                                    <div className="md:col-span-2">
                                        <select
                                            value={selectedDepartamentoIdFiltro}
                                            onChange={(e) => { setSelectedDepartamentoIdFiltro(e.target.value); setSelectedMateriaIdFiltro('') }}
                                            className="w-full h-11 rounded-xl bg-[#0b0d12] text-white/90 border border-white/15 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="">Programa/Departamento</option>
                                            {departamentosFiltro.map((d) => (
                                                <option key={d.id} value={d.id}>{d.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <select
                                            value={selectedMateriaIdFiltro}
                                            onChange={(e) => setSelectedMateriaIdFiltro(e.target.value)}
                                            className="w-full h-11 rounded-xl bg-[#0b0d12] text-white/90 border border-white/15 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="">Materia</option>
                                            {materiasFiltro.map((m) => (
                                                <option key={m.id} value={m.id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            value={selectedSemestreCodigoFiltro}
                                            onChange={(e) => setSelectedSemestreCodigoFiltro(e.target.value)}
                                            className="w-full h-11 rounded-xl bg-[#0b0d12] text-white/90 border border-white/15 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="">Semestre</option>
                                            {semestresFiltro.map((s) => (
                                                <option key={s.codigo} value={s.codigo}>{s.codigo}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-5 flex items-center gap-3">
                                        <button onClick={aplicarFiltros} className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-4 py-2 text-sm font-medium hover:opacity-90 transition">Aplicar filtros</button>
                                        <button onClick={limpiarFiltros} className="inline-flex items-center rounded-full border border-white/15 text-white px-4 py-2 text-sm font-medium hover:bg-white/5 transition">Quitar filtros</button>
                                        {loadingProfes && <span className="text-white/60 text-sm">Cargando…</span>}
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {profesores
                                        .filter((p) => {
                                            const q = query.trim().toLowerCase()
                                            if (!q) return true
                                            const arr = [p.nombreCompleto, p.departamento, p.universidad, ...(p.materias || [])]
                                            return arr.filter(Boolean).some((f: any) => String(f).toLowerCase().includes(q))
                                        })
                                        .map((p) => (
                                            <ProfessorCard
                                                key={p.id}
                                                id={p.id}
                                                name={p.nombreCompleto}
                                                department={p.departamento}
                                                university={p.universidad}
                                                rating={p.calificacionPromedio ?? undefined}
                                                reviewsCount={p.cantidadResenas}
                                                materias={p.materias}
                                            />
                                        ))}
                                </div>
                                {!loadingProfes && profesores.length === 0 && (
                                    <div className="mt-6 text-sm text-white/60">Sin resultados.</div>
                                )}
                            </section>
                        )}
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
								<label htmlFor="department" className="block text-sm text-white/80">
									Departamento {isNewProfile ? '(requerido)' : ''}
								</label>
								<select
									id="department"
									value={selectedDepartamentoId}
									onChange={(e) => {
										setSelectedDepartamentoId(e.target.value)
										const sel = departamentos.find((d) => d.id === e.target.value)
										setDepartment(sel?.nombre || '')
									}}
									className="mt-1 w-full h-11 rounded-xl bg-[#0b0d12] text-white/90 border border-white/15 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
								>
									<option value="">Selecciona un departamento</option>
									{departamentos.map((d) => (
										<option key={d.id} value={d.id}>{d.nombre}</option>
									))}
								</select>
								{saveError && isNewProfile && !selectedDepartamentoId && (
									<div className="mt-1 text-xs text-red-300">{saveError}</div>
								)}
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

							{saveError && !(!selectedDepartamentoId && isNewProfile) && (
								<div className="text-sm text-red-300">{saveError}</div>
							)}
							<div className="pt-2">
										<button
											type="submit"
									disabled={isSaving || (isNewProfile && !selectedDepartamentoId)}
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
