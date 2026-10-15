import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useHorarios from "@/hooks/useHorarios";
import { useAuth } from "@/contexts/AuthContext";
import { getIntegranteById, rehireIntegrante } from "@/services/integrantes/integrantesService";
import { validateMinimumPracticePeriodHours } from "@/services/integrantes-horarios/integrantesHorariosService";
import { EMAIL_DOMAIN } from "@/constants/formConstants";

import { useIntegranteScope } from "./useIntegranteScope";
import { useIntegrantePeriod } from "./useIntegrantePeriod";

export function useIntegranteRehireForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const horariosState = useHorarios();

  const [row, setRow] = useState(null);
  const [selectedType, setSelectedType] = useState("voluntario");
  const [areaId, setAreaId] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [modalidad, setModalidad] = useState("");

  const [carrera, setCarrera] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [institucionEducativa, setInstitucionEducativa] = useState("");
  const [horasPracticas, setHorasPracticas] = useState("");

  const [departamento, setDepartamento] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [distrito, setDistrito] = useState("");

  const [loadingRecord, setLoadingRecord] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const scope = useIntegranteScope(profile, {
    mode: "rehire",
    selectedType,
  });
  const period = useIntegrantePeriod();

  const isPracticante = selectedType === "practicante";

  const availableCargos = useMemo(() => scope.getAvailableCargos(areaId), [scope, areaId]);

  useEffect(() => {
    let mounted = true;
    // Reinicia la vista cuando React Router reutiliza la página con otro integrante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingRecord(true);
    setFormError("");

    getIntegranteById(id, { force: true, cacheScope })
      .then(async (integrante) => {
        if (!mounted) return;

        if (integrante.activo) {
          throw new Error("El integrante ya se encuentra activo. No necesita recontratación.");
        }

        const type = integrante.tipo_integrante || "voluntario";

        setRow(integrante);
        setSelectedType(type);
        setAreaId(String(integrante.area_id || integrante.cargo_area_id || ""));
        setCargoId(String(integrante.cargo_id || ""));
        setModalidad(integrante.modalidad || "");
        setCarrera(integrante.carrera || "");
        setCiclo(integrante.ciclo || "");
        setInstitucionEducativa(integrante.institucion_educativa || "");
        setHorasPracticas(String(integrante.horas_practicas_requeridas || ""));
        setDepartamento(integrante.departamento || "");
        setCiudad(integrante.ciudad || "");
        setDistrito(integrante.distrito || "");

        period.reset();
        horariosState.setHorarioLocal([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheScope, id, horariosState.setHorarioLocal]);

  function handleTypeChange(type) {
    const allowed = type === "practicante" ? scope.canCreatePracticante : scope.canCreateVoluntario;

    if (!allowed) return;

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

  function setFechaInicio(value) {
    period.setFechaInicio(value);
    setFormError("");
  }

  function setFechaFin(value) {
    period.setFechaFin(value);
    setFormError("");
  }

  function applyQuickPeriod(months) {
    period.applyQuickPeriod(months, { disabled: saving });
    setFormError("");
  }

  async function submit(event) {
    if (event) event.preventDefault();
    if (saving) return;

    setFormError("");

    if (!row) {
      return setFormError("No se pudo cargar el integrante.");
    }

    if (!scope.canManageCurrentType) {
      return setFormError("No tienes permisos para recontratar este integrante.");
    }

    if (!areaId) return setFormError("Selecciona un área.");
    if (!cargoId) return setFormError("Selecciona un cargo.");

    const selectedCargo = (scope.cargos || []).find(
      (cargo) => String(cargo.id) === String(cargoId),
    );

    if (!selectedCargo) {
      return setFormError("El cargo seleccionado no existe o no está disponible.");
    }

    if (Number(selectedCargo.area_id) !== Number(areaId)) {
      return setFormError("El cargo seleccionado no pertenece al área indicada.");
    }

    if (!period.fechaInicio || !period.fechaFin) {
      return setFormError("Completa la fecha de inicio y la fecha de fin.");
    }

    if (period.fechaFin < period.fechaInicio) {
      return setFormError("La fecha de fin no puede ser anterior a la fecha de inicio.");
    }

    if (isPracticante) {
      if (!carrera.trim()) {
        return setFormError("La carrera es obligatoria para practicantes.");
      }
      if (!ciclo.trim()) {
        return setFormError("El ciclo es obligatorio para practicantes.");
      }
      if (!institucionEducativa.trim()) {
        return setFormError("La institución educativa es obligatoria para practicantes.");
      }

      const horasNum = Number(horasPracticas);
      if (!horasPracticas || !Number.isInteger(horasNum) || horasNum <= 0) {
        return setFormError("Las horas prácticas deben ser un número entero mayor a 0.");
      }
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
      nombres: row.nombres,
      apellidos: row.apellidos,
      fecha_nacimiento: row.fecha_nacimiento,
      documento_identidad: row.documento_identidad,
      tipo_documento: row.tipo_documento,
      telefono: row.telefono,
      carrera: carrera.trim(),
      ciclo: ciclo.trim(),
      modalidad: modalidad.trim(),
      cargo_id: Number(cargoId),
      correo: `${String(row.correo || "")
        .replace(new RegExp(`${EMAIL_DOMAIN}$`, "i"), "")
        .trim()
        .toLocaleLowerCase()}${EMAIL_DOMAIN}`,
      password: "",
      fecha_inicio: period.fechaInicio,
      fecha_fin: period.fechaFin,
      periodo_meses: period.periodMonths,
      institucion_educativa: institucionEducativa.trim(),
      horas_practicas_requeridas: Number(horasPracticas),
      departamento: departamento.trim(),
      ciudad: ciudad.trim(),
      distrito: distrito.trim(),
    };

    setSaving(true);

    try {
      const result = await rehireIntegrante(row.id, input, selectedType, profile);

      const newHistorialId = result?.historial_id || result?.historial_actual?.id;

      if (!newHistorialId) {
        throw new Error("La recontratación se completó, pero no se encontró el nuevo historial.");
      }

      await horariosState.saveAll(newHistorialId, horariosState.horarios);

      navigate("/integrantes", {
        state: {
          feedback: {
            type: "success",
            message: "Integrante recontratado correctamente.",
          },
        },
      });
    } catch (error) {
      setFormError(error.message || "No se pudo completar la recontratación.");
    } finally {
      setSaving(false);
    }
  }

  return {
    navigate,
    row,
    selectedType,
    isPracticante,

    canCreateVoluntario: scope.canCreateVoluntario,
    canCreatePracticante: scope.canCreatePracticante,
    canManage: scope.canManageCurrentType,
    isAreaScoped: scope.isAreaScoped,
    userAreaId: scope.userAreaId,

    loadingRecord,
    saving,
    formError,
    clearFormError: () => setFormError(""),

    modalidad,
    setModalidad,
    carrera,
    setCarrera,
    ciclo,
    setCiclo,
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

    areaId,
    updateArea,
    allowedAreas: scope.allowedAreas,
    cargoId,
    setCargoId,
    availableCargos,

    fechaInicio: period.fechaInicio,
    setFechaInicio,
    fechaFin: period.fechaFin,
    setFechaFin,
    minFechaFin: period.minFechaFin,
    periodMonths: period.periodMonths,
    activeQuickPeriod: period.activeQuickPeriod,
    applyQuickPeriod,

    horariosState,
    handleTypeChange,
    submit,
  };
}
