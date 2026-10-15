import { useIntegranteDetailContext } from "@/contexts/IntegranteDetailContext";
import AplicacionLogo from "@/components/ui/AplicacionLogo";

export default function ApplicationsSection() {
  const { accesses } = useIntegranteDetailContext();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <AplicacionLogo aplicacion={{}} className="h-6 w-6 rounded-lg border-0 bg-transparent" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Aplicaciones</h2>
            <p className="mt-1 text-sm text-slate-500">Accesos asignados.</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {accesses.length ? (
          <div className="space-y-2">
            {accesses.map((access) => (
              <div
                key={access.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <AplicacionLogo aplicacion={access.aplicacion} />
                <span className="text-sm font-medium text-slate-700">
                  {access.aplicacion?.nombre || "Aplicación"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white">
              <AplicacionLogo aplicacion={{}} className="h-8 w-8 border-0 bg-transparent" />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-600">No tiene aplicaciones asignadas.</p>
          </div>
        )}
      </div>
    </section>
  );
}