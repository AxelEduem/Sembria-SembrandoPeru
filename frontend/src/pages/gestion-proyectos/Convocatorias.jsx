import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import ExcelIcon from "@/components/ui/ExcelIcon";
import FeedbackToast from "@/components/ui/FeedbackToast";
import ManualButton from "@/components/ui/ManualButton";
import TablePagination from "@/components/ui/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import {
  CONVOCATORIA_PROCESS_STAGES,
  getVisibleConvocatoriaProcessStages,
  getConvocatoriaProcessData,
  getConvocatoriaProcessStage,
} from "@/constants/convocatoriaProcess";
import { useAuth } from "@/contexts/AuthContext";
import useConvocatoriasUrlFilters, {
  CONVOCATORIA_PROCESS_DEFAULT,
} from "@/hooks/gestion-proyectos/useConvocatoriasUrlFilters";
import { useConvocatorias } from "@/hooks/useConvocatorias";
import {
  getDaysRemaining,
  getEligibilityResult,
  getEvaluacionesPorFiltro,
  getResultadoElegibilidadActual,
  formatConvocatoriaOption,
  isFiltroCompletado,
} from "@/services/gestion-proyectos/convocatoriasService";
import { downloadExcel, formatExcelDate } from "@/utils/excelExport";
import { hasAccessTotal, hasPermission, PERMISSIONS } from "@/utils/permissions";

const PAGE_SIZE = 7;

const labels = {
  elegible: "Elegible",
  pendiente_revision: "Pendiente",
  no_viable: "No viable",
};

const display = (value) => String(value || "-").replaceAll("_", " ");

const registrantName = (item) => {
  const person = item.registrante?.persona;
  const fullName = [person?.nombres, person?.apellidos].filter(Boolean).join(" ").trim();

  return fullName || "No disponible";
};

const labelOf = (key) =>
  CONVOCATORIA_PROCESS_STAGES.find((stage) => stage.key === key)?.label || key;

const evaluationReviewer = (evaluations) => {
  const person = evaluations.find((evaluation) => evaluation.revisor?.persona)?.revisor?.persona;
  return [person?.nombres, person?.apellidos].filter(Boolean).join(" ") || "No disponible";
};

const approvalData = (item) =>
  Array.isArray(item.aprobacion) ? item.aprobacion[0] : item.aprobacion;

const generalStatus = (item) => {
  if (item.resultado_final === "adjudicada") return "Adjudicada";
  if (item.resultado_final === "no_adjudicada") return "No adjudicada";
  if (item.resultado_final === "descartada") return "Descartada";
  const firstResult = getEligibilityResult(
    getEvaluacionesPorFiltro(item.evaluaciones, "primer_filtro"),
  );
  const secondResult = getEligibilityResult(
    getEvaluacionesPorFiltro(item.evaluaciones, "segundo_filtro"),
  );
  const approval = approvalData(item);

  if (firstResult === "no_viable" || secondResult === "no_viable" || approval?.decision === "rechazada") {
    return "No aprobada";
  }
  if (approval?.decision === "aprobada") return "Aprobada";
  return "Pendiente";
};

const processWhereEnded = (item) => {
  const firstResult = getEligibilityResult(
    getEvaluacionesPorFiltro(item.evaluaciones, "primer_filtro"),
  );

  const secondResult = getEligibilityResult(
    getEvaluacionesPorFiltro(item.evaluaciones, "segundo_filtro"),
  );

  const approval = approvalData(item);
  const postulation = item.processData?.postulacion;

  // Si la postulación ya fue enviada, el proceso actual es Seguimiento.
  // El envío queda como etapa completada.
  if (postulation?.estado === "enviada") {
    return "Seguimiento";
  }

  if (item.processData?.seguimiento) {
    return "Seguimiento";
  }

  if (firstResult === "no_viable") return "Primer filtro";
  if (secondResult === "no_viable") return "Segundo filtro";
  if (approval?.decision === "rechazada") return "Aprobación";

  if (postulation?.estado === "lista_para_enviar") {
    return "Envío a equipo IDEAR";
  }

  if (postulation) {
    return "Postulación";
  }

  if (item.etapa && !["cierre", "deteccion"].includes(item.etapa)) {
    return labelOf(item.etapa);
  }

  return "Primer filtro";
};

const currentProcessLabel = (item) => {
  const postulation = item.processData?.postulacion;

  // Una postulación enviada siempre está en Seguimiento.
  if (postulation?.estado === "enviada") {
    return "Seguimiento";
  }

  if (item.processStage === "registro") {
    return "Primer filtro";
  }

  if (item.processStage === "cierre") {
    return processWhereEnded(item);
  }

  return labelOf(item.processStage);
};

const approvalReviewer = (item) => {
  const person = approvalData(item)?.decisor?.persona;
  return [person?.nombres, person?.apellidos].filter(Boolean).join(" ") || "No disponible";
};

const formatFunding = (item) => {
  const amount = item.monto_maximo;
  if (amount == null || amount === "") return "Monto no especificado";

  return `${item.moneda || ""} ${new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 2,
  }).format(Number(amount))}`.trim();
};

const formatDateOnly = (value) =>
  value ? formatExcelDate(String(value).slice(0, 10)) : "No definida";

const postulationStatus = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  en_revision: "Lista para enviar",
  lista_para_enviar: "Lista para enviar",
  enviada: "Enviada",
  cancelada: "Cancelada",
};

const followUpStatus = {
  en_seguimiento: "En seguimiento",
  requiere_respuesta: "Requiere respuesta",
  resultado_registrado: "Resultado registrado",
  cerrado: "Cerrado",
};

function GeneralStatusBadge({ status }) {
  const styles = {
    Aprobada: "border-emerald-100 bg-emerald-50 text-emerald-700",
    Adjudicada: "border-emerald-100 bg-emerald-50 text-emerald-700",
    Pendiente: "border-amber-100 bg-amber-50 text-amber-700",
    "No aprobada": "border-red-100 bg-red-50 text-red-700",
    "No adjudicada": "border-red-100 bg-red-50 text-red-700",
    Descartada: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <Badge variant="outline" className={styles[status] || styles.Pendiente}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ["Aprobada", "Adjudicada"].includes(status)
            ? "bg-emerald-500"
            : ["No aprobada", "No adjudicada"].includes(status)
              ? "bg-red-500"
              : "bg-amber-500"
        }`}
      />
      {status}
    </Badge>
  );
}

function ReviewStatusBadge({ completed, result }) {
  const passed = completed && ["elegible", "aprobada"].includes(result);
  const failed = completed && ["no_viable", "rechazada"].includes(result);
  const label = result === "aprobada"
    ? "Completada · Aprobada"
    : result === "rechazada"
      ? "Completada · No aprobada"
      : passed
        ? "Completada · Cumplió"
    : failed
        ? "Completada · No cumplió"
        : completed
          ? "Revisión completada"
          : "Pendiente";

  return (
    <Badge
      variant="outline"
      className={
        passed || (completed && !failed)
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : failed
            ? "border-red-100 bg-red-50 text-red-700"
          : "border-amber-100 bg-amber-50 text-amber-700"
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          passed || (completed && !failed)
            ? "bg-emerald-500"
            : failed
              ? "bg-red-500"
              : "bg-amber-500"
        }`}
      />
      {label}
    </Badge>
  );
}

function getExcelRows(rows) {
  return {
    headers: [
      "Convocatoria",
      "Financiador",
      "Fuente",
      "Sector",
      "Cierre",
      "Elegibilidad",
      "Estado",
      "Proceso",
    ],

    data: rows.map((item) => [
      item.nombre,
      item.financiador_nombre,
      item.fuente?.nombre,
      display(item.sector),
      formatExcelDate(item.fecha_cierre),
      labels[getResultadoElegibilidadActual(item.evaluaciones)],
      generalStatus(item),
      currentProcessLabel(item),
    ]),
  };
}

function EligibilityBadge({ eligibility }) {
  const config = {
    elegible: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-100",
      dot: "bg-emerald-500",
      label: "Elegible",
    },
    no_viable: {
      bg: "bg-red-50",
      text: "text-red-700",
      ring: "ring-red-100",
      dot: "bg-red-500",
      label: "No viable",
    },
    pendiente_revision: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-100",
      dot: "bg-amber-500",
      label: "Pendiente",
    },
  }[eligibility] || {
    bg: "bg-slate-50",
    text: "text-slate-600",
    ring: "ring-slate-200",
    dot: "bg-slate-400",
    label: "Sin estado",
  };

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${config.bg} ${config.text} ${config.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function ApprovalTableRow({ item, index, open }) {
  const firstFilter = getEvaluacionesPorFiltro(item.evaluaciones, "primer_filtro");
  const secondFilter = getEvaluacionesPorFiltro(item.evaluaciones, "segundo_filtro");
  const approval = approvalData(item);

  return (
    <tr
      style={{ animationDelay: `${index * 45}ms` }}
      className="module-row-enter border-t border-slate-100 text-slate-600 transition-colors hover:bg-slate-50/60"
    >
      <td className="px-3 py-4 text-left">
        <span className="line-clamp-2 font-semibold text-slate-800">{item.nombre}</span>
        <span className="mt-1 block text-xs leading-4 text-slate-400">
          Registrado por {registrantName(item)}
        </span>
      </td>
      <td className="px-3 py-4 text-left">
        <p className="line-clamp-2 font-medium text-slate-700">
          {item.financiador_nombre || "-"}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-slate-400">
          {item.fuente?.nombre || "Sin fuente"}
        </p>
      </td>
      <td className="px-3 py-4 text-left capitalize">
        <p>{display(item.sector)}</p>
        <p className="mt-1 text-xs text-slate-400">{display(item.tipo_proyecto)}</p>
      </td>
      <td className="px-3 py-4 text-left">
        <p className="line-clamp-2 font-medium">{item.territorio || "No especificado"}</p>
        <p className="mt-1 text-xs text-slate-400">
          Alianza: {formatConvocatoriaOption(item.tipo_alianza)}
        </p>
      </td>
      <td className="px-3 py-4 text-center">
        <p className="whitespace-nowrap">{formatExcelDate(item.fecha_cierre)}</p>
        <p className="mt-1 whitespace-nowrap text-xs text-slate-400">{formatFunding(item)}</p>
      </td>
      <td className="px-3 py-4 text-center">
        <ReviewStatusBadge
          completed={isFiltroCompletado(firstFilter)}
          result={getEligibilityResult(firstFilter)}
        />
        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
          {evaluationReviewer(firstFilter)}
        </p>
      </td>
      <td className="px-3 py-4 text-center">
        <ReviewStatusBadge
          completed={isFiltroCompletado(secondFilter)}
          result={getEligibilityResult(secondFilter)}
        />
        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
          {evaluationReviewer(secondFilter)}
        </p>
      </td>
      <td className="px-3 py-4 text-center">
        <ReviewStatusBadge
          completed={Boolean(approval?.decision)}
          result={approval?.decision}
        />
        {approval && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-400">
            {approvalReviewer(item)}
          </p>
        )}
      </td>
      <td className="px-3 py-4 text-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
          aria-label={`Ver detalle de ${item.nombre}`}
          onClick={() => open(item)}
        >
          <Eye className="h-4 w-4" strokeWidth={1.8} />
        </Button>
      </td>
    </tr>
  );
}

function ProcessStatusBadge({ status, kind = "neutral" }) {
  const styles = {
    success: "border-emerald-100 bg-emerald-50 text-emerald-700",
    warning: "border-amber-100 bg-amber-50 text-amber-700",
    danger: "border-red-100 bg-red-50 text-red-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <Badge variant="outline" className={styles[kind]}>
      {status}
    </Badge>
  );
}

function WorkflowTableRow({ item, index, open, process }) {
  const postulation = item.processData.postulacion;
  const followUp = item.processData.seguimiento;
  const approval = approvalData(item);
  const firstFilter = getEvaluacionesPorFiltro(item.evaluaciones, "primer_filtro");
  const secondFilter = getEvaluacionesPorFiltro(item.evaluaciones, "segundo_filtro");
  const firstResult = getEligibilityResult(firstFilter);
  const secondResult = getEligibilityResult(secondFilter);
  const cells = (() => {
    const convocatoria = (
      <td className="px-3 py-4 text-left">
        <span className="line-clamp-2 font-semibold text-slate-800">{item.nombre}</span>
        <span className="mt-1 block text-xs text-slate-400">
          Registrado por {registrantName(item)}
        </span>
      </td>
    );
    const financer = (
      <td className="px-3 py-4 text-left">
        <p className="line-clamp-2 font-medium text-slate-700">{item.financiador_nombre || "-"}</p>
        <p className="mt-1 line-clamp-1 text-xs text-slate-400">
          {item.fuente?.nombre || "Sin fuente"}
        </p>
      </td>
    );

    if (["postulacion", "envio"].includes(process)) {
      return (
        <>
          {convocatoria}
          {financer}
          <td className="px-3 py-4 text-center">{formatDateOnly(postulation?.fecha_limite || item.fecha_cierre)}</td>
          <td className="px-3 py-4 text-center whitespace-nowrap">{formatFunding(item)}</td>
          <td className="px-3 py-4 text-center">{formatDateOnly(postulation?.fecha_inicio)}</td>
          <td className="px-3 py-4 text-center">
            <ProcessStatusBadge
              status={postulationStatus[postulation?.estado] || "Pendiente de iniciar"}
              kind={postulation?.estado === "lista_para_enviar" ? "success" : "warning"}
            />
          </td>
        </>
      );
    }

    if (process === "seguimiento") {
      return (
        <>
          {convocatoria}
          {financer}
          <td className="px-3 py-4 text-left">
            <p>{postulation?.lider_idear_nombre || "Sin líder IDEAR"}</p>
            <p className="mt-1 text-xs text-slate-400">
              {formatDateOnly(postulation?.fecha_identificacion)}
            </p>
          </td>
          <td className="px-3 py-4 text-center capitalize">
            {postulation?.rango_postulacion
              ? formatConvocatoriaOption(postulation.rango_postulacion)
              : "Sin rango"}
          </td>
          <td className="px-3 py-4 text-center">{formatDateOnly(followUp?.fecha_estimada_decision)}</td>
          <td className="px-3 py-4 text-center">
            <ProcessStatusBadge
              status={followUpStatus[followUp?.estado] || "En seguimiento"}
              kind={followUp?.estado === "requiere_respuesta" ? "warning" : "neutral"}
            />
          </td>
        </>
      );
    }

    const closeReason = item.resultado_final
      ? item.resultado_final === "descartada" && item.motivo_descarte
        ? item.motivo_descarte
        : display(item.resultado_final)
      : followUp?.tipo_resultado
      ? display(followUp.tipo_resultado)
      : approval?.decision === "rechazada"
        ? "No aprobada"
        : secondResult === "no_viable"
          ? "No cumplió el segundo filtro"
          : firstResult === "no_viable"
            ? "No cumplió el primer filtro"
            : display(item.estado);
    const closeStage = processWhereEnded(item);
    const closeDate = item.cerrada_at || followUp?.fecha_cierre || followUp?.fecha_resultado || item.updated_at;

    return (
      <>
        {convocatoria}
        {financer}
        <td className="px-3 py-4 text-center font-medium text-slate-700">{closeStage}</td>
        <td className="px-3 py-4 text-left font-medium">{closeReason}</td>
        <td className="px-3 py-4 text-center">{formatDateOnly(closeDate)}</td>
        <td className="px-3 py-4 text-center">
          <GeneralStatusBadge status={generalStatus(item)} />
        </td>
      </>
    );
  })();

  return (
    <tr
      style={{ animationDelay: `${index * 45}ms` }}
      className="module-row-enter border-t border-slate-100 text-slate-600 transition-colors hover:bg-slate-50/60"
    >
      {cells}
      <td className="px-3 py-4 text-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
          aria-label={`Ver detalle de ${item.nombre}`}
          onClick={() => open(item)}
        >
          <Eye className="h-4 w-4" strokeWidth={1.8} />
        </Button>
      </td>
    </tr>
  );
}

export default function Convocatorias() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_DESCARGAR_EXCEL);

  const { convocatorias, equipoContexto, loading, error } = useConvocatorias();

  const { readInitialFilters, readInitialProcess, writeFiltersToUrl } =
    useConvocatoriasUrlFilters();

  const [filters, setFilters] = useState(() => readInitialFilters());

  const [process, setProcess] = useState(() => readInitialProcess());

  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState(location.state?.feedback || null);

  const searchTimerRef = useRef(null);
  const lastFiltersRef = useRef(filters);

  const visibleProcessStages = useMemo(
    () => getVisibleConvocatoriaProcessStages(profile),
    [profile],
  );

  const selectedProcess = visibleProcessStages.some((stage) => stage.key === process)
    ? process
    : visibleProcessStages[0]?.key || CONVOCATORIA_PROCESS_DEFAULT;

  useEffect(() => {
    // Mantiene las bandejas y filtros coherentes al usar atrás/adelante o una URL compartida.
    queueMicrotask(() => {
      setFilters(readInitialFilters());
      setProcess(readInitialProcess());
    });
  }, [location.search, readInitialFilters, readInitialProcess]);

  useEffect(() => {
    const previous = lastFiltersRef.current;

    const searchOnly =
      filters.search !== previous.search &&
      Object.entries(filters).every(([key, value]) => key === "search" || value === previous[key]);

    lastFiltersRef.current = filters;

    clearTimeout(searchTimerRef.current);

    searchTimerRef.current = window.setTimeout(
      () =>
        writeFiltersToUrl(filters, selectedProcess, {
          replace: searchOnly,
        }),
      searchOnly ? 300 : 0,
    );

    return () => clearTimeout(searchTimerRef.current);
  }, [filters, selectedProcess, writeFiltersToUrl]);

  const classified = useMemo(
    () =>
      convocatorias.map((item) => ({
        ...item,
        processStage: getConvocatoriaProcessStage(item),
        processData: getConvocatoriaProcessData(item),
      })),
    [convocatorias],
  );

  const rows = useMemo(
    () =>
      classified.filter((item) => {
        // ============================================================
        // Filtro por bandeja con reglas especiales
        // ============================================================
        const matchesProcess = (() => {
          // Registro: acceso total consulta todas; los demás conservan solo las propias.
          if (selectedProcess === "registro") {
            return hasAccessTotal(profile) || String(item.registrada_por) === String(profile?.id);
          }

          // Primer filtro: únicamente convocatorias pendientes de esta revisión.
          // Las que cumplen avanzan a Segundo filtro y las que no cumplen pasan a Cierre.
          if (selectedProcess === "primer_filtro") {
            return item.processStage === "primer_filtro" && item.primer_filtro_autorizado === true;
          }

          if (selectedProcess === "segundo_filtro") {
            return item.processStage === "segundo_filtro";
          }

          // Desde aprobación, cada bandeja contiene únicamente su etapa actual.
          // Al avanzar, la convocatoria deja la bandeja anterior y pasa a la siguiente.
          return item.processStage === selectedProcess;
        })();

        if (!matchesProcess) return false;

        const eligibility = getResultadoElegibilidadActual(item.evaluaciones);

        const query = `${item.nombre || ""} ${item.financiador_nombre || ""}`.toLowerCase();

        return (
          (!filters.search || query.includes(filters.search.toLowerCase())) &&
          (!filters.fuente || String(item.fuente_id) === filters.fuente) &&
          (!filters.sector || item.sector === filters.sector) &&
          (!filters.estado || item.estado === filters.estado) &&
          (!filters.etapa || item.etapa === filters.etapa) &&
          (!filters.elegibilidad || eligibility === filters.elegibilidad) &&
          (!filters.cierre || item.fecha_cierre === filters.cierre)
        );
      }),
    [classified, filters, selectedProcess, profile],
  );

  const selectProcess = (key) => {
    setProcess(key);

    setFilters((current) => ({
      ...current,
      etapa: "",
    }));
  };

  const open = (item, suffix = "") =>
    navigate(
      `/gestion-proyectos/detecta/convocatorias/${item.id}${suffix}${
        !suffix ? `?vista=${selectedProcess}` : ""
      }`,
      {
      state: {
        listSearch: location.search,
        sourceProcess: selectedProcess,
      },
      },
    );

  const exportCurrent = async () => {
    if (exporting || loading || !rows.length) return;

    setExporting(true);

    try {
      await downloadExcel(getExcelRows(rows), `convocatorias-${selectedProcess}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const tableKey = `${selectedProcess}-${JSON.stringify(filters)}`;

  return (
    <div className="module-page-enter pb-6">
      {/* =========================================================
          CABECERA DE ACCIONES
          ========================================================= */}
      <section className="module-section-enter module-enter-delay-1 mb-4 flex flex-wrap items-center justify-end gap-3">
        <div className="flex flex-wrap justify-end gap-2">
          <ManualButton
            to="/gestion-proyectos/detecta/convocatorias/manual"
            state={{ listSearch: location.search }}
          />

          {canDownloadExcel && <Button
            type="button"
            variant="outline"
            onClick={exportCurrent}
            disabled={exporting || loading || !rows.length}
            className="h-10 gap-2 rounded-xl"
          >
            <ExcelIcon className="h-4 w-4" />

            {exporting ? "Exportando..." : "Descargar Excel"}
          </Button>}

          {selectedProcess === "registro" &&
            hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_CREAR) && (
              <Button
                type="button"
                onClick={() => {
                  if (!equipoContexto?.puede_registrar) {
                    setFeedback({ type: "warning", message: "Debes estar asignado a un equipo antes de registrar una convocatoria." });
                    return;
                  }
                  navigate("/gestion-proyectos/detecta/convocatorias/nueva", {
                    state: {
                      listSearch: location.search,
                    },
                  });
                }}
                className="h-10 gap-2 rounded-xl bg-[#2D5A3D] text-white hover:bg-[#234B32]"
              >
                <Plus className="h-4 w-4" />
                Registrar convocatoria
              </Button>
            )}
        </div>
      </section>

      {/* =========================================================
          NAVEGACIÓN DE PROCESOS
          ========================================================= */}
      <nav
        aria-label="Procesos de convocatorias"
        className="module-section-enter module-enter-delay-1 mb-5 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
      >
        <div className="w-full overflow-x-auto">
          <div className="flex min-w-[980px] items-center px-2 py-2 sm:min-w-0 sm:px-3">
            {visibleProcessStages.map((stage, index) => {
              const isActive = selectedProcess === stage.key;
              const isLast = index === visibleProcessStages.length - 1;

              return (
                <div key={stage.key} className="flex min-w-0 flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => selectProcess(stage.key)}
                    aria-current={isActive ? "step" : undefined}
                    className={`relative flex h-12 min-w-0 flex-1 items-center justify-center rounded-xl px-2 text-center transition-all duration-200 ${
                      isActive
                        ? "bg-[#2D5A3D] text-white shadow-[0_3px_10px_rgba(45,90,61,0.16)]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span className="truncate text-[12px] font-semibold sm:text-[13px]">
                      {stage.label}
                    </span>
                  </button>

                  {!isLast && (
                    <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-slate-200" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* =========================================================
          ERROR
          ========================================================= */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =========================================================
          CONTENIDO
          ========================================================= */}
      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />

          <p className="text-sm font-medium text-slate-700">Cargando convocatorias</p>
        </section>
      ) : (
        <TrayTable
          key={tableKey}
          process={selectedProcess}
          rows={rows}
          open={open}
        />
      )}
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}

function TrayTable({ process, rows, open }) {
  const [currentPage, setCurrentPage] = useState(1);
  const isSummaryTable = process === "registro";
  const isFirstFilterTable = process === "primer_filtro";
  const isSecondFilterTable = process === "segundo_filtro";
  const isFilterTable = isFirstFilterTable || isSecondFilterTable;
  const isApprovalTable = process === "aprobacion";
  const isWorkflowTable = ["postulacion", "envio", "seguimiento", "cierre"].includes(process);
  const hasDetailAction = isSummaryTable || isFilterTable;

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const paginatedRows = rows.slice(startIndex, endIndex);

  const startRow = totalItems ? startIndex + 1 : 0;
  const endRow = Math.min(endIndex, totalItems);

  const headers = isSummaryTable
      ? [
          { label: "Convocatoria", align: "left" },
          { label: "Financiador", align: "center" },
          { label: "Sector", align: "center" },
          { label: "Cierre", align: "center" },
          { label: "Estado", align: "center" },
          { label: "Acciones", align: "center" },
        ]
      : isFirstFilterTable
        ? [
            { label: "Registrado por", align: "left" },
            { label: "Convocatoria", align: "left" },
            { label: "Financiador y fuente", align: "left" },
            { label: "Beneficiario ideal", align: "left" },
            { label: "Sector y tipo", align: "left" },
            { label: "Territorio", align: "left" },
            { label: "Alianza", align: "center" },
            { label: "Cierre", align: "center" },
            ...(isSecondFilterTable
              ? [{ label: "Primer filtro aprobado por", align: "left" }]
              : []),
            { label: "Revisión", align: "center" },
            { label: "Acciones", align: "center" },
          ]
        : isSecondFilterTable
          ? [
              { label: "Convocatoria", align: "left" },
              { label: "Financiador y fuente", align: "left" },
              { label: "Sector y tipo", align: "left" },
              { label: "Alcance", align: "left" },
              { label: "Alianza", align: "center" },
              { label: "Cierre", align: "center" },
              { label: "Primer filtro", align: "center" },
              { label: "Revisión", align: "center" },
              { label: "Acciones", align: "center" },
            ]
          : isApprovalTable
            ? [
                { label: "Convocatoria", align: "left" },
                { label: "Financiador y fuente", align: "left" },
                { label: "Sector y tipo", align: "left" },
                { label: "Alcance", align: "left" },
                { label: "Cierre y monto", align: "center" },
                { label: "Primer filtro", align: "center" },
                { label: "Segundo filtro", align: "center" },
                { label: "Revisión", align: "center" },
                { label: "Acciones", align: "center" },
              ]
            : process === "postulacion"
              ? [
                  { label: "Convocatoria", align: "left" },
                  { label: "Financiador y fuente", align: "left" },
                  { label: "Fecha límite", align: "center" },
                  { label: "Monto", align: "center" },
                  { label: "Inicio", align: "center" },
                  { label: "Estado de postulación", align: "center" },
                  { label: "Acciones", align: "center" },
                ]
              : process === "envio"
                ? [
                    { label: "Convocatoria", align: "left" },
                    { label: "Financiador y fuente", align: "left" },
                    { label: "Fecha límite", align: "center" },
                    { label: "Monto", align: "center" },
                    { label: "Inicio", align: "center" },
                    { label: "Preparación para IDEAR", align: "center" },
                    { label: "Acciones", align: "center" },
                  ]
                : process === "seguimiento"
                  ? [
                      { label: "Convocatoria", align: "left" },
                      { label: "Financiador y fuente", align: "left" },
                      { label: "Líder IDEAR", align: "left" },
                      { label: "Rango de postulación", align: "center" },
                      { label: "Respuesta estimada", align: "center" },
                      { label: "Estado", align: "center" },
                      { label: "Acciones", align: "center" },
                    ]
                  : process === "cierre"
                    ? [
                        { label: "Convocatoria", align: "left" },
                        { label: "Financiador y fuente", align: "left" },
                        { label: "Finalizó en", align: "center" },
                        { label: "Resultado o motivo", align: "left" },
                        { label: "Fecha de cierre", align: "center" },
                        { label: "Estado", align: "center" },
                        { label: "Acciones", align: "center" },
                      ]
            : [
                { label: "Convocatoria", align: "left" },
                { label: "Financiador", align: "center" },
                { label: "Sector", align: "center" },
                { label: "Cierre", align: "center" },
                { label: "Elegibilidad", align: "center" },
                { label: "Estado", align: "center" },
                { label: "Detalle", align: "center" },
              ];

  return (
    <section
      key={process}
      className="module-section-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
    >
      <div className="overflow-x-auto">
        <Table
          className={`w-full text-sm ${isFirstFilterTable ? "min-w-[1200px]" : isSecondFilterTable || isApprovalTable || isWorkflowTable ? "table-fixed" : "min-w-[880px]"}`}
        >
          <thead>
            <tr className="bg-slate-50/70">
              {headers.map(({ label, align }) => (
                <th
                  key={label}
                  className={`px-4 py-3.5 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase ${
                    isSecondFilterTable || isApprovalTable || isWorkflowTable ? "whitespace-normal" : "whitespace-nowrap"
                  } ${
                    align === "center" ? "text-center" : "text-left"
                  }`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedRows.map((item, index) => {
              if (isApprovalTable) {
                return <ApprovalTableRow key={item.id} item={item} index={index} open={open} />;
              }

              if (isWorkflowTable) {
                return (
                  <WorkflowTableRow
                    key={item.id}
                    item={item}
                    index={index}
                    open={open}
                    process={process}
                  />
                );
              }

              const eligibility = getResultadoElegibilidadActual(item.evaluaciones);
              const registeredBy = registrantName(item);
              const firstFilterEvaluations = getEvaluacionesPorFiltro(
                item.evaluaciones,
                "primer_filtro",
              );
              const secondFilterEvaluations = getEvaluacionesPorFiltro(
                item.evaluaciones,
                "segundo_filtro",
              );

              const detail = ["postulacion", "envio"].includes(item.processStage)
                ? display(item.processData.postulacion?.estado)
                : item.processStage === "seguimiento"
                  ? display(item.processData.seguimiento?.estado)
                  : item.processStage === "cierre"
                    ? item.resultado_final || item.processData.seguimiento?.tipo_resultado || display(item.estado)
                    : "Pendiente";

              const daysRemaining = getDaysRemaining(item.fecha_cierre);

              return (
                <tr
                  key={item.id}
                  role={hasDetailAction ? undefined : "link"}
                  tabIndex={hasDetailAction ? undefined : 0}
                  onClick={hasDetailAction ? undefined : () => open(item)}
                  onKeyDown={hasDetailAction ? undefined : (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      open(item);
                    }
                  }}
                  aria-label={hasDetailAction ? undefined : `Abrir convocatoria ${item.nombre}`}
                  style={{
                    animationDelay: `${index * 45}ms`,
                  }}
                  className={`module-row-enter border-t border-slate-100 text-slate-600 transition-colors hover:bg-slate-50/60 ${hasDetailAction ? "" : "cursor-pointer focus:bg-emerald-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"}`}
                >
                  {isFirstFilterTable && (
                    <td className="px-4 py-4 text-left font-medium text-slate-700">
                      <span className="line-clamp-2">{registeredBy}</span>
                    </td>
                  )}

                  <td className="px-4 py-4 text-left font-semibold text-slate-800">
                    <span className="line-clamp-2">{item.nombre}</span>
                    {isSecondFilterTable && (
                      <span className="mt-1 block text-xs leading-4 font-normal text-slate-400">
                        Registrado por {registeredBy}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <p className={isFilterTable ? "text-left font-medium text-slate-700" : ""}>
                      {item.financiador_nombre || "-"}
                    </p>
                    {isFilterTable && (
                      <p className="mt-1 text-left text-xs text-slate-400">
                        {item.fuente?.nombre || "Sin fuente"}
                      </p>
                    )}
                  </td>

                  {isFirstFilterTable && (
                    <td className="px-4 py-4 text-left text-slate-600">
                      <span className="line-clamp-2">
                        {item.beneficiario_ideal
                          ? formatConvocatoriaOption(item.beneficiario_ideal)
                          : "No especificado"}
                      </span>
                    </td>
                  )}

                  <td className={`px-4 py-4 capitalize ${isFilterTable ? "text-left" : "text-center"}`}>
                    <p>{display(item.sector)}</p>
                    {isFilterTable && (
                      <p className="mt-1 text-xs text-slate-400">
                        {display(item.tipo_proyecto)}
                      </p>
                    )}
                  </td>

                  {isFilterTable && (
                    <>
                      <td className="px-4 py-4 text-left text-slate-600">
                        <span className="line-clamp-2 font-medium">
                          {item.territorio || "No especificado"}
                        </span>
                        {isSecondFilterTable && (
                          <span className="mt-1 line-clamp-2 text-xs leading-4 text-slate-400">
                            {item.beneficiario_ideal
                              ? formatConvocatoriaOption(item.beneficiario_ideal)
                              : "Beneficiario no especificado"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center capitalize text-slate-600">
                        {formatConvocatoriaOption(item.tipo_alianza)}
                      </td>
                    </>
                  )}

                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <span className="text-slate-600">
                      {formatExcelDate(item.fecha_cierre)}
                    </span>
                    {!isSummaryTable && !isFilterTable && daysRemaining != null && (
                      <span className="text-xs font-bold text-[#2D5A3D]">
                        {" "}
                        {daysRemaining}
                      </span>
                    )}
                  </td>

                  {!isSummaryTable && !isFilterTable && (
                    <td className="px-4 py-4 text-center">
                      <EligibilityBadge eligibility={eligibility} />
                    </td>
                  )}

                  {isSecondFilterTable && (
                    <td className="px-4 py-4 text-center">
                      <ReviewStatusBadge
                        completed={isFiltroCompletado(firstFilterEvaluations)}
                        result={getEligibilityResult(firstFilterEvaluations)}
                      />
                      <span className="mt-1 block line-clamp-2 text-xs text-slate-400">
                        {evaluationReviewer(firstFilterEvaluations)}
                      </span>
                    </td>
                  )}

                  {isFilterTable && (
                    <td className="px-4 py-4 text-center">
                      <ReviewStatusBadge
                        completed={isFiltroCompletado(
                          isSecondFilterTable
                            ? secondFilterEvaluations
                            : firstFilterEvaluations,
                        )}
                        result={getEligibilityResult(
                          isSecondFilterTable
                            ? secondFilterEvaluations
                            : firstFilterEvaluations,
                        )}
                      />
                    </td>
                  )}

                  {!isFilterTable && (
                    <td className="px-4 py-4 text-center capitalize">
                      {isSummaryTable ? (
                        <GeneralStatusBadge status={generalStatus(item)} />
                      ) : (
                        display(item.estado)
                      )}
                    </td>
                  )}

                  {hasDetailAction && (
                    <td className="px-4 py-4 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                        aria-label={`Ver detalle de ${item.nombre}`}
                        onClick={() => open(item)}
                      >
                        <Eye className="h-4 w-4" strokeWidth={1.8} />
                      </Button>
                    </td>
                  )}

                  {!isFilterTable && !isSummaryTable && (
                    <td className="px-4 py-4 text-center capitalize">
                      {detail}
                    </td>
                  )}

                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td colSpan={headers.length} className="px-6 py-14 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No encontramos convocatorias para esta bandeja y filtros.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Intenta modificar los filtros o registra una nueva convocatoria.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <TablePagination
        currentPage={safeCurrentPage}
        endRow={endRow}
        itemLabel="convocatorias"
        onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
        startRow={startRow}
        totalItems={totalItems}
        totalPages={totalPages}
      />

    </section>
  );
}
