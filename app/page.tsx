import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#0b0d12] text-primary font-sans">
      <section className="mx-auto max-w-7xl px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs tracking-widest uppercase text-white/70">
            Califica a tus profesores
          </span>
          <h1 className="mt-4 text-5xl md:text-7xl leading-tight font-medium">
            Encuentra, califica
            <br />y comparte tu experiencia
          </h1>
          <p className="mt-6 text-white/80 max-w-prose">
            Shifu es la forma más rápida de conocer la reputación académica:
            busca profesores, revisa opiniones reales y contribuye con tus
            calificaciones para ayudar a otros estudiantes.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <a
              href="/calificar"
              className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-6 py-3 text-sm font-medium shadow-[0_0_0_2px_#0b0d12_inset] hover:opacity-90 transition"
            >
              Calificar ahora
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
          <img
            src="/globe.svg"
            alt="Shifu hero visual"
            className="absolute inset-0 m-auto w-3/4 opacity-90"
          />
          <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10 rounded-3xl" />
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-[#121621] p-6 hover:border-white/20 transition">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#0b0d12] grid place-items-center border border-white/10">
              <Image src="/globe.svg" alt="Buscar" width={20} height={20} />
            </div>
            <h3 className="text-lg font-medium">Busca profesores</h3>
          </div>
          <p className="mt-3 text-white/70">
            Encuentra docentes por nombre, universidad o departamento con
            filtros precisos.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121621] p-6 hover:border-white/20 transition">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#0b0d12] grid place-items-center border border-white/10">
              <Image src="/window.svg" alt="Comparar" width={20} height={20} />
            </div>
            <h3 className="text-lg font-medium">Compara y decide</h3>
          </div>
          <p className="mt-3 text-white/70">
            Revisa opiniones reales y compara métricas clave antes de
            inscribirte.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#121621] p-6 hover:border-white/20 transition">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#0b0d12] grid place-items-center border border-white/10">
              <Image src="/file.svg" alt="Calificar" width={20} height={20} />
            </div>
            <h3 className="text-lg font-medium">Califica con impacto</h3>
          </div>
          <p className="mt-3 text-white/70">
            Comparte tu experiencia y mejora la calidad docente de tu comunidad.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-medium">Cómo funciona</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {["Busca y descubre", "Compara y elige", "Califica y comparte"].map(
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
                    "Filtra por universidad, departamento o nombre y accede a perfiles completos."}
                  {idx === 1 &&
                    "Revisa calificaciones, comentarios y tendencias para tomar la mejor decisión."}
                  {idx === 2 &&
                    "Deja tu reseña con criterios claros y ayuda a futuros estudiantes."}
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
            ¿Listo para ayudar a tu comunidad?
          </h3>
          <p className="mt-3 text-white/70 max-w-2xl mx-auto">
            Califica a tus profesores y mejora la transparencia académica. Tu
            opinión cuenta.
          </p>
          <div className="mt-6">
            <a
              href="/calificar"
              className="inline-flex items-center rounded-full bg-primary text-[#0b0d12] px-6 py-3 text-sm font-medium shadow-[0_0_0_2px_#0b0d12_inset] hover:opacity-90 transition"
            >
              Comenzar a calificar
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
