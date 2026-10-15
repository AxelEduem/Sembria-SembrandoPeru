import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useIntegrantes } from "@/hooks/integrantes/useIntegrantes";
import useHorarios from "@/hooks/useHorarios";
import useFormDraft from "@/hooks/useFormDraft";
import { useAuth } from "@/contexts/AuthContext";
import { getIntegranteById } from "@/services/integrantes/integrantesService";
import { validateMinimumPracticePeriodHours } from "@/services/integrantes-horarios/integrantesHorariosService";
import { hasAccessTotal } from "@/utils/permissions";
import { sanitizeName } from "@/utils/formHelpers";
import { NAME_PATTERN } from "@/constants/formConstants";

import { useIntegranteScope } from "./useIntegranteScope";
import { useIntegrantePeriod } from "./useIntegrantePeriod";

export function useIntegranteForm({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";

  const getInitialType = () => {
    return null;
  };

  const [selectedType, setSelectedType] = useState(getInitialType);
  const state = useIntegrantes(selectedType);
  const horariosState = useHorarios();
  const { loadHorarios } = horariosState;

  const scope = useIntegranteScope(profile, { mode, selectedType });
  const { canCreateVoluntario, canCreatePracticante } = scope;
  const period = useIntegrantePeriod();
  const { setFechaFin, setFechaInicio } = period;

  const { clearDraft, loadDraft, saveDraft } = useFormDraft();
  const [draftData, setDraftData] = useState(() => (mode === "create" ? loadDraft() : null));

  const [loadingRecord, setLoadingRecord] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [documentoIdentidad, setDocumentoIdentidad] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [carrera, setCarrera] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [institucionEducativa, setInstitucionEducativa] = useState("");
  const [horasPracticas, setHorasPracticas] = useState("");
  const [editableAreaId, setAreaId] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [distrito, setDistrito] = useState("");

  const isPracticante = selectedType === "practicante";
  const isGerente = selectedType === "gerente";
  const areaId =
    mode === "create" && scope.isAreaScoped && scope.userAreaId
      ? String(scope.userAreaId)
      : editableAreaId;
  const listPath = "/integrantes" + (location.state?.listSearch ?? "");

  const availableCargos = useMemo(() => scope.getAvailableCargos(areaId), [scope, areaId]);

  useEffect(() => {
    if (mode !== "edit" || !id) return;

    let mounted = true;

    getIntegranteById(id, { cacheScope })
      .then(async (row) => {
        if (!mounted) return;

        setSelectedType(row.tipo_integrante || "voluntario");
        setNombres(sanitizeName(row.nombres));
        setApellidos(sanitizeName(row.apellidos));
        setFechaNacimiento(row.fecha_nacimiento || "");
        setDocumentoIdentidad(row.documento_identidad || "");
        setTipoDocumento(row.tipo_documento || "");
        setTelefono(row.telefono || "");
        setCarrera(row.carrera || "");
        setCiclo(row.ciclo || "");
        setModalidad(row.modalidad || "");
        setInstitucionEducativa(row.institucion_educativa || "");
        setHorasPracticas(String(row.horas_practicas_requeridas || ""));
        setCargoId(String(row.cargo_id || ""));
        setAreaId(String(row.cargo_area_id || ""));
        setDepartamento(row.departamento || "");
        setCiudad(row.ciudad || "");
        setDistrito(row.distrito || "");

        setFechaInicio(row.fecha_inicio || "");
        setFechaFin(row.fecha_fin || "");

        await loadHorarios(row.historial_id);
      })
      .catch((error) => {
        if (mounted) {
          setFormError(error.message || "No se pudo cargar el integrante.");
        }
      })
      .finally(() => {
        if (mounted) setLoadingRecord(false);
      });

    return () => {
      mounted = false;
    };

  }, [cacheScope, id, mode, loadHorarios, setFechaFin, setFechaInicio]);

  useEffect(() => {
    if (mode !== "create" || draftData) return;

    const payload = {
      selectedType,
      nombres,
      apellidos,
      fechaNacimiento,
      documentoIdentidad,
      tipoDocumento,
      telefono,
      modalidad,
      carrera,
      ciclo,
      institucionEducativa,
      horasPracticas,
      areaId,
      cargoId,
      departamento,
      ciudad,
      distrito,
      fechaInicio: period.fechaInicio,
      fechaFin: period.fechaFin,
      horarios: horariosState.horarios,
    };

    const hasContent = Object.values(payload).some((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value),
    );

    if (hasContent) saveDraft(payload);
    else clearDraft();

  }, [
    mode,
    draftData,
    selectedType,
    nombres,
    apellidos,
    fechaNacimiento,
    documentoIdentidad,
    tipoDocumento,
    telefono,
    modalidad,
    carrera,
    ciclo,
    institucionEducativa,
    horasPracticas,
    areaId,
    cargoId,
    departamento,
    ciudad,
    distrito,
    period.fechaInicio,
    period.fechaFin,
    horariosState.horarios,
    clearDraft,
    saveDraft,
  ]);

  function applyDraft() {
    if (!draftData) return;

    const draftType = draftData.selectedType || null;
    const allowedDraftType =
      !draftType || (draftType === "practicante" ? canCreatePracticante : canCreateVoluntario);

    setSelectedType(allowedDraftType ? draftType : getInitialType());
    setNombres(draftData.nombres || "");
    setApellidos(draftData.apellidos || "");
    setFechaNacimiento(draftData.fechaNacimiento || "");
    setDocumentoIdentidad(draftData.documentoIdentidad || "");
    setTipoDocumento(draftData.tipoDocumento || "");
    setTelefono(draftData.telefono || "");
    setModalidad(draftData.modalidad || "");
    setCarrera(draftData.carrera || "");
    setCiclo(draftData.ciclo || "");
    setInstitucionEducativa(draftData.institucionEducativa || "");
    setHorasPracticas(draftData.horasPracticas || "");
    setAreaId(draftData.areaId || "");
    setCargoId(draftData.cargoId || "");
    setDepartamento(draftData.departamento || "");
    setCiudad(draftData.ciudad || "");
    setDistrito(draftData.distrito || "");
    if (draftData.fechaInicio) period.setFechaInicio(draftData.fechaInicio);
    if (draftData.fechaFin) period.setFechaFin(draftData.fechaFin);
    if (Array.isArray(draftData.horarios) && draftData.horarios.length) {
      horariosState.setHorarioLocal(draftData.horarios);
    }

    setDraftData(null);
  }

  function dismissDraft() {
    setDraftData(null);
    clearDraft();
  }

  function handleTypeChange(type) {
    if (mode !== "create") return;

    const allowed = type === "practicante" ? canCreatePracticante : canCreateVoluntario;
    if (!allowed) return;

    if (type !== selectedType && (type === "gerente" || selectedType === "gerente")) {
      horariosState.clearHorario();
    }

    setSelectedType(type);
    setFormError("");
  }

  function updateArea(value) {
    if (scope.isAreaScoped && scope.userAreaId && Number(value) !== Number(scope.userAreaId)) {
      setFormError("Solo puedes gestionar integrantes de tu área.");
      return;
    }

    setAreaId(value);
    setCargoId("");
    setFormError("");
  }

  function updateFechaInicio(value) {
    period.setFechaInicio(value);
    setFormError("");
  }

  function updateFechaFin(value) {
    period.setFechaFin(value);
    setFormError("");
  }

  function applyQuickPeriod(months) {
    period.applyQuickPeriod(months, {
      disabled: submitting || state.saving,
    });
    setFormError("");
  }

  function showValidationError(message, fieldId = "") {
    setFormError("");

    window.requestAnimationFrame(() => {
      setFormError(message);

      if (!fieldId) return;
      const field = document.getElementById(fieldId);
      field?.focus();
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting || state.saving) return;

    setFormError("");

    if (mode === "create" && !selectedType) {
      return showValidationError(
        "Debes seleccionar el tipo de integrante: voluntario, practicante o gerente.",
      );
    }

    if (!scope.canManageCurrentType) {
      setFormError(
        mode === "edit"
          ? "No tienes permisos para editar este tipo de integrante."
          : "No tienes permisos para crear este tipo de integrante.",
      );
      return;
    }

    const trimmedNames = nombres.trim();
    const trimmedLastNames = apellidos.trim();
    const birthDate = fechaNacimiento ? new Date(`${fechaNacimiento}T00:00:00`) : null;

    if (!trimmedNames) {
      return showValidationError("Los nombres son obligatorios.", "integrante-nombres");
    }
    if (!NAME_PATTERN.test(trimmedNames)) {
      return showValidationError(
        "Los nombres solo pueden contener letras y espacios.",
        "integrante-nombres",
      );
    }
    if (!trimmedLastNames) {
      return showValidationError("Los apellidos son obligatorios.", "integrante-apellidos");
    }
    if (!NAME_PATTERN.test(trimmedLastNames)) {
      return showValidationError(
        "Los apellidos solo pueden contener letras y espacios.",
        "integrante-apellidos",
      );
    }
    if (!birthDate) {
      return showValidationError(
        "La fecha de nacimiento es obligatoria.",
        "integrante-fecha-nacimiento",
      );
    }
    if (birthDate > new Date()) {
      return showValidationError(
        "La fecha de nacimiento no puede ser futura.",
        "integrante-fecha-nacimiento",
      );
    }
    if (!tipoDocumento) {
      return showValidationError(
        "Debes seleccionar un tipo de documento.",
        "integrante-tipo-documento",
      );
    }
    if (!documentoIdentidad.trim()) {
      return showValidationError(
        "El número de documento es obligatorio.",
        "integrante-documento-identidad",
      );
    }
    if (!telefono.trim()) {
      return showValidationError("El número de teléfono es obligatorio.", "integrante-telefono");
    }
    if (!modalidad.trim()) {
      return showValidationError("Debes seleccionar una modalidad.", "integrante-modalidad");
    }
    if (!areaId) {
      return showValidationError("Debes seleccionar un área.", "integrante-area");
    }

    if (!hasAccessTotal(profile) && scope.isAreaScoped) {
      if (!scope.userAreaId) {
        return setFormError(
          "Tu usuario tiene un permiso limitado al área, pero no tiene un área configurada.",
        );
      }
      if (Number(areaId) !== Number(scope.userAreaId)) {
        return setFormError("Solo puedes gestionar integrantes de tu área.");
      }
    }

    if (!cargoId) {
      return showValidationError("Debes seleccionar un cargo.", "integrante-cargo");
    }

    const selectedCargo = (scope.cargos || []).find((c) => String(c.id) === String(cargoId));
    if (!selectedCargo) {
      return setFormError("El cargo seleccionado no existe o no está disponible.");
    }
    if (Number(selectedCargo.area_id) !== Number(areaId)) {
      return setFormError("El cargo seleccionado no pertenece al área indicada.");
    }

    if (isPracticante && !carrera.trim()) {
      return showValidationError("La carrera es obligatoria para practicantes.");
    }
    if (isPracticante && !ciclo.trim()) {
      return showValidationError("El ciclo es obligatorio para practicantes.");
    }
    if (isPracticante && !institucionEducativa.trim()) {
      return showValidationError("La institución educativa es obligatoria para practicantes.");
    }
    if (
      isPracticante &&
      (!Number.isInteger(Number(horasPracticas)) || Number(horasPracticas) <= 0)
    ) {
      return showValidationError(
        "Las horas de prácticas requeridas deben ser un número entero mayor que cero.",
        "integrante-horas-practicas",
      );
    }

    if (!period.fechaInicio) {
      return showValidationError(
        "La fecha de inicio del periodo es obligatoria.",
        "integrante-fecha-inicio",
      );
    }
    if (!isGerente && !period.fechaFin) {
      return showValidationError(
        "La fecha de fin del periodo es obligatoria.",
        "integrante-fecha-fin",
      );
    }

    if (!horariosState.horarios.length) {
      return setFormError("Debes establecer al menos un bloque de horario.");
    }

    const minimumHoursError = horariosState.validateMinimumHours(horariosState.horarios);
    if (minimumHoursError) return setFormError(minimumHoursError);

    const blocksError = horariosState.validateBlocks(horariosState.horarios);
    if (blocksError) return setFormError(blocksError);

    if (isPracticante) {
      const periodHoursError = validateMinimumPracticePeriodHours(
        horariosState.horarios,
        period.fechaInicio,
        period.fechaFin,
        horasPracticas,
      );
      if (periodHoursError) return setFormError(periodHoursError);
    }

    const input = {
      nombres: trimmedNames.toLocaleUpperCase(),
      apellidos: trimmedLastNames.toLocaleUpperCase(),
      fecha_nacimiento: fechaNacimiento,
      documento_identidad: documentoIdentidad.trim(),
      tipo_documento: tipoDocumento,
      telefono: telefono.trim(),
      modalidad: modalidad.trim(),
      cargo_id: Number(cargoId),
      fecha_inicio: period.fechaInicio,
      fecha_fin: isGerente ? null : period.fechaFin,
      periodo_meses: isGerente ? null : period.periodMonths,
      institucion_educativa: isPracticante ? institucionEducativa.trim() : null,
      carrera: isPracticante ? carrera.trim() : null,
      ciclo: isPracticante ? ciclo.trim() : null,
      horas_practicas_requeridas: isPracticante ? Number(horasPracticas) : null,
      departamento: departamento.trim(),
      ciudad: ciudad.trim(),
      distrito: distrito.trim(),
    };

    setSubmitting(true);

    try {
      const result =
        mode === "edit"
          ? await state.updateIntegrante(id, input)
          : await state.createIntegrante(input);

      if (!result?.success) {
        setFormError(result?.message || "No fue posible guardar el integrante.");
        return;
      }


      const savedHistorialId =
        result.data?.historial_id ||
        result.data?.historial_actual?.id ||
        result.integrante?.historial_id ||
        result.integrante?.historial_actual?.id;

      const shouldSaveHorario = mode === "create" || horariosState.hasHorarioChanges();

      try {
        if (shouldSaveHorario) {
          await horariosState.saveAll(savedHistorialId, horariosState.horarios);
        }
      } catch (error) {
        const prefix =
          mode === "create"
            ? "El integrante fue creado, pero el horario no pudo guardarse."
            : "El integrante fue actualizado, pero el horario no pudo guardarse.";

        setFormError(`${prefix} ${error.message || "Verifica el horario e intenta nuevamente."}`);
        return;
      }

      if (mode === "create") clearDraft();

      navigate(listPath, {
        state: {
          feedback: {
            type: "success",
            message:
              mode === "edit"
                ? "Integrante actualizado correctamente."
                : "Integrante creado correctamente.",
          },
        },
      });
    } finally {
      setSubmitting(false);
    }
  }

  return {
    mode,
    id,
    profile,
    state,
    horariosState,
    scope,
    period,

    loadingRecord,
    submitting,
    formError,
    setFormError,

    selectedType,
    setSelectedType,

    nombres,
    setNombres,
    apellidos,
    setApellidos,
    fechaNacimiento,
    setFechaNacimiento,
    documentoIdentidad,
    setDocumentoIdentidad,
    tipoDocumento,
    setTipoDocumento,
    telefono,
    setTelefono,
    carrera,
    setCarrera,
    ciclo,
    setCiclo,
    modalidad,
    setModalidad,
    areaId,
    setAreaId,
    cargoId,
    setCargoId,
    institucionEducativa,
    setInstitucionEducativa,
    horasPracticas,
    setHorasPracticas,

    departamento,
    setDepartamento,
    ciudad,
    setCiudad,
    distrito,
    setDistrito,

    isPracticante,
    isGerente,

    canCreateVoluntario,
    canCreatePracticante,
    canManageCurrentType: scope.canManageCurrentType,
    isAreaScoped: scope.isAreaScoped,
    userAreaId: scope.userAreaId,
    allowedAreas: scope.allowedAreas,
    availableCargos,
    cargos: scope.cargos,

    periodMonths: period.periodMonths,
    activeQuickPeriod: period.activeQuickPeriod,
    fechaInicio: period.fechaInicio,
    fechaFin: period.fechaFin,

    handleTypeChange,
    updateArea,
    updateFechaInicio,
    updateFechaFin,
    applyQuickPeriod,

    draftData,
    applyDraft,
    dismissDraft,

    submit,
    navigate,
    listPath,
  };
}
