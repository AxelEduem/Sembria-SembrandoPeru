import { useEffect, useMemo, useState } from "react";

import { BriefcaseBusiness, Check, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function RolCargosDialog({
  open,
  role,
  loading = false,
  onOpenChange,
  onLoadCargos,
  onSaveCargos,
}) {
  const [cargos, setCargos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !role) return undefined;

    let mounted = true;

    async function load() {
      setLocalLoading(true);
      setError("");
      setSearch("");

      try {
        const rows = await onLoadCargos(role.id);

        if (mounted) {
          setCargos(rows);
          setSelectedIds(
            new Set(
              rows
                .filter((cargo) => String(cargo.rol_id) === String(role.id))
                .map((cargo) => Number(cargo.id)),
            ),
          );
        }
      } catch (loadError) {
        if (mounted) {
          setCargos([]);
          setSelectedIds(new Set());
          setError(loadError?.message || "No se pudieron cargar los cargos.");
        }
      } finally {
        if (mounted) setLocalLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [open, role, onLoadCargos]);

  const filteredCargos = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-PE");

    if (!term) return cargos;

    return cargos.filter((cargo) =>
      [cargo.nombre, cargo.area]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("es-PE").includes(term)),
    );
  }, [cargos, search]);

  const disabled = loading || localLoading;

  function toggleCargo(cargo) {
    const cargoId = Number(cargo.id);
    const belongsToRole = String(cargo.rol_id) === String(role.id);

    if (!role.activo && !belongsToRole) return;

    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(cargoId)) next.delete(cargoId);
      else next.add(cargoId);

      return next;
    });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const result = await onSaveCargos(role.id, Array.from(selectedIds));

    if (!result?.success) {
      setError(result?.message || "No se pudieron guardar los cargos del rol.");
      return;
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !loading && onOpenChange(value)}>
      <DialogContent className="max-h-[88vh] overflow-hidden p-0 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="flex max-h-[88vh] flex-col">
          <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg text-slate-800">
              <BriefcaseBusiness className="h-5 w-5 text-emerald-700" />
              Gestionar cargos
            </DialogTitle>
            <DialogDescription>
              Selecciona los cargos que tendrá el rol {role?.nombre || "seleccionado"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
            {!role?.activo && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                El rol está inactivo. Puedes retirar cargos actuales, pero no asignarle cargos nuevos.
              </p>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por cargo o área..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none transition-all duration-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{selectedIds.size} cargos seleccionados</span>
              <span>{cargos.length} cargos disponibles</span>
            </div>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="min-h-[260px] flex-1 overflow-y-auto rounded-xl border border-slate-200">
              {localLoading ? (
                <div className="flex h-64 items-center justify-center gap-2 text-sm text-slate-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                  Cargando cargos...
                </div>
              ) : filteredCargos.length === 0 ? (
                <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-slate-500">
                  {cargos.length ? "No hay cargos que coincidan con la búsqueda." : "No hay cargos registrados."}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredCargos.map((cargo) => {
                    const selected = selectedIds.has(Number(cargo.id));
                    const cannotAssign = !role?.activo && !selected;

                    return (
                      <button
                        key={cargo.id}
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        disabled={disabled || cannotAssign}
                        onClick={() => toggleCargo(cargo)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            selected
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold break-words text-slate-700">
                            {cargo.nombre}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {cargo.area}
                            </span>
                            {!cargo.activo && <span>Inactivo</span>}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={disabled}>
              Cancelar
            </Button>
            <ActionButton
              action="save"
              type="submit"
              loading={loading}
              loadingText="Guardando..."
              disabled={disabled}
            >
              Guardar cargos
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RolCargosDialog;
