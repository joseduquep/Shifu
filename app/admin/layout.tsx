import { notFound } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const enabled = process.env.ADMIN_DEMO_ENABLED === 'true'
	if (!enabled) return notFound()
	return (
		<section className="bg-[#0b0d12] text-primary font-sans">
			<div className="mx-auto max-w-7xl px-6 py-8">
				<header className="mb-6">
					<h1 className="text-2xl md:text-3xl font-medium">Admin</h1>
					<p className="text-white/60 text-sm mt-1">Demo en desarrollo (service_role en servidor)</p>
				</header>
				{children}
			</div>
		</section>
	)
}
