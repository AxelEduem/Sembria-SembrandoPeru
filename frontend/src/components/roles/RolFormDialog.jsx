import { useState } from "react";

import { KeyRound, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";

const inputClass = `
  h-10
  w-full
  rounded-xl
  border
  border-slate-200
  bg-slate-50/60
  px-3
  text-sm
  text-slate-800
  outline-none
  transition-all
  duration-200
  placeholder:text-slate-400
  hover:border-slate-300
  focus:bg-white
  focus:border-emerald-500
  focus:ring-4
  focus:ring-emerald-500/10
`;

function createInitialState(role) {
  return {
    codigo: role?.codigo || "",
    nombre: role?.nombre?.toUpperCase() || "",
    descripcion: role?.descripcion || "",
    acceso_total: Boolean(role?.acceso_total),
  };
}

function RolFormDialog({
  open,
  role,
  loading = false,
  onOpenChange,
  onSubmit,
}) {
  const [form, setForm] = useState(createInitialState(role));

  const [localError, setLocalError] = useState("");

  const isEditing = Boolean(role);

  function handleChange(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setLocalError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nombre = form.nombre.trim();

    if (!nombre) {
      setLocalError("El nombre del rol es obligatorio.");

      return;
    }

    const codigo = form.codigo.trim();

    if (!codigo) {
      setLocalError("El código del rol es obligatorio.");

      return;
    }

    const result = await onSubmit({
      ...form,
      nombre,
      codigo,
      descripcion: form.descripcion.trim(),
    });

    if (result?.success) {
      onOpenChange(false);
    } else if (result?.message) {
      setLocalError(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[560px]">
        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-6">
            <DialogHeader className="text-left">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
                </div>

                <div>
                  <DialogTitle className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                    {isEditing ? "Editar rol" : "Nuevo rol"}
                  </DialogTitle>

                  <DialogDescription className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    {isEditing
                      ? "Actualiza la información general del rol."
                      : "Crea un rol y después configura sus permisos y alcances."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            {localError && (
              <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {localError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nombre del rol</label>

              <Input
                value={form.nombre}
                onChange={(event) => handleChange("nombre", event.target.value.toUpperCase())}
                className={inputClass}
                placeholder="EJ. SUPERVISOR DE TI"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Código</label>

              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  value={form.codigo}
                  onChange={(event) =>
                    handleChange(
                      "codigo",
                      event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                    )
                  }
                  className={`${inputClass} pl-9`}
                  placeholder="supervisor_ti"
                  disabled={loading}
                />
              </div>

              <p className="text-xs leading-5 text-slate-400">
                Identificador interno del rol. Usa letras, números y guiones bajos.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Descripción</label>

              <textarea
                value={form.descripcion}
                onChange={(event) => handleChange("descripcion", event.target.value)}
                className="min-h-[92px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-800 transition-all duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                placeholder="Describe brevemente qué representa este rol."
                disabled={loading}
              />
            </div>

          </div>

          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-10 rounded-xl"
            >
              Cancelar
            </Button>

            <ActionButton
              action="save"
              type="submit"
              loading={loading}
              loadingText="Guardando..."
            >
              Guardar rol
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RolFormDialog;
