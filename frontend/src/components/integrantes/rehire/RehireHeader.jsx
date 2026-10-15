import { ArrowLeft, RefreshCw } from "lucide-react";
import { useRehireFormContext } from "@/contexts/RehireFormContext";

export default function RehireHeader() {
  const { row, isPracticante, saving, navigate } = useRehireFormContext();

  return (
    <>
      <button
        type="button"
        onClick={() => navigate("/integrantes")}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a integrantes
      </button>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-[#2D5A3D]" />
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold tracking-[0.12em] text-emerald-700 uppercase">
                  {isPracticante ? "Practicante" : "Voluntario"}
                </span>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  Inactivo
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Recontratar a {row?.nombre || "integrante"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Registra un nuevo periodo de participación sin crear otra persona ni otra cuenta.
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <RefreshCw className="h-5 w-5" strokeWidth={1.8} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}