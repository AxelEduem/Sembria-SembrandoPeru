import { useAuth } from "@/contexts/AuthContext";

function InicioResumen() {
  const { profile } = useAuth();

  return (
    <section className="module-section-enter module-enter-delay-2 mb-6 w-full min-w-0 sm:mb-8">
      <p className="mb-3 text-sm font-semibold text-emerald-700 sm:mb-2">
        Bienvenido
        {profile?.nombres ? `, ${profile.nombres}` : ""}
      </p>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Resumen de la organización
      </h1>

      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500 sm:mt-3">
        Consulta rápidamente el estado general de Sembrando Perú y la actividad actual de la
        plataforma.
      </p>
    </section>
  );
}

export default InicioResumen;
