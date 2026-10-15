import { useEffect, useMemo, useState } from "react";

import { Check, Globe2, LockKeyhole, ShieldCheck } from "lucide-react";

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
import FeedbackToast from "@/components/ui/FeedbackToast";
import { MODULE_PERMISSIONS, isGlobalOnlyPermission } from "@/utils/permissions";

const MODULE_LABELS = {
  integrantes: "Integrantes",
  solicitudes_horario: "Solicitudes de horario",
  cumpleanos: "Cumpleaños",
  asistencia: "Gestión de asistencia",
  equipos: "Equipos",
  convocatorias: "Convocatorias",
  capacitaciones: "Capacitación",
  gestion_proyectos: "Gestión de proyectos",
  areas: "Áreas",
  cargos: "Cargos",
  aplicaciones: "Aplicaciones",
  accesos: "Accesos",
  usuarios: "Usuarios",
  roles: "Roles y permisos",
};

const HIDDEN_MODULES = new Set(["mi_periodo", "practicantes", "voluntarios"]);

const SIDEBAR_MODULE_ORDER = [
  "integrantes",
  "cumpleanos",
  "areas",
  "cargos",
  "solicitudes_horario",
  "asistencia",
  "equipos",
  "convocatorias",
  "capacitaciones",
  "accesos",
  "aplicaciones",
  "usuarios",
  "roles",
];

const SIDEBAR_MODULE_POSITION = new Map(
  SIDEBAR_MODULE_ORDER.map((module, index) => [module, index]),
);

const SCOPE_LABELS = {
  area: "Solo mi área",
  global: "Todas las áreas",
};

function isViewPermission(permission) {
  return permission?.accion === "ver" || String(permission?.codigo || "").endsWith(".ver");
}

function getModuleViewPermission(permissions = []) {
  return permissions.find(isViewPermission) || null;
}

function getDefaultScope(permission) {
  return isGlobalOnlyPermission(permission?.codigo) ? "global" : "area";
}

function getModulePermissions(permisosPorModulo, module) {
  const permissions = permisosPorModulo[module] || [];
  const order = MODULE_PERMISSIONS[module];

  return [...permissions].sort((first, second) => {
    const firstIsModuleView = first.accion === "ver" || String(first.codigo || "").endsWith(".ver");
    const secondIsModuleView =
      second.accion === "ver" || String(second.codigo || "").endsWith(".ver");

    if (firstIsModuleView !== secondIsModuleView) {
      return firstIsModuleView ? -1 : 1;
    }

    if (!order) {
      return String(first.nombre || "").localeCompare(String(second.nombre || ""));
    }

    const firstIndex = order.indexOf(first.codigo);
    const secondIndex = order.indexOf(second.codigo);
    const normalizedFirst = firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex;
    const normalizedSecond = secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex;

    return normalizedFirst - normalizedSecond;
  });
}

function formatModuleName(module) {
  return (
    MODULE_LABELS[module] ||
    String(module || "")
      .replaceAll("_", " ")
      .replace(/^\w/, (letter) => letter.toUpperCase())
  );
}

function compareModules(first, second) {
  const firstPosition = SIDEBAR_MODULE_POSITION.get(first) ?? Number.MAX_SAFE_INTEGER;
  const secondPosition = SIDEBAR_MODULE_POSITION.get(second) ?? Number.MAX_SAFE_INTEGER;

  if (firstPosition !== secondPosition) {
    return firstPosition - secondPosition;
  }

  return formatModuleName(first).localeCompare(formatModuleName(second));
}

function normalizePermissionRows(rows = []) {
  const map = new Map();

  rows.forEach((row) => {
    const id = Number(
      typeof row === "number" ? row : (row?.permiso_id ?? row?.id ?? row?.permisoId),
    );

    if (!Number.isFinite(id) || id <= 0) {
      return;
    }

    map.set(id, {
      permiso_id: id,
      alcance:
        typeof row === "object" && row !== null && row.alcance === "global" ? "global" : "area",
    });
  });

  return map;
}

function RolPermisosDialog({
  open,
  role,
  permisosPorModulo = {},
  loading = false,
  onOpenChange,
  onLoadPermissions,
  onSavePermissions,
}) {
  const [selectedPermissions, setSelectedPermissions] = useState(new Map());
  const [accessTotal, setAccessTotal] = useState(false);

  const [localLoading, setLocalLoading] = useState(false);
  const [localFeedback, setLocalFeedback] = useState(null);

  useEffect(() => {
    if (!open || !role) {
      return;
    }

    let mounted = true;

    async function load() {
      setLocalLoading(true);

      try {
        const rows = await onLoadPermissions(role.id);

        if (mounted) {
          setSelectedPermissions(normalizePermissionRows(rows));
          setAccessTotal(Boolean(role.acceso_total));
        }
      } catch (error) {
        console.error("Error cargando permisos del rol:", error);

        if (mounted) {
          setSelectedPermissions(new Map());
          setAccessTotal(Boolean(role.acceso_total));
        }
      } finally {
        if (mounted) {
          setLocalLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [open, role, onLoadPermissions]);

  const modules = useMemo(
    () =>
      Object.keys(permisosPorModulo)
        .filter((module) => !HIDDEN_MODULES.has(module))
        .sort(compareModules),
    [permisosPorModulo],
  );

  const isDisabled = loading || localLoading || accessTotal;

  const permissionsById = useMemo(() => {
    const index = new Map();

    Object.entries(permisosPorModulo).forEach(([module, permissions]) => {
      permissions.forEach((permission) => {
        index.set(Number(permission.id), { ...permission, module });
      });
    });

    return index;
  }, [permisosPorModulo]);

  function isSelected(permisoId) {
    return selectedPermissions.has(Number(permisoId));
  }

  function getScope(permisoId) {
    const permission = permissionsById.get(Number(permisoId));

    if (isGlobalOnlyPermission(permission?.codigo)) {
      return "global";
    }

    return selectedPermissions.get(Number(permisoId))?.alcance || "area";
  }

  function notifyViewPermissionRequired(module) {
    setLocalFeedback({
      type: "warning",
      message: `Primero debes seleccionar el permiso “Ver módulo” de ${formatModuleName(module)}.`,
    });
  }

  function togglePermission(module, permission) {
    if (isDisabled) {
      return;
    }

    const id = Number(permission.id);
    const modulePermissions = getModulePermissions(permisosPorModulo, module);
    const viewPermission = getModuleViewPermission(modulePermissions);

    if (
      selectedPermissions.has(id) &&
      isViewPermission(permission) &&
      modulePermissions.some(
        (candidate) =>
          !isViewPermission(candidate) && selectedPermissions.has(Number(candidate.id)),
      )
    ) {
      setLocalFeedback({
        type: "warning",
        message: `No puedes quitar “Ver módulo” mientras existan otros permisos seleccionados en ${formatModuleName(module)}.`,
      });
      return;
    }

    if (
      !selectedPermissions.has(id) &&
      !isViewPermission(permission) &&
      viewPermission &&
      !selectedPermissions.has(Number(viewPermission.id))
    ) {
      notifyViewPermissionRequired(module);
      return;
    }

    setSelectedPermissions((current) => {
      const next = new Map(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, {
          permiso_id: id,
          alcance: getDefaultScope(permission),
        });

        if (
          !isViewPermission(permission) &&
          viewPermission &&
          getDefaultScope(permission) === "global"
        ) {
          next.set(Number(viewPermission.id), {
            permiso_id: Number(viewPermission.id),
            alcance: "global",
          });
        }
      }

      return next;
    });
  }

  function changeScope(module, permission, alcance) {
    if (isDisabled) {
      return;
    }

    const id = Number(permission.id);
    const modulePermissions = getModulePermissions(permisosPorModulo, module);
    const viewPermission = getModuleViewPermission(modulePermissions);

    if (alcance === "area" && isGlobalOnlyPermission(permission.codigo)) {
      setLocalFeedback({
        type: "warning",
        message: `El permiso “${permission.nombre}” administra información institucional y solo puede tener alcance global.`,
      });
      return;
    }

    if (
      alcance === "area" &&
      isViewPermission(permission) &&
      modulePermissions.some(
        (candidate) =>
          !isViewPermission(candidate) &&
          selectedPermissions.has(Number(candidate.id)) &&
          getScope(candidate.id) === "global",
      )
    ) {
      setLocalFeedback({
        type: "warning",
        message: `“Ver módulo” debe conservar alcance global mientras ${formatModuleName(module)} tenga acciones globales.`,
      });
      return;
    }

    setSelectedPermissions((current) => {
      const next = new Map(current);

      if (!next.has(id)) {
        return next;
      }

      next.set(id, {
        permiso_id: id,
        alcance: alcance === "global" ? "global" : "area",
      });

      if (
        alcance === "global" &&
        !isViewPermission(permission) &&
        viewPermission &&
        next.has(Number(viewPermission.id))
      ) {
        next.set(Number(viewPermission.id), {
          permiso_id: Number(viewPermission.id),
          alcance: "global",
        });
      }

      return next;
    });
  }

  function toggleModule(module) {
    if (isDisabled) {
      return;
    }

    const modulePermissions = getModulePermissions(permisosPorModulo, module);
    const viewPermission = getModuleViewPermission(modulePermissions);

    const allSelected =
      modulePermissions.length > 0 &&
      modulePermissions.every((permiso) => selectedPermissions.has(Number(permiso.id)));

    setSelectedPermissions((current) => {
      const next = new Map(current);
      const requiresGlobalView = modulePermissions.some((permission) =>
        isGlobalOnlyPermission(permission.codigo),
      );

      modulePermissions.forEach((permiso) => {
        const id = Number(permiso.id);

        if (allSelected) {
          next.delete(id);
        } else if (!next.has(id)) {
          next.set(id, {
            permiso_id: id,
            alcance:
              isGlobalOnlyPermission(permiso.codigo) ||
              (requiresGlobalView && viewPermission?.id === permiso.id)
                ? "global"
                : "area",
          });
        }
      });

      return next;
    });
  }

  function setModuleScope(module, alcance) {
    if (isDisabled) {
      return;
    }

    const modulePermissions = getModulePermissions(permisosPorModulo, module);

    setSelectedPermissions((current) => {
      const next = new Map(current);

      modulePermissions.forEach((permiso) => {
        const id = Number(permiso.id);

        if (next.has(id)) {
          next.set(id, {
            permiso_id: id,
            alcance:
              alcance === "global" || isGlobalOnlyPermission(permiso.codigo)
                ? "global"
                : "area",
          });
        }
      });

      const selectedGlobalAction = modulePermissions.some(
        (permission) =>
          !isViewPermission(permission) &&
          next.has(Number(permission.id)) &&
          next.get(Number(permission.id))?.alcance === "global",
      );

      if (selectedGlobalAction) {
        const viewPermission = getModuleViewPermission(modulePermissions);

        if (viewPermission && next.has(Number(viewPermission.id))) {
          next.set(Number(viewPermission.id), {
            permiso_id: Number(viewPermission.id),
            alcance: "global",
          });
        }
      }

      return next;
    });
  }

  async function handleSave() {
    if (!role || loading || localLoading) {
      return;
    }

    const normalizedSelection = Array.from(selectedPermissions.values()).map((permission) => {
      const metadata = permissionsById.get(Number(permission.permiso_id));

      return {
        ...permission,
        alcance: isGlobalOnlyPermission(metadata?.codigo) ? "global" : permission.alcance,
        metadata,
      };
    });

    if (!accessTotal) {
      for (const module of modules) {
        const moduleSelection = normalizedSelection.filter(
          (permission) => permission.metadata?.module === module,
        );
        const actionPermissions = moduleSelection.filter(
          (permission) => !isViewPermission(permission.metadata),
        );

        if (actionPermissions.length === 0) {
          continue;
        }

        const viewPermission = moduleSelection.find((permission) =>
          isViewPermission(permission.metadata),
        );

        if (!viewPermission) {
          notifyViewPermissionRequired(module);
          return;
        }

        if (
          viewPermission.alcance !== "global" &&
          actionPermissions.some((permission) => permission.alcance === "global")
        ) {
          setLocalFeedback({
            type: "warning",
            message: `El permiso “Ver módulo” de ${formatModuleName(module)} debe tener alcance global porque existen acciones globales seleccionadas.`,
          });
          return;
        }
      }
    }

    const permissions = normalizedSelection.map(({ permiso_id, alcance }) => ({
      permiso_id,
      alcance,
    }));

    const result = await onSavePermissions(role.id, permissions, {
      acceso_total: accessTotal,
    });

    if (result?.success) {
      onOpenChange(false);
    }
  }

  return (
    <>
      <FeedbackToast feedback={localFeedback} onClose={() => setLocalFeedback(null)} />

      <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-1rem)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-[820px] md:max-w-[860px] lg:max-w-[900px]">
        <div className="shrink-0 px-4 pt-5 sm:px-6 sm:pt-6">
          <DialogHeader className="text-left">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
              </div>

              <div className="min-w-0 flex-1">
                <DialogTitle className="pr-6 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  Permisos de {role?.nombre || "rol"}
                </DialogTitle>

                <DialogDescription className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                  Define las acciones del rol y determina si cada permiso aplica solamente a su área
                  o a todas las áreas.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <label
            className={`mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 transition-colors ${
              accessTotal
                ? "border-emerald-200 bg-emerald-50/80"
                : "border-slate-200 bg-slate-50/70 hover:border-emerald-200"
            } ${loading || localLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          >
            <input
              type="checkbox"
              checked={accessTotal}
              onChange={(event) => setAccessTotal(event.target.checked)}
              disabled={loading || localLoading}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600"
            />

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <LockKeyhole className="h-4 w-4 text-emerald-700" />
                Acceso total al sistema
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Permite utilizar todos los módulos, acciones y áreas. Mientras esté activo, los
                permisos individuales no se aplican.
              </span>
            </span>
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {localLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                Cargando permisos...
              </div>
            </div>
          ) : (
            <div className={`space-y-4 transition-opacity ${accessTotal ? "opacity-55" : ""}`}>
              {modules.map((module) => {
                const modulePermissions = getModulePermissions(permisosPorModulo, module);

                const selectedCount = modulePermissions.filter((permiso) =>
                  selectedPermissions.has(Number(permiso.id)),
                ).length;

                const allSelected =
                  modulePermissions.length > 0 && selectedCount === modulePermissions.length;

                const selectedModulePermissions = modulePermissions.filter((permiso) =>
                  selectedPermissions.has(Number(permiso.id)),
                );

                const moduleIsGlobal =
                  selectedModulePermissions.length > 0 &&
                  selectedModulePermissions.every((permiso) => getScope(permiso.id) === "global");

                return (
                  <section
                    key={module}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {formatModuleName(module)}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {selectedCount} de {modulePermissions.length} permisos
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleModule(module)}
                          disabled={isDisabled}
                          className="self-start text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                        >
                          {allSelected ? "Quitar todos" : "Seleccionar todos"}
                        </button>
                      </div>

                      {selectedCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Alcance de seleccionados:
                          </span>

                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setModuleScope(module, "area")}
                            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                              !moduleIsGlobal
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            Solo mi área
                          </button>

                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setModuleScope(module, "global")}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                              moduleIsGlobal
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            <Globe2 className="h-3 w-3" />
                            Todas las áreas
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-1 p-2">
                      {modulePermissions.map((permiso) => {
                        const id = Number(permiso.id);

                        const checked = isSelected(id);

                        const alcance = getScope(id);

                        return (
                          <div
                            key={permiso.id}
                            className={`rounded-xl transition-colors ${
                              checked ? "bg-emerald-50/70" : "hover:bg-slate-50"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => togglePermission(module, permiso)}
                              disabled={isDisabled}
                              className="flex w-full min-w-0 items-start gap-3 px-3 py-3 text-left disabled:cursor-not-allowed"
                            >
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  checked
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium break-words text-slate-700">
                                  {permiso.nombre}
                                </span>

                                {permiso.descripcion && (
                                  <span className="mt-0.5 block text-xs leading-5 break-words text-slate-400">
                                    {permiso.descripcion}
                                  </span>
                                )}
                              </span>
                            </button>

                            {checked && (
                              <div className="flex flex-wrap gap-2 px-3 pb-3 pl-10">
                                <button
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => changeScope(module, permiso, "area")}
                                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                                    alcance === "area"
                                      ? "border-emerald-200 bg-white text-emerald-700 shadow-sm"
                                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                  } ${isGlobalOnlyPermission(permiso.codigo) ? "cursor-not-allowed opacity-45" : ""}`}
                                >
                                  Solo mi área
                                </button>

                                <button
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => changeScope(module, permiso, "global")}
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                                    alcance === "global"
                                      ? "border-emerald-200 bg-white text-emerald-700 shadow-sm"
                                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                  }`}
                                >
                                  <Globe2 className="h-3 w-3" />
                                  Todas las áreas
                                </button>

                                <span className="ml-auto self-center text-[10px] font-medium text-slate-400">
                                  {SCOPE_LABELS[alcance]}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {modules.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No hay permisos disponibles.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Registra permisos en la base de datos para configurarlos aquí.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t border-slate-100 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-10 w-full rounded-xl sm:w-auto"
          >
            Cancelar
          </Button>

          <ActionButton
            action="save"
            type="button"
            onClick={handleSave}
            loading={loading}
            loadingText="Guardando..."
            disabled={loading || localLoading}
            className="w-full sm:w-auto"
          >
            Guardar permisos
          </ActionButton>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RolPermisosDialog;
