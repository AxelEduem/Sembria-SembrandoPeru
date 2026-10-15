import { useMemo, useState } from "react";

import { BriefcaseBusiness } from "lucide-react";

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

import { useAuth } from "@/contexts/AuthContext";

import { PERMISSIONS, getAreaId, hasAccessTotal, hasPermission } from "@/utils/permissions";

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
  disabled:cursor-not-allowed
  disabled:bg-slate-100
  disabled:text-slate-400
`;

function normalizeId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/*
 * Obtiene el permiso concreto del usuario
 * desde profile.permissions.
 *
 * No depende del nombre del rol.
 */
function getProfilePermission(profile, permissionCode) {
  if (!profile || !permissionCode) {
    return null;
  }

  return profile.permissions?.find((permission) => permission?.codigo === permissionCode) || null;
}

/*
 * Determina el alcance real del permiso.
 *
 * acceso_total = global automáticamente.
 *
 * En caso contrario se utiliza el alcance
 * definido en rol_permisos.
 */
function getPermissionScope(profile, permissionCode) {
  if (hasAccessTotal(profile)) {
    return "global";
  }

  const permission = getProfilePermission(profile, permissionCode);

  return permission?.alcance || null;
}

function CargoFormDialog({
  open,
  cargo,
  areas = [],
  loading,
  loadingAreas = false,
  onOpenChange,
  onSubmit,
}) {
  const { profile } = useAuth();

  const isEditing = Boolean(cargo);

  /*
   * ============================================================
   * PERMISOS DINÁMICOS
   * ============================================================
   *
   * Ya NO preguntamos:
   *
   *   "¿Es coordinador?"
   *
   * Ahora preguntamos:
   *
   *   "¿Tiene cargos.crear?"
   *   "¿Tiene cargos.editar?"
   *
   * El rol puede tener cualquier nombre.
   */

  const canCreate = hasPermission(profile, PERMISSIONS.CARGOS_CREAR);

  const canEdit = hasPermission(profile, PERMISSIONS.CARGOS_EDITAR);

  const canManage = isEditing ? canEdit : canCreate;

  /*
   * Permiso que controla el formulario
   * según si estamos creando o editando.
   */
  const permissionCode = isEditing ? PERMISSIONS.CARGOS_EDITAR : PERMISSIONS.CARGOS_CREAR;

  /*
   * ============================================================
   * ALCANCE
   * ============================================================
   */

  const permissionScope = getPermissionScope(profile, permissionCode);

  const isAreaScoped = !hasAccessTotal(profile) && permissionScope === "area";

  const userAreaId = normalizeId(getAreaId(profile));

  /*
   * ============================================================
   * ÁREA INICIAL
   * ============================================================
   *
   * Si editamos:
   *   → mantenemos el área del cargo.
   *
   * Si creamos y el permiso es por área:
   *   → usamos el área del usuario.
   *
   * Si es global:
   *   → el usuario puede seleccionar.
   */

  const initialAreaId = useMemo(() => {
    if (cargo?.area_id) {
      return String(cargo.area_id);
    }

    if (isAreaScoped && userAreaId) {
      return String(userAreaId);
    }

    return "";
  }, [cargo?.area_id, isAreaScoped, userAreaId]);

  const [nombre, setNombre] = useState(cargo?.nombre?.toLocaleUpperCase("es-PE") || "");

  const [areaId, setAreaId] = useState(initialAreaId);

  const [descripcion, setDescripcion] = useState(cargo?.descripcion || "");

  const [formError, setFormError] = useState("");

  /*
   * ============================================================
   * ÁREAS DISPONIBLES
   * ============================================================
   *
   * acceso_total / global:
   *   → todas las áreas activas.
   *
   * alcance area:
   *   → solamente el área del usuario.
   */

  const availableAreas = useMemo(() => {
    const activeAreas = (areas || []).filter((area) => area?.activo === true);

    if (!isAreaScoped) {
      return activeAreas;
    }

    if (!userAreaId) {
      return [];
    }

    return activeAreas.filter((area) => normalizeId(area.id) === userAreaId);
  }, [areas, isAreaScoped, userAreaId]);

  /*
   * ============================================================
   * DATOS SELECCIONADOS
   * ============================================================
   */

  const selectedArea = useMemo(() => {
    return areas.find((area) => String(area.id) === String(areaId));
  }, [areas, areaId]);

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  function clearFormError() {
    if (formError) {
      setFormError("");
    }
  }

  /*
   * ============================================================
   * NOMBRE
   * ============================================================
   */

  function handleNombreChange(event) {
    const value = event.target.value.toLocaleUpperCase("es-PE");

    setNombre(value);

    clearFormError();
  }

  /*
   * ============================================================
   * GUARDAR
   * ============================================================
   */

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = nombre.trim().toLocaleUpperCase("es-PE");

    const trimmedDescription = descripcion.trim();

    /*
     * ----------------------------------------------------------
     * VALIDACIÓN DEL NOMBRE
     * ----------------------------------------------------------
     */

    if (!trimmedName) {
      setFormError("El nombre del cargo es obligatorio.");

      return;
    }

    /*
     * ----------------------------------------------------------
     * VALIDACIÓN DEL ÁREA
     * ----------------------------------------------------------
     */

    if (!areaId) {
      setFormError("Selecciona el área del cargo.");

      return;
    }

    /*
     * ----------------------------------------------------------
     * VALIDACIÓN DEL PERMISO
     * ----------------------------------------------------------
     */

    if (!canManage) {
      setFormError(
        isEditing
          ? "No tienes permisos para editar cargos."
          : "No tienes permisos para crear cargos.",
      );

      return;
    }

    /*
     * ----------------------------------------------------------
     * VALIDACIÓN DE ALCANCE
     * ----------------------------------------------------------
     *
     * Si el permiso es "area", el cargo debe pertenecer
     * obligatoriamente al área del usuario.
     *
     * Esto funciona independientemente de cómo se llame
     * el rol.
     */

    if (!hasAccessTotal(profile) && permissionScope === "area") {
      if (!userAreaId) {
        setFormError(
          "Tu usuario tiene un permiso limitado al área, pero no tiene un área configurada.",
        );

        return;
      }

      if (Number(areaId) !== Number(userAreaId)) {
        setFormError("Solo puedes gestionar cargos de tu área.");

        return;
      }
    }

    setFormError("");

    /*
     * ----------------------------------------------------------
     * PAYLOAD
     * ----------------------------------------------------------
     */

    const payload = {
      nombre: trimmedName,
      area_id: Number(areaId),
      descripcion: trimmedDescription,
    };

    /*
     * Seguridad adicional en frontend:
     *
     * Si el permiso es de área,
     * forzamos el área del usuario.
     *
     * El backend/service también debe validar esto.
     */

    if (!hasAccessTotal(profile) && permissionScope === "area") {
      payload.area_id = Number(userAreaId);
    }

    const result = await onSubmit(payload);

    if (!result?.success) {
      setFormError(result?.message || "No fue posible guardar el cargo.");

      return;
    }

    /*
     * ----------------------------------------------------------
     * RESET
     * ----------------------------------------------------------
     */

    setNombre("");
    setAreaId("");
    setDescripcion("");
    setFormError("");

    onOpenChange(false);
  }

  /*
   * ============================================================
   * CERRAR
   * ============================================================
   */

  function handleOpenChange(value) {
    if (loading) {
      return;
    }

    if (!value) {
      setFormError("");
    }

    onOpenChange(value);
  }

  const isLoadingData = loading || loadingAreas;

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[520px]"
      >
        <DialogHeader className="border-b border-slate-100 px-6 pt-6 pb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
              <BriefcaseBusiness className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                {isEditing ? "Editar cargo" : "Nuevo cargo"}
              </DialogTitle>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                {isEditing
                  ? "Actualiza el cargo, el área y el rol asociado."
                  : "Registra un cargo asociado a un área y a un rol institucional."}
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

          {/* =====================================================
              NOMBRE
          ====================================================== */}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="cargo-nombre" className="text-sm font-semibold text-slate-700">
                Nombre
              </label>

              <span className="text-[11px] text-slate-400">Obligatorio</span>
            </div>

            <Input
              id="cargo-nombre"
              value={nombre}
              onChange={handleNombreChange}
              required
              maxLength={150}
              autoComplete="off"
              className={inputClass}
              placeholder="Ej. ANALISTA DE RECURSOS HUMANOS"
              disabled={loading}
            />
          </div>

          {/* =====================================================
              ÁREA
          ====================================================== */}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="cargo-area" className="text-sm font-semibold text-slate-700">
                Área
              </label>

              <span className="text-[11px] text-slate-400">Obligatorio</span>
            </div>

            {isAreaScoped ? (
              <div
                className={`flex h-10 w-full items-center rounded-xl border border-slate-200 px-3 text-sm ${
                  loadingAreas ? "bg-slate-50 text-slate-400" : "bg-slate-100 text-slate-700"
                }`}
              >
                {loadingAreas ? (
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />

                    <span>Cargando áreas...</span>
                  </div>
                ) : (
                  selectedArea?.nombre || "Sin área configurada"
                )}
              </div>
            ) : (
              <div className="relative">
                <select
                  id="cargo-area"
                  value={areaId}
                  onChange={(event) => {
                    setAreaId(event.target.value);

                    clearFormError();
                  }}
                  className={inputClass}
                  required
                  disabled={loading || loadingAreas}
                >
                  <option value="">
                    {loadingAreas ? "Cargando áreas..." : "Selecciona un área"}
                  </option>

                  {availableAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nombre}
                    </option>
                  ))}
                </select>

                {loadingAreas && (
                  <span className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                )}
              </div>
            )}
          </div>

          {/* =====================================================
              DESCRIPCIÓN
          ====================================================== */}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="cargo-descripcion" className="text-sm font-semibold text-slate-700">
                Descripción
              </label>

              <span className="text-[11px] text-slate-400">Opcional</span>
            </div>

            <textarea
              id="cargo-descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              maxLength={500}
              rows={4}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm leading-5 text-slate-800 transition-all duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Describe brevemente la función del cargo..."
            />

            <div className="flex justify-end text-[11px] text-slate-400">
              {descripcion.length}/500
            </div>
          </div>

          {/* =====================================================
              BOTONES
          ====================================================== */}

          <DialogFooter className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoadingData}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>

            <ActionButton
              action="save"
              type="submit"
              loading={loading || loadingAreas}
              loadingText={loading ? "Guardando..." : "Cargando áreas..."}
              disabled={isLoadingData || !canManage}
              className="w-full sm:w-auto"
            >
              {isEditing ? "Guardar cambios" : "Guardar cargo"}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CargoFormDialog;
