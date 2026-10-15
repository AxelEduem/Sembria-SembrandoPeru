import { Building2, Shield, Users } from "lucide-react";

import IndicadorCard from "./IndicadorCard";
import useInicioData from "@/hooks/useInicioData";

function InicioIndicadores() {
  const { summary, areasActivas, usuariosConectados, error, summaryLoading, areasLoading } =
    useInicioData();

  const cards = [
    {
      label: "Integrantes activos",
      value: summary.integrantes_activos,
      icon: Users,
      detail: "Personas activas registradas en Sembrando Perú.",
      loading: summaryLoading,
    },
    {
      label: "Áreas activas",
      value: areasActivas,
      icon: Building2,
      detail: "Áreas actualmente registradas en la organización.",
      loading: areasLoading,
    },
    {
      label: "Usuarios conectados",
      value: usuariosConectados,
      icon: Shield,
      detail: "Sesiones activas en la plataforma actualmente.",
      loading: summaryLoading,
    },
  ];

  return (
    <section className="module-section-enter module-enter-delay-3 w-full min-w-0">
      {error && (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {cards.map((card) => (
          <IndicadorCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}

export default InicioIndicadores;
