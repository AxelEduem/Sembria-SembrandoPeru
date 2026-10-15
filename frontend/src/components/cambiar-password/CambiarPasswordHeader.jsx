import { KeyRound } from "lucide-react";

function CambiarPasswordHeader() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
        <KeyRound className="h-5 w-5" strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">Cambiar contrasena</h1>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          Define tu contrasena personal para continuar.
        </p>
      </div>
    </div>
  );
}

export default CambiarPasswordHeader;
