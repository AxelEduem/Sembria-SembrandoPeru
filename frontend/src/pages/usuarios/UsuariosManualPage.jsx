import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  FileSpreadsheet,
  Filter,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRoundCog,
  UserX,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const cardClass =
  "users-manual-panel-enter scroll-mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

function SectionHeader({ icon: Icon, eyebrow, title, description, color = "emerald" }) {
  const colors = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
  };

  return (
    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${colors[color]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-emerald-700 uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, children }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] text-xs font-bold text-white">
        {number}
      </span>
      <div className="pt-0.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{children}</p>
      </div>
    </div>
  );
}

function Tip({ children, tone = "emerald" }) {
  const styles = {
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    amber: "border-amber-100 bg-amber-50/70 text-amber-800",
    blue: "border-blue-100 bg-blue-50/70 text-blue-800",
  };

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-5 ${styles[tone]}`}>
      {tone === "amber" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      ) : (
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.9} />
      )}
      <p>{children}</p>
    </div>
  );
}

function PreviewField({ label, value }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold text-slate-600">{label}</p>
      <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600">
        {value}
      </div>
    </div>
  );
}

export default function UsuariosManualPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";
  const returnToModule = () => navigate(`/usuarios${listSearch}`);
  const canConfigureAccess = hasPermission(profile, PERMISSIONS.USUARIOS_CONFIGURAR_ACCESO);
  const canResetPassword = hasPermission(
    profile,
    PERMISSIONS.USUARIOS_RESTABLECER_CONTRASENA,
  );
  const canEditEmail = hasPermission(profile, PERMISSIONS.USUARIOS_EDITAR_CORREO);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.USUARIOS_DESCARGAR_EXCEL);
  const canManageUsers = canResetPassword || canEditEmail;

  const sections = useMemo(
    () =>
      [
        { id: "vista-general", label: "Vista general", icon: BookOpen },
        { id: "buscar-filtrar", label: "Buscar y filtrar", icon: Search },
        canConfigureAccess && { id: "crear-acceso", label: "Configurar acceso", icon: KeyRound },
        canManageUsers && {
          id: "administrar",
          label: "Administrar usuarios",
          icon: UserRoundCog,
        },
        canDownloadExcel && {
          id: "exportar",
          label: "Exportar a Excel",
          icon: FileSpreadsheet,
        },
        { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
      ].filter(Boolean),
    [canConfigureAccess, canDownloadExcel, canManageUsers],
  );

  const currentSection = sections.some(({ id }) => id === activeSection)
    ? activeSection
    : "vista-general";
  const sectionEyebrow = (id, label) => {
    const index = sections.findIndex((section) => section.id === id);
    return `${String(index + 1).padStart(2, "0")} · ${label}`;
  };

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <style>{`
        @keyframes usersManualPanelEnter {
          from { opacity: 0; transform: translateY(14px) scale(.988); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes usersManualContentEnter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .users-manual-panel-enter {
          transform-origin: top center;
          animation: usersManualPanelEnter 420ms cubic-bezier(.22,1,.36,1) both;
        }
        .users-manual-panel-enter > * {
          animation: usersManualContentEnter 360ms cubic-bezier(.22,1,.36,1) both;
        }
        .users-manual-panel-enter > *:nth-child(2) { animation-delay: 70ms; }
        @media (prefers-reduced-motion: reduce) {
          .users-manual-panel-enter,
          .users-manual-panel-enter > * { animation: none; }
        }
      `}</style>

      <button
        type="button"
        onClick={returnToModule}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a usuarios
      </button>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-emerald-900/10 bg-[#244C34] text-white shadow-sm">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-300/10" />
        <div className="absolute -right-4 -bottom-24 h-52 w-52 rounded-full border border-white/10" />
        <KeyRound className="absolute top-8 right-12 h-5 w-5 text-emerald-200/30" />
        <div className="relative grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <BookOpen className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <p className="text-xs font-bold tracking-[0.14em] text-emerald-200 uppercase">
              Guía de uso
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Manual del módulo de usuarios
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Aprende a crear accesos institucionales, compartir credenciales y mantener actualizados
              el correo y la contraseña de cada usuario.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">4 minutos</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)] lg:sticky lg:top-3">
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">
            Contenido
          </p>
          <nav className="space-y-1" aria-label="Contenido del manual" role="tablist">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={currentSection === id}
                aria-controls={`users-manual-${id}`}
                onClick={() => setActiveSection(id)}
                className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                  currentSection === id
                    ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#2D5A3D]"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    currentSection === id
                      ? "text-emerald-600"
                      : "text-slate-400 group-hover:text-emerald-600"
                  }`}
                  strokeWidth={1.8}
                />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 ${
                    currentSection === id ? "text-emerald-500" : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </nav>
        </aside>

        <main key={currentSection} className="min-w-0 space-y-5">
          <section
            id="users-manual-vista-general"
            role="tabpanel"
            className={`${cardClass} ${currentSection !== "vista-general" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={UserRoundCog}
              eyebrow={sectionEyebrow("vista-general", "Vista general")}
              title="¿Qué puedes hacer en este módulo?"
              description="Usuarios administra las cuentas institucionales de integrantes que ya existen en el sistema."
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                [UserX, "Usuarios sin acceso", "Consulta integrantes activos que todavía no tienen una cuenta configurada."],
                [UserCheck, "Usuarios con acceso", "Revisa cuentas configuradas, su correo institucional y el estado del acceso."],
                canConfigureAccess && [KeyRound, "Configurar acceso", "Asigna un correo institucional y una contraseña temporal segura."],
                canResetPassword && [RefreshCw, "Restablecer contraseña", "Genera una nueva contraseña temporal cuando sea necesario."],
                canEditEmail && [Mail, "Editar correo", "Actualiza el correo institucional de ingreso."],
                canDownloadExcel && [FileSpreadsheet, "Descargar Excel", "Exporta el listado visible según los filtros aplicados."],
              ].filter(Boolean).map(([Icon, title, description]) => (
                <div key={title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
                  <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <Tip tone="blue">
                Las opciones visibles dependen de tus permisos y del alcance global o por área asignado
                a tu cuenta.
              </Tip>
              <Tip tone="blue">
                Puedes presionar la fotografía de cualquier integrante para verla en tamaño grande;
                la vista se cierra con la “X”, Escape o un clic fuera de la imagen.
              </Tip>
            </div>
          </section>

          <section
            id="users-manual-buscar-filtrar"
            role="tabpanel"
            className={`${cardClass} ${currentSection !== "buscar-filtrar" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={Filter}
              eyebrow={sectionEyebrow("buscar-filtrar", "Buscar y filtrar")}
              title="Encuentra rápidamente una cuenta"
              description="Combina la vista, la búsqueda y los filtros para reducir el listado."
              color="blue"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Elige una vista">
                  Usa <strong>Usuarios con acceso</strong> para administrar cuentas existentes o
                  <strong> Usuarios sin acceso</strong> para configurar una nueva.
                </Step>
                <Step number="2" title="Busca por nombre o correo">
                  Escribe una referencia en el campo de búsqueda. Los resultados se actualizan mientras
                  escribes.
                </Step>
                <Step number="3" title="Combina filtros">
                  Puedes filtrar por área, cargo, tipo de integrante y fecha de configuración.
                </Step>
                <Step number="4" title="Limpia la consulta">
                  Presiona <strong>Limpiar filtros</strong> para volver al listado completo de la vista.
                </Step>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Search className="h-4 w-4" /> Ejemplo de búsqueda
                </div>
                <div className="flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-sm text-slate-600 ring-4 ring-emerald-500/10">
                  <Search className="h-4 w-4 text-slate-400" /> ana torres
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <PreviewField label="Área" value="Comunicaciones" />
                  <PreviewField label="Tipo" value="Voluntario" />
                </div>
                <p className="mt-3 text-[11px] leading-4 text-slate-400">
                  La URL conserva los filtros para que puedas volver al mismo listado desde el manual.
                </p>
              </div>
            </div>
          </section>

          {canConfigureAccess && (
            <section
              id="users-manual-crear-acceso"
              role="tabpanel"
              className={`${cardClass} ${currentSection !== "crear-acceso" ? "hidden" : ""}`}
            >
            <SectionHeader
              icon={KeyRound}
              eyebrow={sectionEyebrow("crear-acceso", "Configurar acceso")}
              title="Configura una cuenta institucional"
              description="El integrante debe estar activo y aparecer en la vista Usuarios sin acceso."
              color="violet"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <Step number="1" title="Abre Usuarios sin acceso">
                  Localiza al integrante y presiona <strong>Configurar acceso</strong>.
                </Step>
                <Step number="2" title="Confirma el correo">
                  Completa la parte inicial del correo. El dominio institucional
                  <strong> @sembrandoperu.org</strong> se agrega automáticamente.
                </Step>
                <Step number="3" title="Define la contraseña temporal">
                  Usa la sugerencia generada o crea otra de entre 8 y 128 caracteres.
                </Step>
                <Step number="4" title="Crea y comparte">
                  Al confirmar, el sistema crea la cuenta y copia un mensaje listo para enviar al usuario.
                </Step>
                <Tip tone="amber">
                  La contraseña es temporal y debe cambiarse durante el primer ingreso. Comparte el
                  mensaje solo con la persona correspondiente.
                </Tip>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <LockKeyhole className="h-4 w-4" /> Vista previa del formulario
                </div>
                <div className="space-y-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <PreviewField label="Correo institucional" value="ana.torres@sembrandoperu.org" />
                  <PreviewField label="Contraseña temporal" value="Sembria#482" />
                  <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2D5A3D] text-xs font-semibold text-white">
                    <KeyRound className="h-4 w-4" /> Crear acceso
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-100 bg-white/70 p-3 text-xs leading-5 text-emerald-800">
                  <Copy className="mt-0.5 h-4 w-4 shrink-0" />
                  El mensaje con el correo y la contraseña se copia automáticamente.
                </div>
              </div>
            </div>
            </section>
          )}

          {canManageUsers && (
            <section
              id="users-manual-administrar"
              role="tabpanel"
              className={`${cardClass} ${currentSection !== "administrar" ? "hidden" : ""}`}
            >
            <SectionHeader
              icon={MoreHorizontal}
              eyebrow={sectionEyebrow("administrar", "Administrar usuarios")}
              title="Actualiza las credenciales de una cuenta"
              description="El menú de tres puntos aparece para las cuentas configuradas que puedes gestionar."
              color="cyan"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="mx-auto w-full max-w-xs rounded-xl border border-slate-200 bg-white p-2 shadow-[0_12px_35px_rgba(15,23,42,0.10)]">
                {canResetPassword && (
                  <div className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-emerald-700">
                    <RefreshCw className="h-4 w-4" /> Restablecer contraseña
                  </div>
                )}
                {canEditEmail && (
                  <div className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-sky-700">
                    <Mail className="h-4 w-4" /> Editar correo
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {canResetPassword && (
                  <Step number="1" title="Restablecer contraseña">
                    Genera una nueva contraseña temporal, cierra las sesiones activas y copia las
                    nuevas credenciales al portapapeles. La contraseña anterior deja de funcionar.
                  </Step>
                )}
                {canEditEmail && (
                  <Step number={canResetPassword ? "2" : "1"} title="Editar correo">
                    Cambia el correo institucional de ingreso. La contraseña actual se mantiene sin
                    cambios.
                  </Step>
                )}
                <Step number={String(Number(canResetPassword) + Number(canEditEmail) + 1)} title="Revisa la notificación">
                  Los resultados y errores aparecen en una notificación superior. Los modales finales
                  muestran la información que puedes copiar.
                </Step>
                {canResetPassword && (
                  <Tip tone="blue">
                    Por seguridad, el sistema no puede recuperar una contraseña existente. Si se
                    perdió, utiliza <strong>Restablecer contraseña</strong>.
                  </Tip>
                )}
              </div>
            </div>
            </section>
          )}

          {canDownloadExcel && (
            <section
              id="users-manual-exportar"
              role="tabpanel"
              className={`${cardClass} ${currentSection !== "exportar" ? "hidden" : ""}`}
            >
            <SectionHeader
              icon={FileSpreadsheet}
              eyebrow={sectionEyebrow("exportar", "Exportar")}
              title="Descarga el listado en Excel"
              description="La exportación respeta la vista y todos los filtros que tengas aplicados."
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="space-y-4">
                <Step number="1" title="Prepara el listado">
                  Selecciona usuarios con o sin acceso y aplica los filtros necesarios.
                </Step>
                <Step number="2" title="Descarga el archivo">
                  Presiona <strong>Descargar Excel</strong>. Se incluirán todos los resultados filtrados,
                  no solo la página visible.
                </Step>
                <Tip tone="blue">
                  El archivo incluye datos de identificación institucional y estado del acceso. Nunca
                  exporta contraseñas.
                </Tip>
              </div>
              <div className="flex min-w-60 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/70 p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <Download className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-emerald-900">usuarios_con_acceso.xlsx</p>
                  <p className="mt-1 text-xs text-emerald-700/70">Listado filtrado</p>
                </div>
              </div>
            </div>
            </section>
          )}

          <section
            id="users-manual-recomendaciones"
            role="tabpanel"
            className={`${cardClass} ${currentSection !== "recomendaciones" ? "hidden" : ""}`}
          >
            <SectionHeader
              icon={CircleHelp}
              eyebrow={sectionEyebrow("recomendaciones", "Recomendaciones")}
              title="Buenas prácticas de seguridad"
              description="Aplica estas recomendaciones al crear y mantener cuentas institucionales."
              color="blue"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {[
                [CheckCircle2, "Verifica al integrante", "Confirma el nombre y el área antes de crear o modificar su acceso."],
                canEditEmail && [Mail, "Revisa el correo", "Usa siempre el dominio institucional y evita reutilizar direcciones de otras personas."],
                canConfigureAccess && [ShieldCheck, "Protege las credenciales", "Envía el mensaje copiado solo al titular de la cuenta y por un medio confiable."],
                canResetPassword && [RefreshCw, "Restablece cuando sea necesario", "Si una contraseña se pierde o se expone, genera una nueva inmediatamente."],
              ].filter(Boolean).map(([Icon, title, text]) => (
                <div key={title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" strokeWidth={1.8} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-sm font-semibold text-slate-800">¿Listo para comenzar?</p>
                <p className="mt-1 text-xs text-slate-500">Vuelve al módulo y aplica lo aprendido.</p>
              </div>
              <Button
                type="button"
                onClick={returnToModule}
                className="h-10 gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white hover:bg-[#234B32]"
              >
                <UserRoundCog className="h-4 w-4" /> Ir a usuarios
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
