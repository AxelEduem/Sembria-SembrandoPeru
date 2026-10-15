import { useEffect, useState } from "react";
import { ClipboardList, FileText, Landmark, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import IntegranteFormDraftBanner from "@/components/integrantes/form/IntegranteFormDraftBanner";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { Input } from "@/components/ui/input";
import useFormDraft from "@/hooks/useFormDraft";
import { inputClass, labelClass } from "@/constants/formConstants";
import {
  getDaysRemaining,
  validateConvocatoria,
} from "@/services/gestion-proyectos/convocatoriasService";

const blank = () => ({
  nombre: "",
  financiador_nombre: "",
  fuente_id: "",
  url_convocatoria: "",
  url_postulacion: "",
  lleva_cofinanciamiento: "",
  tipo_organizacion_admitida: "",
  fecha_apertura: "",
  tiempo_postulacion: "",
  fecha_cierre: "",
  tipo_financiamiento: "subvencion",
  moneda: "USD",
  monto_minimo: "",
  monto_maximo: "",
  sector: "medio_ambiente",
  tipo_proyecto: "piloto",
  territorio: "",
  beneficiario_ideal: "",
  tipo_alianza: "",
  estado: "registrada",
  etapa: "deteccion",
});

const sourceBlank = { nombre: "", tipo: "otra", sitio_web: "", descripcion: "" };

const FINANCING_TYPE_OPTIONS = [
  ["subvencion", "Subvención"],
  ["cofinanciamiento", "Cofinanciamiento"],
  ["otro", "Otro"],
];

const CURRENCY_OPTIONS = [
  ["USD", "USD"],
  ["PEN", "PEN"],
  ["EUR", "EUR"],
  ["OTRA", "Otra"],
];

const SECTOR_OPTIONS = [
  ["medio_ambiente", "Medio Ambiente"],
  ["salud", "Salud"],
  ["educacion", "Educación"],
  ["fauna", "Fauna"],
];

const PROJECT_TYPE_OPTIONS = [
  ["piloto", "Piloto"],
  ["investigacion", "Investigación"],
  ["fortalecimiento", "Fortalecimiento"],
  ["otro", "Otro"],
];

const ALLIANCE_TYPE_OPTIONS = [
  ["", "Selecciona un tipo de alianza"],
  ["alianza_comunitaria", "Alianza comunitaria"],
  ["alianza_institucional", "Alianza institucional"],
  ["alianza_educativa", "Alianza educativa"],
  ["investigadores", "Investigadores"],
  ["profesionales", "Profesionales"],
  ["sin_alianzas", "Sin alianzas"],
];

const TERRITORY_OPTIONS = [
  ["", "Selecciona un territorio"],
  ["Perú", "Perú"],
  ["Latam", "Latam"],
];

const BENEFICIARY_OPTIONS = [
  ["", "Selecciona un beneficiario ideal"],
  ["emprendedores", "Emprendedores"],
  ["comunidades", "Comunidades"],
  ["ongs", "ONGs"],
  ["organizaciones", "Organizaciones"],
  ["agricultores_campesinos", "Agricultores campesinos"],
  ["mas_de_un_beneficiario", "Más de 1 beneficiario"],
];

const YES_NO_OPTIONS = [
  ["", "Selecciona una opción"],
  ["1", "Sí"],
  ["0", "No"],
];

const ORGANIZATION_TYPE_OPTIONS = [
  ["", "Selecciona un tipo de organización"],
  ["ongs", "ONGs"],
  ["personas_naturales", "Personas naturales"],
  ["investigadores", "Investigadores"],
  ["empresas", "Empresas"],
  ["universidades", "Universidades"],
  ["profesionales", "Profesionales"],
  ["otro", "Otro"],
];

const APPLICATION_TIME_OPTIONS = [
  ["", "Selecciona el tiempo de postulación"],
  ["sin_limite", "Sin límite de fecha"],
  ["con_limite", "Con límite de fecha"],
];

const TEST_SCENARIOS = [
  {
    title: "Fondo de Innovación Ambiental",
    funder: "Fundación Horizonte Sostenible",
    sector: "medio_ambiente",
    projectType: "piloto",
    territory: "Perú",
    beneficiary: "comunidades",
  },
  {
    title: "Programa de Fortalecimiento Institucional",
    funder: "Alianza para el Desarrollo Regional",
    sector: "educacion",
    projectType: "fortalecimiento",
    territory: "Perú",
    beneficiary: "organizaciones",
  },
  {
    title: "Convocatoria de Proyectos de Salud Comunitaria",
    funder: "Fondo Internacional para Comunidades Saludables",
    sector: "salud",
    projectType: "investigacion",
    territory: "Latam",
    beneficiary: "mas_de_un_beneficiario",
  },
];

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function Section({ icon: Icon, color, title, description, children }) {
  return (
    <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${color}`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-x-6 gap-y-5 p-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, required, children, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className={labelClass}>
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}

function Select({ label, value, onChange, options, disabled, required }) {
  return (
    <Field label={label} required={required}>
      <select
        className={`${inputClass} cursor-pointer`}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([key, name]) => (
          <option key={key} value={key}>
            {name}
          </option>
        ))}
      </select>
    </Field>
  );
}

export default function ConvocatoriaForm({
  initial,
  fuentes,
  saving,
  canEdit = true,
  onSave,
  onAddFuente,
  onCancel,
}) {
  const draft = useFormDraft("sembria:convocatoria-draft");
  const isNew = !initial;
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...blank(),
          ...initial,
          fuente_id: String(initial.fuente_id),
          lleva_cofinanciamiento:
            initial.lleva_cofinanciamiento == null
              ? ""
              : initial.lleva_cofinanciamiento
                ? "1"
                : "0",
        }
      : blank(),
  );
  const [draftData, setDraftData] = useState(() => (isNew ? draft.loadDraft() : null));
  const [feedback, setFeedback] = useState(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [source, setSource] = useState(sourceBlank);

  useEffect(() => {
    if (!isNew || draftData) return;
    const hasContent = Object.entries(form).some(
      ([, value]) =>
        Boolean(value) &&
        value !== "registrada" &&
        value !== "deteccion" &&
        value !== "subvencion" &&
        value !== "USD" &&
        value !== "medio_ambiente" &&
        value !== "piloto",
    );
    if (hasContent) draft.saveDraft(form);
  }, [draft, draftData, form, isNew]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const days = getDaysRemaining(form.fecha_cierre);

  function applyDraft() {
    setForm((current) => ({ ...current, ...draftData }));
    setDraftData(null);
  }

  function dismissDraft() {
    setDraftData(null);
    draft.clearDraft();
  }

  function fillTestData() {
    const scenario = TEST_SCENARIOS[Math.floor(Math.random() * TEST_SCENARIOS.length)];
    const today = new Date();
    const year = today.getFullYear();
    const testId = String(Date.now()).slice(-6);
    const availableSources = Array.isArray(fuentes) ? fuentes : [];
    const selectedSource =
      availableSources[Math.floor(Math.random() * availableSources.length)] || null;

    setForm({
      ...blank(),
      nombre: `${scenario.title} ${year} · Prueba ${testId}`,
      financiador_nombre: scenario.funder,
      fuente_id: selectedSource ? String(selectedSource.id) : "",
      url_convocatoria: `https://example.org/convocatorias/${testId}`,
      url_postulacion: `https://example.org/postulaciones/${testId}`,
      lleva_cofinanciamiento: "1",
      tipo_organizacion_admitida: "ongs",
      fecha_apertura: formatInputDate(today),
      tiempo_postulacion: "con_limite",
      fecha_cierre: formatInputDate(addDays(today, 60)),
      tipo_financiamiento: FINANCING_TYPE_OPTIONS[0][0],
      moneda: CURRENCY_OPTIONS[0][0],
      monto_minimo: "50000",
      monto_maximo: "250000",
      sector: scenario.sector,
      tipo_proyecto: scenario.projectType,
      territorio: scenario.territory,
      beneficiario_ideal: scenario.beneficiary,
      tipo_alianza: "alianza_institucional",
    });
    setDraftData(null);
    setFeedback({
      type: selectedSource ? "success" : "warning",
      message: selectedSource
        ? "Datos de prueba cargados. Revisa la información antes de crear la convocatoria."
        : "Datos de prueba cargados. No hay fuentes disponibles; selecciona o crea una para continuar.",
    });
  }

  async function submit(event) {
    event.preventDefault();
    const validation = validateConvocatoria(form);
    if (validation) {
      setFeedback({ type: "error", message: validation });
      return;
    }
    try {
      const payload = { ...form };
      delete payload.descripcion;
      delete payload.monto_solicitable;
      delete payload.fuente_encontrada;
      delete payload.fuente_busqueda;
      delete payload.fuente_busqueda_otro;
      delete payload.observaciones;
      await onSave({
        ...payload,
        fuente_id: Number(form.fuente_id),
        lleva_cofinanciamiento: form.lleva_cofinanciamiento === "1",
        monto_minimo: form.monto_minimo || null,
        monto_maximo: form.monto_maximo || null,
        fecha_cierre: form.tiempo_postulacion === "sin_limite" ? null : form.fecha_cierre,
        requiere_alianza: form.tipo_alianza === "sin_alianzas" ? "no" : "si",
      });
      if (isNew) draft.clearDraft();
    } catch (saveError) {
      setFeedback({
        type: "error",
        message: saveError.message || "No se pudo guardar la convocatoria.",
      });
    }
  }

  async function createSource() {
    if (!source.nombre.trim()) {
      setFeedback({ type: "error", message: "Indica el nombre de la fuente." });
      return;
    }
    try {
      const created = await onAddFuente(source);
      set("fuente_id", String(created.id));
      setSourceOpen(false);
      setSource(sourceBlank);
      setFeedback({ type: "success", message: "Fuente de búsqueda registrada." });
    } catch (sourceError) {
      setFeedback({
        type: "error",
        message: sourceError.message || "No se pudo crear la fuente.",
      });
    }
  }

  const disabled = saving || !canEdit;

  return (
    <form onSubmit={submit} className="space-y-5">
      {import.meta.env.DEV && isNew && canEdit && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={fillTestData}
            disabled={saving}
            className="h-9 rounded-xl border-violet-200 bg-violet-50/60 px-3 text-xs font-semibold text-violet-700 shadow-none hover:bg-violet-100 hover:text-violet-800"
          >
            🧪 Llenar datos de prueba
          </Button>
        </div>
      )}

      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      {draftData && <IntegranteFormDraftBanner onContinue={applyDraft} onDismiss={dismissDraft} />}

      <Section
        icon={ClipboardList}
        color="border-emerald-100 bg-emerald-50 text-emerald-600"
        title="Información de la convocatoria"
        description="Registra los datos principales de la oportunidad de financiamiento."
      >
        <Field label="Nombre de la convocatoria" required>
          <Input
            className={inputClass}
            placeholder="E.J. Fondo de Innovación Ambiental 2026"
            value={form.nombre}
            disabled={disabled}
            onChange={(e) => set("nombre", e.target.value)}
          />
        </Field>
        <Field label="Entidad financiadora" required>
          <Input
            className={inputClass}
            placeholder="E.J. Banco Continental del Perú"
            value={form.financiador_nombre}
            disabled={disabled}
            onChange={(e) => set("financiador_nombre", e.target.value)}
          />
        </Field>
        <Field label="Fuente de búsqueda" required>
          <div className="flex gap-2">
            <select
              className={`${inputClass} cursor-pointer`}
              value={form.fuente_id}
              disabled={disabled}
              required
              onChange={(e) => set("fuente_id", e.target.value)}
            >
              <option value="">Selecciona una fuente</option>
              {fuentes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
            {canEdit && (
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 rounded-xl"
                onClick={() => setSourceOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Field>
        <Field label="Enlace de convocatoria">
          <Input
            type="url"
            className={inputClass}
            placeholder="https://ejemplo.com/convocatoria"
            value={form.url_convocatoria}
            disabled={disabled}
            onChange={(e) => set("url_convocatoria", e.target.value)}
          />
        </Field>
        <Select
          label="Tipo de Organización admitida"
          value={form.tipo_organizacion_admitida}
          disabled={disabled}
          required
          onChange={(v) => set("tipo_organizacion_admitida", v)}
          options={ORGANIZATION_TYPE_OPTIONS}
        />
        <Field label="Link de Nota concepto o formulario de postulación">
          <Input
            type="url"
            className={inputClass}
            placeholder="https://ejemplo.com/postulacion"
            value={form.url_postulacion}
            disabled={disabled}
            onChange={(e) => set("url_postulacion", e.target.value)}
          />
        </Field>
        <Select
          label="Lleva cofinanciamiento"
          value={form.lleva_cofinanciamiento}
          disabled={disabled}
          required
          onChange={(v) => set("lleva_cofinanciamiento", v)}
          options={YES_NO_OPTIONS}
        />
      </Section>

      <Section
        icon={FileText}
        color="border-blue-100 bg-blue-50 text-blue-600"
        title="Fechas y financiamiento"
        description="Define el periodo y el rango económico de la convocatoria."
      >
        <Field label="Fecha de apertura">
          <Input
            type="date"
            className={inputClass}
            value={form.fecha_apertura}
            disabled={disabled}
            onChange={(e) => set("fecha_apertura", e.target.value)}
          />
        </Field>
        <Select
          label="Tiempo de postulación"
          value={form.tiempo_postulacion}
          disabled={disabled}
          required
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              tiempo_postulacion: value,
              fecha_cierre: value === "sin_limite" ? "" : current.fecha_cierre,
            }))
          }
          options={APPLICATION_TIME_OPTIONS}
        />
        <Field label="Fecha de cierre">
          <Input
            type="date"
            className={inputClass}
            value={form.fecha_cierre}
            disabled={disabled || form.tiempo_postulacion === "sin_limite"}
            required={form.tiempo_postulacion === "con_limite"}
            onChange={(e) => set("fecha_cierre", e.target.value)}
          />
          {days !== null && (
            <p
              className={`mt-1 text-xs font-medium ${days <= 30 ? "text-amber-700" : "text-emerald-700"}`}
            >
              Faltan {days} días
            </p>
          )}
        </Field>
        <Select
          label="Tipo de financiamiento"
          value={form.tipo_financiamiento}
          disabled={disabled}
          onChange={(v) => set("tipo_financiamiento", v)}
          options={FINANCING_TYPE_OPTIONS}
        />
        <Select
          label="Moneda"
          value={form.moneda}
          disabled={disabled}
          onChange={(v) => set("moneda", v)}
          options={CURRENCY_OPTIONS}
        />
        {[
          ["monto_minimo", "Monto mínimo"],
          ["monto_maximo", "Monto máximo"],
        ].map(([key, label]) => (
          <Field key={key} label={label}>
            <Input
              type="number"
              min="0"
              className={inputClass}
              placeholder="0"
              value={form[key]}
              disabled={disabled}
              onChange={(e) => set(key, e.target.value)}
            />
          </Field>
        ))}
      </Section>

      <Section
        icon={Landmark}
        color="border-violet-100 bg-violet-50 text-violet-600"
        title="Características del proyecto"
        description="Indica el alcance y las condiciones de la oportunidad."
      >
        <Select
          label="Sector"
          value={form.sector}
          disabled={disabled}
          onChange={(v) => set("sector", v)}
          options={SECTOR_OPTIONS}
        />
        <Select
          label="Tipo de proyecto"
          value={form.tipo_proyecto}
          disabled={disabled}
          onChange={(v) => set("tipo_proyecto", v)}
          options={PROJECT_TYPE_OPTIONS}
        />
        <Select
          label="Tipo de alianza"
          value={form.tipo_alianza}
          disabled={disabled}
          required
          onChange={(v) => set("tipo_alianza", v)}
          options={ALLIANCE_TYPE_OPTIONS}
        />
        <Select
          label="Territorio elegible"
          value={form.territorio}
          disabled={disabled}
          onChange={(v) => set("territorio", v)}
          options={TERRITORY_OPTIONS}
        />
        <Select
          label="Beneficiario ideal"
          value={form.beneficiario_ideal}
          disabled={disabled}
          onChange={(v) => set("beneficiario_ideal", v)}
          options={BENEFICIARY_OPTIONS}
        />
      </Section>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">¿Todo listo?</p>
            <p className="mt-1 text-xs text-slate-400">Verifica la información antes de guardar.</p>
          </div>
          <div className="flex w-full flex-col-reverse gap-2.5 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="h-11 rounded-xl px-5"
            >
              Cancelar
            </Button>
            <ActionButton
              action={isNew ? "create" : "save"}
              type="submit"
              loading={saving}
              loadingText="Guardando..."
              disabled={!canEdit}
              className="h-11"
            >
              {isNew ? "Crear convocatoria" : "Guardar cambios"}
            </ActionButton>
          </div>
        </div>
      </div>

      {sourceOpen && (
        <Dialog open onOpenChange={setSourceOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva fuente de búsqueda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Field label="Nombre" required>
                <Input
                  className={inputClass}
                  placeholder="E.J. Fondo Verde del Clima"
                  value={source.nombre}
                  onChange={(e) => setSource((current) => ({ ...current, nombre: e.target.value }))}
                />
              </Field>
              <Select
                label="Tipo"
                value={source.tipo}
                onChange={(tipo) => setSource((current) => ({ ...current, tipo }))}
                options={[
                  ["multilateral", "Multilateral"],
                  ["embajada", "Embajada"],
                  ["empresa", "Empresa"],
                  ["promotor", "Promotor"],
                  ["otra", "Otra"],
                ]}
              />
              <Field label="Sitio web">
                <Input
                  className={inputClass}
                  type="url"
                  placeholder="https://ejemplo.com"
                  value={source.sitio_web}
                  onChange={(e) =>
                    setSource((current) => ({ ...current, sitio_web: e.target.value }))
                  }
                />
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSourceOpen(false)}>
                Cancelar
              </Button>
              <ActionButton action="create" type="button" onClick={createSource}>
                Crear fuente
              </ActionButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </form>
  );
}
