import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppWindow, Image, Upload, X } from "lucide-react";

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

import { PERMISSIONS, getAreaId, hasAccessTotal, hasPermission } from "@/utils/permissions";

const inputClass = `
  w-full
  h-10
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

const selectClass = `
  w-full
  h-10
  cursor-pointer
  appearance-none
  rounded-xl
  border
  border-slate-200
  bg-slate-50/60
  px-3
  pr-8
  text-sm
  text-slate-800
  outline-none
  transition-all
  duration-200
  hover:border-slate-300
  focus:bg-white
  focus:border-emerald-500
  focus:ring-4
  focus:ring-emerald-500/10
  disabled:cursor-not-allowed
  disabled:bg-slate-100
  disabled:text-slate-400
`;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

function normalizeId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/**
 * Busca el permiso dinámico del perfil.
 *
 * IMPORTANTE:
 * No se utiliza el nombre del rol.
 * La fuente de autorización es:
 *
 * rol
 *   ↓
 * rol_permisos
 *   ↓
 * permisos
 *
 * El alcance puede ser:
 * - global
 * - area
 */
function getProfilePermission(profile, permissionCode) {
  if (!profile || !permissionCode) {
    return null;
  }

  return profile.permissions?.find((permission) => permission?.codigo === permissionCode) || null;
}

function getPermissionScope(profile, permissionCode) {
  if (hasAccessTotal(profile)) {
    return "global";
  }

  const permission = getProfilePermission(profile, permissionCode);

  return permission?.alcance || null;
}

function AplicacionFormDialog({
  open,
  aplicacion,
  loading,
  profile,
  areas = [],
  onOpenChange,
  onSubmit,
}) {
  const isEditing = Boolean(aplicacion);

  /*
   * ============================================================
   * PERMISOS DINÁMICOS
   * ============================================================
   */

  const canCreate = hasPermission(profile, PERMISSIONS.APLICACIONES_CREAR);

  const canEdit = hasPermission(profile, PERMISSIONS.APLICACIONES_EDITAR);

  const canManage = isEditing ? canEdit : canCreate;

  /*
   * ============================================================
   * ALCANCE DEL PERMISO
   * ============================================================
   *
   * Ya no preguntamos:
   *
   * "¿Es coordinador?"
   *
   * Preguntamos:
   *
   * "¿Cuál es el alcance del permiso?"
   *
   * Esto permite que cualquier rol creado desde la BD
   * pueda utilizar el módulo.
   */

  const permissionCode = isEditing
    ? PERMISSIONS.APLICACIONES_EDITAR
    : PERMISSIONS.APLICACIONES_CREAR;

  const permissionScope = getPermissionScope(profile, permissionCode);

  const isAreaScoped = !hasAccessTotal(profile) && permissionScope === "area";

  const currentAreaId = normalizeId(getAreaId(profile));

  const [nombre, setNombre] = useState(() => aplicacion?.nombre || "");

  const [descripcion, setDescripcion] = useState(() => aplicacion?.descripcion || "");

  const [licenciasTotal, setLicenciasTotal] = useState(() => aplicacion?.licencias_total || 1);

  const [areaId, setAreaId] = useState(() =>
    isAreaScoped ? currentAreaId : normalizeId(aplicacion?.area_id),
  );

  const [logoFile, setLogoFile] = useState(null);

  const [logoPreview, setLogoPreview] = useState(() => aplicacion?.imagen_url || "");

  const [formError, setFormError] = useState("");

  const fileInputRef = useRef(null);

  const objectUrlRef = useRef(null);

  /*
   * ============================================================
   * ÁREAS DISPONIBLES
   * ============================================================
   *
   * Acceso total / global:
   *    → todas las áreas activas
   *
   * Permiso con alcance "area":
   *    → únicamente el área del usuario
   */

  const availableAreas = useMemo(() => {
    const activeAreas = areas.filter((area) => area?.activo === true);

    if (!isAreaScoped) {
      return activeAreas;
    }

    if (!currentAreaId) {
      return [];
    }

    return activeAreas.filter((area) => normalizeId(area.id) === currentAreaId);
  }, [areas, isAreaScoped, currentAreaId]);

  const currentArea = availableAreas.find((area) => normalizeId(area.id) === currentAreaId) || null;

  /*
   * ============================================================
   * LIMPIEZA DE URL TEMPORAL
   * ============================================================
   */

  const revokeObjectUrl = useCallback(() => {
    if (!objectUrlRef.current) {
      return;
    }

    URL.revokeObjectURL(objectUrlRef.current);

    objectUrlRef.current = null;
  }, []);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const resetLogoSelection = useCallback(() => {
    revokeObjectUrl();

    setLogoFile(null);

    setLogoPreview(aplicacion?.imagen_url || "");

    resetFileInput();
  }, [aplicacion, resetFileInput, revokeObjectUrl]);

  /*
   * ============================================================
   * LIMPIAR URL AL DESMONTAR
   * ============================================================
   */

  useEffect(() => {
    return () => {
      revokeObjectUrl();
    };
  }, [revokeObjectUrl]);

  /*
   * ============================================================
   * CAMBIO DE LOGO
   * ============================================================
   */

  const handleLogoChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      setFormError("");

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setFormError("El logo debe ser JPG, PNG, WEBP o SVG.");

        event.target.value = "";

        return;
      }

      if (file.size > MAX_LOGO_SIZE) {
        setFormError("El logo no puede superar los 2 MB.");

        event.target.value = "";

        return;
      }

      revokeObjectUrl();

      const previewUrl = URL.createObjectURL(file);

      objectUrlRef.current = previewUrl;

      setLogoFile(file);

      setLogoPreview(previewUrl);
    },
    [revokeObjectUrl],
  );

  /*
   * ============================================================
   * QUITAR LOGO
   * ============================================================
   */

  const handleRemoveLogo = useCallback(() => {
    resetLogoSelection();
    setFormError("");
  }, [resetLogoSelection]);

  /*
   * ============================================================
   * GUARDAR
   * ============================================================
   */

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const trimmedName = nombre.trim();

      const total = Number(licenciasTotal);

      if (!trimmedName) {
        setFormError("El nombre de la aplicación es obligatorio.");

        return;
      }

      if (!Number.isInteger(total) || total <= 0) {
        setFormError("La cantidad de licencias debe ser mayor a cero.");

        return;
      }

      if (!canManage) {
        setFormError(
          isEditing
            ? "No tienes permisos para editar aplicaciones."
            : "No tienes permisos para crear aplicaciones.",
        );

        return;
      }

      /*
       * ========================================================
       * VALIDACIÓN DE ALCANCE
       * ========================================================
       */

      if (!hasAccessTotal(profile) && permissionScope === "area" && !currentAreaId) {
        setFormError(
          "Tu usuario tiene un permiso limitado al área, pero no tiene un área configurada.",
        );

        return;
      }

      setFormError("");

      const payload = {
        nombre: trimmedName,

        descripcion: descripcion.trim(),

        logo_file: logoFile,

        imagen_url: aplicacion?.imagen_url || "",

        licencias_total: total,
      };

      /*
       * ========================================================
       * ÁREA
       * ========================================================
       *
       * Solo se establece durante la creación,
       * igual que en el comportamiento original.
       *
       * Alcance "area":
       *    → área del usuario
       *
       * Alcance "global":
       *    → área seleccionada por el usuario
       */

      if (!isEditing) {
        let finalAreaId = normalizeId(areaId);

        if (!hasAccessTotal(profile) && permissionScope === "area") {
          finalAreaId = currentAreaId;
        }

        payload.area_id = finalAreaId;
      }

      const result = await onSubmit(payload);

      if (!result?.success) {
        setFormError(result?.message || "No fue posible guardar la aplicación.");

        return;
      }

      /*
       * ========================================================
       * RESET
       * ========================================================
       */

      setNombre("");

      setDescripcion("");

      setLicenciasTotal(1);

      setAreaId(null);

      setLogoFile(null);

      setLogoPreview("");

      setFormError("");

      revokeObjectUrl();

      resetFileInput();

      onOpenChange(false);
    },
    [
      nombre,
      licenciasTotal,
      canManage,
      isEditing,
      profile,
      permissionScope,
      currentAreaId,
      descripcion,
      logoFile,
      aplicacion,
      areaId,
      onSubmit,
      revokeObjectUrl,
      resetFileInput,
      onOpenChange,
    ],
  );

  /*
   * ============================================================
   * CAMBIO DE ESTADO DEL DIALOG
   * ============================================================
   */

  const handleOpenChange = useCallback(
    (value) => {
      if (loading) {
        return;
      }

      if (!value) {
        setFormError("");

        setLogoFile(null);

        revokeObjectUrl();

        resetFileInput();
      }

      onOpenChange(value);
    },
    [loading, onOpenChange, resetFileInput, revokeObjectUrl],
  );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[560px]"
      >
        <DialogHeader className="border-b border-slate-100 px-6 pt-6 pb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
              <AppWindow className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                {isEditing ? "Editar aplicación" : "Nueva aplicación"}
              </DialogTitle>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                {isEditing
                  ? "Actualiza los datos de la aplicación."
                  : "Define la herramienta y la cantidad de licencias disponibles."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {formError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* =====================================================
              NOMBRE + LICENCIAS
          ====================================================== */}

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div className="space-y-2">
              <label htmlFor="aplicacion-nombre" className="text-sm font-semibold text-slate-700">
                Nombre
              </label>

              <Input
                id="aplicacion-nombre"
                value={nombre}
                onChange={(event) => {
                  setNombre(event.target.value);

                  if (formError) {
                    setFormError("");
                  }
                }}
                className={inputClass}
                maxLength={150}
                placeholder="Ej. GitHub"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="aplicacion-licencias"
                className="text-sm font-semibold text-slate-700"
              >
                Licencias
              </label>

              <Input
                id="aplicacion-licencias"
                type="number"
                min="1"
                value={licenciasTotal}
                onChange={(event) => setLicenciasTotal(event.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* =====================================================
              ÁREA
          ====================================================== */}

          {!isEditing && (
            <div className="space-y-2">
              <label htmlFor="aplicacion-area" className="text-sm font-semibold text-slate-700">
                Área
              </label>

              {isAreaScoped ? (
                <div className="flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-medium text-slate-700">
                  {currentArea?.nombre || "Sin área configurada"}
                </div>
              ) : (
                <select
                  id="aplicacion-area"
                  value={areaId ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;

                    setAreaId(value ? Number(value) : null);

                    if (formError) {
                      setFormError("");
                    }
                  }}
                  className={selectClass}
                  disabled={!hasAccessTotal(profile) && permissionScope !== "global"}
                >
                  <option value="">General (sin área específica)</option>

                  {availableAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* =====================================================
              IMAGEN
          ====================================================== */}

          <div className="space-y-2">
            <label htmlFor="aplicacion-imagen" className="text-sm font-semibold text-slate-700">
              Foto
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Vista previa del logo"
                      className="h-full w-full object-contain p-2"
                      decoding="async"
                    />
                  ) : (
                    <Image className="h-7 w-7 text-slate-300" strokeWidth={1.5} />
                  )}

                  {logoFile && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={loading}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Quitar logo seleccionado"
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <input
                    ref={fileInputRef}
                    id="aplicacion-imagen"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                    disabled={loading}
                    className="hidden"
                  />

                  <label
                    htmlFor="aplicacion-imagen"
                    className={`flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/40 ${
                      loading ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <Upload className="h-4 w-4 text-emerald-700" strokeWidth={1.8} />

                    {logoFile
                      ? "Cambiar imagen"
                      : isEditing && logoPreview
                        ? "Cambiar logo"
                        : "Seleccionar imagen"}
                  </label>

                  <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
                    PNG, JPG, WEBP o SVG · máximo 2 MB
                  </p>

                  {logoFile && (
                    <p className="mt-1 truncate text-[11px] font-medium text-emerald-700">
                      {logoFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              DESCRIPCIÓN
          ====================================================== */}

          <div className="space-y-2">
            <label
              htmlFor="aplicacion-descripcion"
              className="text-sm font-semibold text-slate-700"
            >
              Descripción
            </label>

            <textarea
              id="aplicacion-descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              maxLength={500}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm leading-5 text-slate-800 transition-all duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Describe para qué se usa esta herramienta..."
            />

            <div className="flex justify-end text-[11px] text-slate-400">
              {descripcion.length}
              /500
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
              {isEditing ? "Guardar cambios" : "Guardar aplicación"}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AplicacionFormDialog;
