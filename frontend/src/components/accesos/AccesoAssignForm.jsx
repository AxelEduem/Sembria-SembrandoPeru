import { memo } from "react";

import { Check, KeyRound, Search, Settings2, Trash2 } from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { Input } from "@/components/ui/input";
import { getAvatarUrl } from "@/utils/avatar";

function getTipoLabel(tipo) {
  if (tipo === "practicante") return "Practicante";
  if (tipo === "gerente") return "Gerente";
  return "Voluntario";
}

function AccesoAssignForm({
  selectedVoluntario,
  selectedVoluntarioId,
  voluntarioSearch,
  filteredVoluntarios,
  aplicacionesDisponibles,
  asignacionesActuales = [],
  statsMap,
  selectedAplicacionIds,
  saving,
  canAssign = true,
  canRevoke = false,
  onSubmit,
  onVoluntarioSearchChange,
  onSelectVoluntario,
  onToggleAplicacion,
  onRequestRevoke,
  onRequestRevokeAll,
  embedded = false,
}) {
  const selectedVoluntarioAvatarUrl = selectedVoluntario
    ? getAvatarUrl(selectedVoluntario.avatar_url) || getAvatarUrl(selectedVoluntario.avatar_path)
    : null;

  return (
    <>
      <style>{`
        @keyframes accesoAssignEnter {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .acceso-assign-enter { animation: accesoAssignEnter 440ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .acceso-assign-item { animation: accesoAssignEnter 360ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .acceso-assign-enter, .acceso-assign-item { animation: none; } }
      `}</style>
      <form
        onSubmit={onSubmit}
        className={`acceso-assign-enter bg-white ${
          embedded
            ? ""
            : "rounded-2xl border border-slate-200 p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
        }`}
      >
        {!embedded && (
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
            <h2 className="text-sm font-semibold text-slate-800">Gestionar accesos</h2>
          </div>
        )}

        <div className={`${embedded ? "" : "mt-4"} space-y-3`}>
          <div className="space-y-2">
            <label htmlFor="acceso-integrante" className="text-xs font-semibold text-slate-600">
              Integrante
            </label>

            {!selectedVoluntario && (
              <div className="relative">
                <Search
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.8}
                />

                <Input
                  id="acceso-integrante"
                  value={voluntarioSearch}
                  onChange={(event) => onVoluntarioSearchChange(event.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="Buscar por nombre, correo, área o cargo"
                  autoComplete="off"
                />
              </div>
            )}

            {voluntarioSearch && !selectedVoluntario && (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                {filteredVoluntarios.map((integrante) => {
                  const avatarUrl =
                    getAvatarUrl(integrante.avatar_url) || getAvatarUrl(integrante.avatar_path);

                  return (
                    <div
                      key={integrante.id}
                      className="flex w-full items-center gap-2 px-3 py-2.5 hover:bg-emerald-50"
                    >
                      {avatarUrl ? (
                        <EnlargeablePhoto
                          src={avatarUrl}
                          fallbackSrc={getAvatarUrl(integrante.avatar_path)}
                          alt={`Foto de ${integrante.nombre}`}
                          className="h-8 w-8 rounded-lg border border-emerald-100"
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onSelectVoluntario(integrante)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm font-semibold text-slate-800">{integrante.nombre}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {getTipoLabel(integrante.tipo_integrante)} · {integrante.area} ·{" "}
                          {integrante.cargo}
                        </p>
                      </button>
                    </div>
                  );
                })}

                {filteredVoluntarios.length === 0 && (
                  <p className="px-3 py-3 text-sm text-slate-400">No encontramos integrantes.</p>
                )}
              </div>
            )}

            {selectedVoluntario && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                {selectedVoluntarioAvatarUrl ? (
                  <EnlargeablePhoto
                    src={selectedVoluntarioAvatarUrl}
                    fallbackSrc={getAvatarUrl(selectedVoluntario.avatar_path)}
                    alt={`Foto de ${selectedVoluntario.nombre}`}
                    className="h-10 w-10 rounded-xl border border-emerald-200 bg-white"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-xs font-bold text-emerald-700">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {selectedVoluntario.nombre}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {selectedVoluntario.area} · {selectedVoluntario.cargo}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-700">Accesos actuales</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Aplicaciones habilitadas para este integrante.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  {asignacionesActuales.length}
                </span>
                {canRevoke && asignacionesActuales.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onRequestRevokeAll}
                    disabled={saving}
                    className="h-8 gap-1.5 rounded-lg border-red-200 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Quitar todos
                  </Button>
                )}
              </div>
            </div>

            {asignacionesActuales.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {asignacionesActuales.map((asignacion) => (
                  <div
                    key={asignacion.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <KeyRound className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                      {asignacion.aplicacion?.nombre || "Aplicación"}
                    </p>
                    {canRevoke && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRequestRevoke(asignacion)}
                        disabled={saving}
                        aria-label={`Quitar acceso a ${asignacion.aplicacion?.nombre || "la aplicación"}`}
                        className="h-8 w-8 shrink-0 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-3 text-xs text-slate-500">
                Este integrante todavía no tiene accesos asignados.
              </div>
            )}
          </div>

          {canAssign && (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Licencias disponibles</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Puedes seleccionar más de una aplicación.
                  </p>
                </div>
                {selectedAplicacionIds.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    {selectedAplicacionIds.length} seleccionada
                    {selectedAplicacionIds.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {aplicacionesDisponibles.map((aplicacion, index) => (
                  <label
                    key={aplicacion.id}
                    style={{ animationDelay: `${180 + index * 55}ms` }}
                    className={`acceso-assign-item flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      selectedAplicacionIds.includes(aplicacion.id)
                        ? "border-emerald-300 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAplicacionIds.includes(aplicacion.id)}
                      onChange={() => onToggleAplicacion(aplicacion.id)}
                      disabled={!selectedVoluntarioId}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                    />

                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <KeyRound className="h-4 w-4" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {aplicacion.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {statsMap.get(aplicacion.id)?.disponibles || 0} licencias disponibles
                        </p>
                      </div>
                    </div>
                  </label>
                ))}

                {!selectedVoluntario && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3 text-xs text-slate-400">
                    Selecciona un integrante para ver sus aplicaciones disponibles.
                  </div>
                )}
              </div>
            </div>
          )}

          {canAssign && selectedVoluntario && aplicacionesDisponibles.length === 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5 text-xs leading-5 text-amber-700">
              Este integrante ya tiene todas las aplicaciones disponibles o no hay licencias libres.
            </div>
          )}
        </div>

        {canAssign && (
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {selectedAplicacionIds.length
                ? `${selectedAplicacionIds.length} acceso${selectedAplicacionIds.length === 1 ? "" : "s"} listo${selectedAplicacionIds.length === 1 ? "" : "s"} para asignar`
                : "Selecciona al menos una licencia para continuar."}
            </p>
            <ActionButton
              action="create"
              type="submit"
              loading={saving}
              loadingText="Asignando..."
              disabled={!selectedVoluntarioId || selectedAplicacionIds.length === 0}
            >
              {`Asignar${selectedAplicacionIds.length ? ` (${selectedAplicacionIds.length})` : ""}`}
            </ActionButton>
          </div>
        )}
      </form>
    </>
  );
}

export default memo(AccesoAssignForm);
