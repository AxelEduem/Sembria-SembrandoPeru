import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";

function CambiarPasswordField({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  error,
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className="h-11 rounded-xl border-slate-200 bg-slate-50 pr-11 text-sm shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-emerald-600"
          aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.8} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.8} />
          )}
        </button>
      </div>

      {error ? (
        <p className="text-xs leading-4 text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-slate-400">Usa al menos 8 caracteres.</p>
      )}
    </div>
  );
}

export default CambiarPasswordField;
