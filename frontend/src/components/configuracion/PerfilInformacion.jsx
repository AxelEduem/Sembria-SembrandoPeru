import { Briefcase, CalendarDays, Mail, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import CopyValueButton from "@/components/ui/CopyValueButton";

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
  shadow-none
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

function PerfilInformacion({
  profile,
  user,
  area,
  loadingAreas,
  nombres,
  apellidos,
  onNombresChange,
  onApellidosChange,
}) {
  const correo = user?.email || profile?.correo || "";

  /*
   * ============================================================
   * ÁREA
   * ============================================================
   */

  const areaNombre =
    area?.nombre ||
    profile?.area?.nombre ||
    profile?.cargo?.area?.nombre ||
    "Sin área asignada";

  /*
   * ============================================================
   * CARGO
   * ============================================================
   */

  const cargoNombre = profile?.cargo?.nombre || "Sin cargo";

  /*
   * ============================================================
   * FECHA DE CREACIÓN
   * ============================================================
   */

  const fechaCreacion = profile?.created_at || user?.created_at || null;

  const fechaCreacionFormateada = fechaCreacion
    ? new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(fechaCreacion))
    : "No disponible";

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-800">
          Información personal
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Estos datos corresponden al perfil institucional autenticado.
        </p>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-2">
        {/* ===================================================
            NOMBRES
        ==================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="config-nombres"
            className="text-sm font-medium text-slate-700"
          >
            Nombres
          </label>

          <Input
            id="config-nombres"
            value={nombres}
            onChange={(event) => onNombresChange(event.target.value)}
            className={inputClass}
            placeholder="Ingrese sus nombres"
          />
        </div>

        {/* ===================================================
            APELLIDOS
        ==================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="config-apellidos"
            className="text-sm font-medium text-slate-700"
          >
            Apellidos
          </label>

          <Input
            id="config-apellidos"
            value={apellidos}
            onChange={(event) => onApellidosChange(event.target.value)}
            className={inputClass}
            placeholder="Ingrese sus apellidos"
          />
        </div>

        {/* ===================================================
            ÁREA
        ==================================================== */}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Área</label>

          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
            <MapPin
              className="h-4 w-4 shrink-0 text-slate-400"
              strokeWidth={1.8}
            />

            <span className="truncate">
              {loadingAreas ? "Cargando área..." : areaNombre}
            </span>
          </div>
        </div>

        {/* ===================================================
            CARGO
        ==================================================== */}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Cargo</label>

          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
            <Briefcase
              className="h-4 w-4 shrink-0 text-slate-400"
              strokeWidth={1.8}
            />

            <span className="truncate">{cargoNombre}</span>
          </div>
        </div>

        {/* ===================================================
            CORREO ELECTRÓNICO
        ==================================================== */}

        <div className="space-y-2">
          <label
            htmlFor="config-correo"
            className="text-sm font-medium text-slate-700"
          >
            Correo electrónico
          </label>

          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />

            <Input
              id="config-correo"
              type="email"
              value={correo}
              readOnly
              aria-readonly="true"
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pr-10 pl-9 text-sm text-slate-500 shadow-none focus:border-slate-200 focus:ring-0"
            />

            <CopyValueButton
              value={correo}
              label="correo"
              className="absolute top-1/2 right-2 -translate-y-1/2"
            />
          </div>

          <p className="text-[11px] leading-4 text-slate-400">
            El correo se administra desde la cuenta institucional.
          </p>
        </div>

        {/* ===================================================
            FECHA DE CREACIÓN
        ==================================================== */}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Fecha de creación
          </label>

          <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
            <CalendarDays
              className="h-4 w-4 shrink-0 text-slate-400"
              strokeWidth={1.8}
            />

            <span>{fechaCreacionFormateada}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerfilInformacion;
