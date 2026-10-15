import {
  AlertTriangle,
  AppWindow,
  ArrowLeft,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  Image,
  Lightbulb,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const cardClass =
  "module-section-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]";

const toneClasses = {
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  violet: "border-violet-100 bg-violet-50 text-violet-700",
};

function SectionHeader({ icon: Icon, number, title, description, tone = "emerald" }) {
  return (
    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3.5">
        <div
          className={
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border " +
            toneClasses[tone]
          }
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-emerald-700 uppercase">
            {number}
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
    <div className={"flex items-start gap-2.5 rounded-xl border px-4 py-3 " + styles[tone]}>
      {tone === "amber" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="text-sm leading-5">{children}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <Icon className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
      <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{children}</p>
    </div>
  );
}

function ApplicationPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1.2fr_1fr_.65fr] bg-slate-50 px-4 py-2.5 text-[8px] font-bold tracking-wider text-slate-400 uppercase">
        <span>Aplicación</span>
        <span>Área</span>
        <span>Estado</span>
      </div>
      <div className="grid grid-cols-[1.2fr_1fr_.65fr] items-center gap-2 border-t border-slate-100 px-4 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
            <AppWindow className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">GitHub</p>
            <p className="mt-0.5 text-[9px] text-slate-400">10 licencias</p>
          </div>
        </div>
        <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">
          Tecnología
        </span>
        <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
          Activo
        </span>
      </div>
    </div>
  );
}

export default function AplicacionesManualPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("vista-general");
  const listSearch = location.state?.listSearch || "";
  const canCreate = hasPermission(profile, PERMISSIONS.APLICACIONES_CREAR);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.APLICACIONES_DESCARGAR_EXCEL);
  const sections = useMemo(
    () =>
      [
        { id: "vista-general", label: "Vista general", icon: BookOpen },
        { id: "buscar-filtrar", label: "Buscar y filtrar", icon: Filter },
        canCreate && { id: "registrar", label: "Registrar aplicación", icon: Plus },
        canCreate && { id: "administrar", label: "Editar y administrar", icon: MoreHorizontal },
        canDownloadExcel && { id: "exportar", label: "Exportar a Excel", icon: FileSpreadsheet },
        { id: "permisos", label: "Permisos y alcance", icon: ShieldCheck },
        canCreate && { id: "recomendaciones", label: "Recomendaciones", icon: Lightbulb },
      ].filter(Boolean),
    [canCreate, canDownloadExcel],
  );
  const currentSection = sections.some(({ id }) => id === activeSection)
    ? activeSection
    : "vista-general";
  const sectionEyebrow = (id, label) => {
    const index = sections.findIndex((section) => section.id === id);
    return `${String(index + 1).padStart(2, "0")} · ${label}`;
  };
  const overviewItems = [
    [Search, "Consultar", "Localiza herramientas y revisa su información principal."],
    canCreate && [Plus, "Registrar", "Añade aplicaciones generales o vinculadas a un área."],
    canCreate && [Pencil, "Actualizar", "Mantén vigentes los datos, licencias y el logo."],
    canCreate && [Power, "Controlar", "Activa o desactiva herramientas sin borrar su historial."],
    canDownloadExcel && [
      FileSpreadsheet,
      "Exportar",
      "Descarga el catálogo según los filtros aplicados.",
    ],
  ].filter(Boolean);
  const permissionItems = [
    [Search, "Ver módulo de aplicaciones", "Consulta el catálogo autorizado."],
    canCreate && [
      Plus,
      "Crear aplicaciones",
      "Registra, edita y cambia el estado de aplicaciones autorizadas.",
    ],
    canDownloadExcel && [
      FileSpreadsheet,
      "Descargar Excel",
      "Exporta las aplicaciones visibles según los filtros.",
    ],
  ].filter(Boolean);
  const returnToApplications = () => navigate("/aplicaciones" + listSearch);
  const panelClass = (id) => cardClass + (currentSection !== id ? " hidden" : "");

  return (
    <div className="module-page-enter mx-auto max-w-7xl pb-10">
      <button
        type="button"
        onClick={returnToApplications}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a aplicaciones
      </button>

      <header className="relative mb-5 overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-[#244C34] to-[#2D6A48] text-white shadow-sm">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-200/10" />
        <div className="absolute -right-4 -bottom-24 h-52 w-52 rounded-full border border-white/10" />
        <AppWindow className="absolute top-8 right-12 h-5 w-5 text-emerald-200/40" />
        <div className="relative grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold tracking-[0.14em] text-emerald-100 uppercase">
              Guía de uso
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Manual del módulo de aplicaciones
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Consulta únicamente las guías de las funciones habilitadas para tu cuenta y su alcance
              autorizado.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs font-semibold text-emerald-100">Tiempo estimado</p>
            <p className="mt-1 text-lg font-bold">4 minutos</p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-3">
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
                onClick={() => setActiveSection(id)}
                className={
                  "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all " +
                  (currentSection === id
                    ? "translate-x-0.5 bg-emerald-50 text-emerald-800 shadow-[inset_3px_0_0_#2D5A3D]"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800")
                }
              >
                <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              </button>
            ))}
          </nav>
        </aside>

        <main key={currentSection} className="min-w-0">
          <section
            id="applications-manual-vista-general"
            role="tabpanel"
            className={panelClass("vista-general")}
          >
            <SectionHeader
              icon={AppWindow}
              number={sectionEyebrow("vista-general", "Vista general")}
              title="¿Para qué sirve este módulo?"
              description="Centraliza las aplicaciones y licencias que utiliza la organización."
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                {overviewItems.map(([Icon, title, text]) => (
                  <FeatureCard key={title} icon={Icon} title={title}>
                    {text}
                  </FeatureCard>
                ))}
              </div>
              <div>
                <ApplicationPreview />
                <p className="mt-3 text-[11px] leading-5 text-slate-400">
                  La tabla muestra logo, nombre, descripción, área, licencias, estado y creación.
                  Presenta cinco aplicaciones por página.
                </p>
              </div>
            </div>
          </section>

          <section
            id="applications-manual-buscar-filtrar"
            role="tabpanel"
            className={panelClass("buscar-filtrar")}
          >
            <SectionHeader
              icon={Filter}
              number={sectionEyebrow("buscar-filtrar", "Buscar y filtrar")}
              title="Encuentra rápidamente una aplicación"
              description="Combina criterios para reducir el listado y conservar tu consulta al navegar."
              tone="blue"
            />
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <Step number="1" title="Busca por nombre">
                  Escribe el nombre completo o una parte, por ejemplo, GitHub, Canva o Drive.
                </Step>
                <Step number="2" title="Selecciona el área">
                  Muestra únicamente las herramientas generales o vinculadas al área elegida.
                </Step>
                <Step number="3" title="Define estado y fecha">
                  Filtra aplicaciones activas o inactivas y, si lo necesitas, por fecha de creación.
                </Step>
                <Step number="4" title="Restablece la vista">
                  Usa <strong>Limpiar filtros</strong> para regresar al listado completo.
                </Step>
              </div>
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">Ejemplo de búsqueda</p>
                <div className="flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-sm text-slate-600 ring-4 ring-emerald-500/10">
                  <Search className="h-4 w-4 text-slate-400" /> Canva
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                    Comunicaciones
                  </span>
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                    Activo
                  </span>
                </div>
                {canDownloadExcel && (
                  <Tip tone="blue">
                    El Excel utilizará exactamente las aplicaciones visibles según los filtros.
                  </Tip>
                )}
              </div>
            </div>
          </section>

          {canCreate && (
            <section
              id="applications-manual-registrar"
              role="tabpanel"
              className={panelClass("registrar")}
            >
              <SectionHeader
                icon={Plus}
                number={sectionEyebrow("registrar", "Registrar aplicación")}
                title="Añade una nueva herramienta al catálogo"
                description="Presiona “Nueva aplicación” y completa la información necesaria."
                tone="violet"
              />
              <div className="p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["1", "Nombre", "Es obligatorio y admite hasta 150 caracteres."],
                    ["2", "Licencias", "Indica una cantidad entera mayor que cero."],
                    ["3", "Área", "Selecciona un área o déjala como General."],
                    ["4", "Logo", "Adjunta JPG, PNG, WEBP o SVG de hasta 2 MB."],
                    ["5", "Descripción", "Explica el propósito en hasta 500 caracteres."],
                    ["6", "Guardar", "Revisa la información y confirma el registro."],
                  ].map(([number, title, text]) => (
                    <div
                      key={number}
                      className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">
                        {number}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <Upload className="h-5 w-5 shrink-0 text-emerald-700" />
                    <p className="text-sm text-emerald-900">
                      El logo muestra una vista previa antes de guardarse.
                    </p>
                  </div>
                  <Tip tone="blue">
                    Con alcance de área, el sistema asigna tu área automáticamente.
                  </Tip>
                </div>
              </div>
            </section>
          )}

          {canCreate && (
            <section
              id="applications-manual-administrar"
              role="tabpanel"
              className={panelClass("administrar")}
            >
              <SectionHeader
                icon={MoreHorizontal}
                number={sectionEyebrow("administrar", "Editar y administrar")}
                title="Usa el menú de acciones de cada fila"
                description="Las opciones dependen del estado de la aplicación y de tus permisos."
                tone="amber"
              />
              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="mx-auto w-full max-w-xs rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  {[
                    [Pencil, "Editar", "text-emerald-700"],
                    [Power, "Desactivar", "text-amber-700"],
                    [Check, "Activar", "text-emerald-700"],
                  ].map(([Icon, label, color]) => (
                    <div
                      key={label}
                      className={
                        "flex h-10 items-center gap-2.5 rounded-lg px-3 text-xs font-medium " +
                        color
                      }
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <Step number="1" title="Abre el menú">
                    Presiona los tres puntos. Solo aparecen acciones que puedes ejecutar.
                  </Step>
                  <Step number="2" title="Edita la información">
                    Actualiza nombre, licencias, descripción o logo. El área se conserva.
                  </Step>
                  <Step number="3" title="Desactiva sin eliminar">
                    La herramienta deja de estar disponible para nuevas asignaciones, pero conserva
                    su información.
                  </Step>
                  <Step number="4" title="Reactiva cuando sea necesario">
                    Filtra por inactivas, abre el menú y selecciona <strong>Activar</strong>.
                  </Step>
                  <Tip tone="amber">
                    Activar y desactivar requieren confirmación y son acciones reversibles.
                  </Tip>
                </div>
              </div>
            </section>
          )}

          {canDownloadExcel && (
            <section
              id="applications-manual-exportar"
              role="tabpanel"
              className={panelClass("exportar")}
            >
              <SectionHeader
                icon={FileSpreadsheet}
                number={sectionEyebrow("exportar", "Exportar a Excel")}
                title="Descarga un reporte del catálogo"
                description="El archivo refleja la búsqueda y los filtros aplicados."
                tone="blue"
              />
              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.8fr]">
                <div className="space-y-4">
                  <Step number="1" title="Prepara el resultado">
                    Aplica nombre, área, estado y fecha según el reporte requerido.
                  </Step>
                  <Step number="2" title="Revisa la tabla">
                    Confirma que las aplicaciones visibles correspondan a tu consulta.
                  </Step>
                  <Step number="3" title="Descarga el archivo">
                    Presiona <strong>Descargar Excel</strong> para generar{" "}
                    <strong>aplicaciones.xls</strong>.
                  </Step>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
                  <FileSpreadsheet className="h-8 w-8 text-emerald-700" />
                  <p className="mt-4 text-sm font-semibold text-emerald-900">
                    Contenido del archivo
                  </p>
                  <p className="mt-2 text-xs leading-5 text-emerald-800/75">
                    Nombre, descripción, área, estado, licencias, dirección del logo y creación.
                  </p>
                  <div className="mt-4 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
                    aplicaciones.xls
                  </div>
                </div>
              </div>
            </section>
          )}

          <section
            id="applications-manual-permisos"
            role="tabpanel"
            className={panelClass("permisos")}
          >
            <SectionHeader
              icon={ShieldCheck}
              number={sectionEyebrow("permisos", "Permisos y alcance")}
              title="Comprende qué acciones están disponibles"
              description="La interfaz adapta botones y registros según los permisos de tu rol."
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {permissionItems.map(([Icon, title, text]) => (
                  <FeatureCard key={title} icon={Icon} title={title}>
                    {text}
                  </FeatureCard>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                <Tip tone="blue">
                  Con alcance global puedes consultar todo el catálogo. Con alcance de área, solo
                  ves las aplicaciones de tu área y las generales; las acciones permitidas respetan
                  ese mismo alcance.
                </Tip>
                <Tip tone="amber">
                  Si no ves un botón o acción, verifica los permisos asignados a tu rol.
                </Tip>
              </div>
            </div>
          </section>

          {canCreate && (
            <section
              id="applications-manual-recomendaciones"
              role="tabpanel"
              className={panelClass("recomendaciones")}
            >
              <SectionHeader
                icon={Lightbulb}
                number={sectionEyebrow("recomendaciones", "Recomendaciones")}
                title="Mantén un catálogo claro y confiable"
                description="Un registro consistente facilita la asignación y control de accesos."
                tone="amber"
              />
              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                {[
                  [CheckCircle2, "Evita duplicados", "Busca la herramienta antes de registrarla."],
                  [
                    Image,
                    "Usa logos legibles",
                    "Prefiere imágenes cuadradas, livianas y con buen contraste.",
                  ],
                  [
                    Building2,
                    "Asigna el área correcta",
                    "Usa General solo si corresponde a toda la organización.",
                  ],
                  [
                    Power,
                    "Desactiva en lugar de duplicar",
                    "Reactiva el registro cuando vuelva a utilizarse.",
                  ],
                ].map(([Icon, title, text]) => (
                  <div
                    key={title}
                    className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-sm font-semibold text-slate-800">¿Listo para continuar?</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Vuelve para consultar o administrar el catálogo.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={returnToApplications}
                  className="h-10 gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white hover:bg-[#234B32]"
                >
                  <AppWindow className="h-4 w-4" /> Ir a aplicaciones
                </Button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
