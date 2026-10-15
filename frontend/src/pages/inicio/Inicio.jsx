import InicioPresentacion from "@/components/inicio/InicioPresentacion";
import InicioResumen from "@/components/inicio/InicioResumen";
import InicioIndicadores from "@/components/inicio/InicioIndicadores";
import InicioFooter from "@/components/inicio/InicioFooter";

function Inicio() {
  return (
    <div className="module-page-enter min-h-[calc(100vh-2rem)] w-full max-w-full overflow-x-hidden bg-gradient-to-br from-[#f7fbf8] via-white to-emerald-50/40 px-4 py-4 sm:px-8 sm:py-8 lg:px-12">
      <div className="mx-auto w-full max-w-6xl min-w-0">
        <InicioPresentacion />
        <InicioResumen />
        <InicioIndicadores />
        <InicioFooter />
      </div>
    </div>
  );
}

export default Inicio;
