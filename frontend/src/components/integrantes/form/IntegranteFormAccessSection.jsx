import { Check, Copy, Eye, EyeOff, Lightbulb, RefreshCw } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIntegranteFormContext } from "@/contexts/IntegranteFormContext";
import { EMAIL_DOMAIN, inputClass, labelClass, fieldClass } from "@/constants/formConstants";
import { randomPassword } from "@/utils/formHelpers";

export default function IntegranteFormAccessSection() {
  const {
    mode,
    correo,
    setCorreo,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    copiedPassword,
    setCopiedPassword,
    handleCopyPassword,
    sugerirCorreo,
    suggestingCorreo,
    submitting,
  } = useIntegranteFormContext();

  const busy = submitting;

  return (
    <>
      {/* Correo institucional */}
      <div className={fieldClass}>
        <label htmlFor="integrante-correo" className={labelClass}>
          Correo institucional
        </label>

        <div className="flex min-w-0 gap-2">
          <div className="flex h-11 min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 hover:border-slate-300">
            <Input
              id="integrante-correo"
              value={correo}
              onChange={(event) =>
                setCorreo(event.target.value.replace(/@.*$/, "").replace(/\s/g, ""))
              }
              className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus-visible:ring-0"
              placeholder="nombre.apellido"
              autoComplete="email"
              disabled={busy}
            />

            <span className="flex shrink-0 items-center border-l border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">
              {EMAIL_DOMAIN}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={sugerirCorreo}
            disabled={busy || suggestingCorreo}
            className="h-11 shrink-0 gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-semibold text-slate-600 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Lightbulb className="h-3.5 w-3.5" strokeWidth={1.9} />
            {suggestingCorreo ? "Sugiriendo..." : "Sugerir"}
          </Button>
        </div>
      </div>

      {/* Contraseña + acciones */}
      <div className={fieldClass}>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="integrante-password" className={labelClass}>
            Contraseña
          </label>

          {mode === "edit" && (
            <span className="text-[11px] text-slate-400">Vacía = conservar actual</span>
          )}
        </div>

        <div className="flex min-w-0 gap-2">
          {/* Input contraseña */}
          <div className="relative min-w-0 flex-1">
            <Input
              id="integrante-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setCopiedPassword(false);
              }}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              className={`${inputClass} pr-11`}
              placeholder={mode === "edit" ? "Vacía para conservar" : "Contraseña"}
              disabled={busy}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={busy}
              className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-50"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.8} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.8} />
              )}
            </button>
          </div>

          {/* Generar */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPassword(randomPassword());
              setShowPassword(true);
              setCopiedPassword(false);
            }}
            disabled={busy}
            className="h-11 shrink-0 gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-semibold text-slate-600 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.9} />
            Generar
          </Button>

          {/* Copiar */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyPassword}
            disabled={!password || busy}
            className={`h-11 shrink-0 gap-1.5 rounded-xl border-slate-200 px-3 text-xs font-semibold transition-all ${
              copiedPassword
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                : "text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            {copiedPassword ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={1.9} />
            )}

            {copiedPassword ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </div>
    </>
  );
}
