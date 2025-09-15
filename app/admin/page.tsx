export default function AdminHome() {
	return (
		<div className="grid gap-6">
			<div className="rounded-2xl border border-white/10 bg-[#121621] p-6">
				<h2 className="text-lg font-medium">Panel de administración</h2>
				<p className="text-white/70 text-sm mt-1">
					Acceso rápido a CRUDs y sincronización con Auth.
				</p>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{[
					{ href: '/admin/universidades', label: 'Universidades' },
					{ href: '/admin/departamentos', label: 'Departamentos' },
					{ href: '/admin/materias', label: 'Materias' },
					{ href: '/admin/profesores', label: 'Profesores' },
					{ href: '/admin/estudiantes', label: 'Estudiantes' },
					{ href: '/admin/resenas', label: 'Reseñas' },
					{ href: '/admin/semestres', label: 'Semestres' },
					{ href: '/admin/users', label: 'Usuarios (Auth)' },
				].map((l) => (
					<a key={l.href} href={l.href} className="rounded-xl border border-white/10 bg-[#0b0d12] p-4 text-white/80 hover:bg-white/5 transition">
						{l.label}
					</a>
				))}
			</div>
		</div>
	)
}
