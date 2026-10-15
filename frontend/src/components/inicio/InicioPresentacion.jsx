import logoSembria from "@/assets/logo_sembria.webp";
import fondoInicio from "@/assets/fondo_inicio.webp";

function InicioPresentacion() {
  return (
    <section
      className="module-section-enter module-enter-delay-1 relative mb-6 min-h-[220px] w-full max-w-full overflow-hidden rounded-[24px] border border-emerald-100/80 bg-white/50 bg-cover bg-[position:74%_center] bg-no-repeat px-4 py-5 shadow-[0_8px_35px_rgba(45,90,61,0.06)] sm:mb-7 sm:min-h-[250px] sm:rounded-[28px] sm:px-8 sm:py-7 lg:min-h-[260px] lg:bg-[position:78%_center] lg:px-10"
      style={{ backgroundImage: `url(${fondoInicio})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/35 sm:via-white/65 sm:to-white/10" />

      <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-emerald-100/30 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-green-100/20 blur-3xl" />

      <div className="relative z-10 flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex shrink-0 items-center justify-center rounded-2xl bg-white px-4 py-2 sm:px-5 sm:py-3">
          <img
            src={logoSembria}
            alt="Sembria"
            className="h-[4.5rem] w-auto max-w-[180px] object-contain sm:h-28 sm:max-w-[260px]"
          />
        </div>

        <div className="hidden h-20 w-px shrink-0 bg-emerald-100 sm:block" />

        <div className="min-w-0 text-center sm:text-left">
          <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-emerald-700 uppercase sm:mb-2 sm:text-[11px] sm:tracking-[0.2em]">
            Plataforma integral de gestión institucional
          </p>

          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            El centro digital de Sembrando Perú
          </h2>

          <p className="mt-2 line-clamp-3 max-w-2xl text-sm leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
            Sembria centraliza la información, los accesos y los principales procesos de la
            organización en un solo espacio.
          </p>
        </div>
      </div>
    </section>
  );
}

export default InicioPresentacion;
