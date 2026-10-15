import { Camera } from "lucide-react";

function FotoPerfilHeader() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
        <Camera className="h-5 w-5" strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">Foto de perfil</h1>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          Agrega una foto de perfil para completar la activacion de tu cuenta.
        </p>
      </div>
    </div>
  );
}

export default FotoPerfilHeader;
