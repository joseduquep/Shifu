import Image from "next/image"

export default function Home() {
    return (
        <main className="min-h-dvh bg-[#0b0d12] text-primary font-sans">
            <section className="mx-auto max-w-7xl px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
          <span className="inline-block text-xs tracking-widest uppercase text-white/70">
            Explora profesores
          </span>
                    <h1 className="mt-4 text-5xl md:text-7xl leading-tight font-medium">
                        Explora, compara
                        <br />y sigue a tus profesores
                    </h1>
                    <p className="mt-6 text-white/80 max-w-prose">
                        Shifu reúne en un solo lugar la información de los docentes: perfiles completos,
                        materias y trayectoria. Guarda tus favoritos, recibe resúmenes automáticos (IA)
                        y mantente al día con nuevas materias y logros.
                    </p>
                    <div className="mt-8 flex items-center gap-4">
                        <a
                            href="/dashboard"
                            className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-6 py-3 text-sm font-medium shadow-[0_0_0_2px_#0b0d12_inset] hover:opacity-90 transition"
                        >
                            Ver profesores
                        </a>
                        <a
                            href="/ranking"
                            className="inline-flex items-center rounded-full border border-white/20 text-white px-6 py-3 text-sm font-medium hover:bg-white/5 transition"
                        >
                            Ver ranking
                        </a>
                    </div>
                </div>

                <div className="relative aspect-[4/3] md:aspect-[5/4] rounded-3xl overflow-hidden border border-white/10 bg-[#121621]">
                    <Image
                        src="/profes.jpeg"
                        alt="Shifu hero visual"
                        fill
                        className="absolute inset-0 opacity-90 object-contain"
                    />
                    <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10 rounded-3xl" />
                </div>
            </section>

            {/* Feature cards */}
            <section className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-white/10 bg-[#121621] p-6 hover:border-white/20 transition">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-[#0b0d12] grid place-items-center border border-white/10">
                            <Image src="/globe.svg" alt="Explorar" width={20} height={20} />
                        </div>
                        <h3 className="text-lg font-medium">Perfiles completos</h3>
                    </div>
                    <p className="mt-3 text-white/70">
                        Descubre perfiles con biografía, materias, trayectoria y estadísticas de desempeño
                        para tomar decisiones informadas.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#121621] p-6 hover:border-white/20 transition">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-[#0b0d12] grid place-items-center border border-white/10">
                            <Image src="/window.svg" alt="Favoritos y comparación" width={20} height={20} />
                        </div>
                        <h3 className="text-lg font-medium">Favoritos y comparación</h3>
                    </div>
                    <p className="mt-3 text-white/70">
                        Guarda profesores como favoritos, compáralos por materias y valoración,
                        y arma tu lista personal para cursos futuros.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#121621] p-6 hover:border-white/20 transition">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-[#0b0d12] grid place-items-center border border-white/10">
                            <Image src="/file.svg" alt="Novedades y logros" width={20} height={20} />
                        </div>
                        <h3 className="text-lg font-medium">Novedades y logros</h3>
                    </div>
                    <p className="mt-3 text-white/70">
                        Mantente al día con resúmenes automáticos (IA) y alertas sobre nuevas materias,
                        reconocimientos y actualizaciones relevantes en cada perfil.
                    </p>
                </div>
            </section>

            {/* How it works */}
            <section className="mx-auto max-w-7xl px-6 py-16">
                <h2 className="text-2xl md:text-3xl font-medium">Cómo funciona</h2>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {["Explora y descubre", "Guarda y compara", "Mantente al día"].map(
                        (title, idx) => (
                            <div
                                key={title}
                                className="rounded-2xl border border-white/10 bg-[#121621] p-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-8 rounded-full bg-primary/20 text-primary grid place-items-center text-sm border border-white/10">
                                        {idx + 1}
                                    </div>
                                    <div className="font-medium">{title}</div>
                                </div>
                                <p className="mt-3 text-white/70">
                                    {idx === 0 &&
                                        "Busca por universidad, departamento o nombre. Abre perfiles con biografía, materias, trayectoria y estadísticas de desempeño."}
                                    {idx === 1 &&
                                        "Marca profesores como favoritos para tenerlos a mano, compáralos por materias y valoración, y construye tu lista personal."}
                                    {idx === 2 &&
                                        "Obtén resúmenes automáticos con IA y notificaciones de novedades: nuevas materias, logros recientes y cambios relevantes en su perfil."}
                                </p>
                            </div>
                        )
                    )}
                </div>
            </section>

            {/* Final CTA */}
            <section className="mx-auto max-w-7xl px-6 py-16">
                <div className="rounded-3xl border border-white/10 bg-[#121621] p-8 md:p-12 text-center">
                    <h3 className="text-2xl md:text-3xl font-medium">
                        ¿Listo para explorar?
                    </h3>
                    <p className="mt-3 text-white/70 max-w-2xl mx-auto">
                        Descubre profesores y tendencias.
                    </p>
                    <div className="mt-6">
                        <a
                            href="/dashboard"
                            className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-6 py-3 text-sm font-medium shadow-[0_0_0_2px_#0b0d12_inset] hover:opacity-90 transition"
                        >
                            Ver profesores
                        </a>
                    </div>
                </div>
            </section>

            <div className="py-10 text-center text-xs text-white/50">
                curated by Shifu
            </div>
        </main>
    )
}
