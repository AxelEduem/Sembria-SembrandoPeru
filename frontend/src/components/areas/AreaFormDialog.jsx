import { useState } from "react";

import { Building2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
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
  focus:border-emerald-500
  focus:bg-white
  focus:ring-4
  focus:ring-emerald-500/10
`;

function AreaFormDialog({ open, area, loading, onOpenChange, onSubmit }) {
  const [nombre, setNombre] = useState(area?.nombre?.toLocaleUpperCase("es-PE") || "");

  const [descripcion, setDescripcion] = useState(area?.descripcion || "");

  const [formError, setFormError] = useState("");

  const isEditing = Boolean(area);

  function handleNombreChange(event) {
    const value = event.target.value.toLocaleUpperCase("es-PE");

    setNombre(value);

    if (formError) {
      setFormError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = nombre.trim().toLocaleUpperCase("es-PE");

    const trimmedDescription = descripcion.trim();

    if (!trimmedName) {
      setFormError("El nombre del área es obligatorio.");
      return;
    }

    setFormError("");

    const result = await onSubmit({
      nombre: trimmedName,
      descripcion: trimmedDescription,
    });

    if (!result?.success) {
      setFormError(result?.message || "No fue posible guardar el área.");
      return;
    }

    setNombre("");
    setDescripcion("");
    setFormError("");

    onOpenChange(false);
  }

  function handleOpenChange(value) {
    if (loading) {
      return;
    }

    if (!value) {
      setFormError("");
    }

    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[500px]"
      >
        <DialogHeader className="border-b border-slate-100 px-6 pt-6 pb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
              <Building2 className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                {isEditing ? "Editar área" : "Nueva área"}
              </DialogTitle>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                {isEditing
                  ? "Actualiza la información del área institucional."
                  : "Registra una nueva área institucional en el sistema."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {formError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold">
                !
              </div>

              <p className="leading-5">{formError}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="area-nombre" className="text-sm font-semibold text-slate-700">
                Nombre
              </label>

              <span className="text-[11px] text-slate-400">Obligatorio</span>
            </div>

            <Input
              id="area-nombre"
              value={nombre}
              onChange={handleNombreChange}
              required
              maxLength={150}
              autoComplete="off"
              className={inputClass}
              placeholder="Ej. RECURSOS HUMANOS"
              disabled={loading}
            />

            <p className="text-[11px] text-slate-400">
              El nombre se registrará automáticamente en mayúsculas.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="area-descripcion" className="text-sm font-semibold text-slate-700">
                Descripción
              </label>

              <span className="text-[11px] text-slate-400">Opcional</span>
            </div>

            <textarea
              id="area-descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              maxLength={500}
              rows={4}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm leading-5 text-slate-800 transition-all duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Describe brevemente la función o propósito del área..."
            />

            <div className="flex justify-end text-[11px] text-slate-400">
              {descripcion.length}/500
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>

            <ActionButton
              action="save"
              type="submit"
              loading={loading}
              loadingText="Guardando..."
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {isEditing ? "Guardar cambios" : "Guardar área"}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AreaFormDialog;
