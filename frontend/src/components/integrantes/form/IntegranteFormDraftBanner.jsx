import { Play, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Aviso de borrador guardado en localStorage.
 * Se muestra al entrar al formulario de creación cuando existe
 * un borrador previo. El usuario decide continuar (aplica los datos)
 * o empezar de cero (descarta el borrador).
 */
export default function IntegranteFormDraftBanner({ onContinue, onDismiss }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <Save
          className="h-4 w-4"
          strokeWidth={2}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900">
          Tienes un borrador guardado
        </p>

        <p className="mt-1 text-sm leading-5 text-amber-700">
          Encontramos un formulario sin terminar. Puedes continuar donde lo dejaste
          o empezar de cero.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={onContinue}
            className="h-10 shrink-0 gap-1.5 rounded-xl bg-[#2D5A3D] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#234B32]"
          >
            <Play
              className="h-4 w-4"
              strokeWidth={2}
            />
            Continuar
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onDismiss}
            className="h-10 shrink-0 gap-1.5 rounded-xl border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-all hover:border-amber-200 hover:bg-amber-100 hover:text-amber-800"
          >
            Empezar de cero
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Descartar borrador"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-800"
      >
        <X
          className="h-4 w-4"
          strokeWidth={2}
        />
      </button>
    </div>
  );
}