import { INTEGRANTE_TYPES, NAME_PATTERN } from "./constants";
import {
  calculatePeriodMonths,
  getDateValue,
  normalizeId,
  normalizeText,
  validateDateOfBirth,
} from "./utils";

export function validateCommonInput(input, type) {
  if (!Object.values(INTEGRANTE_TYPES).includes(type)) {
    throw new Error("El tipo de integrante no es válido.");
  }

  const nombres = normalizeText(input?.nombres);
  const apellidos = normalizeText(input?.apellidos);
  const cargoId = normalizeId(input?.cargo_id);
  const fechaInicio = normalizeText(input?.fecha_inicio);
  const fechaFin = normalizeText(input?.fecha_fin);
  const fechaNacimiento = normalizeText(input?.fecha_nacimiento);
  const documentoIdentidad = normalizeText(input?.documento_identidad);
  const tipoDocumento = normalizeText(input?.tipo_documento).toLowerCase();
  const telefono = normalizeText(input?.telefono);
  const modalidad = normalizeText(input?.modalidad);
  const departamento = normalizeText(input?.departamento);
  const ciudad = normalizeText(input?.ciudad);
  const distrito = normalizeText(input?.distrito);

  const periodoMeses = calculatePeriodMonths(fechaInicio, fechaFin);
  const isGerente = type === INTEGRANTE_TYPES.GERENTE;

  if (!isGerente && fechaInicio && fechaFin) {
    const minimumEnd = new Date(`${fechaInicio}T00:00:00`);
    minimumEnd.setMonth(minimumEnd.getMonth() + 1);

    if (getDateValue(fechaFin) < minimumEnd) {
      throw new Error("El periodo debe tener una duración mínima de 1 mes.");
    }
  }

  if (!nombres || !NAME_PATTERN.test(nombres)) {
    throw new Error("Los nombres solo pueden contener letras y espacios.");
  }

  if (!apellidos || !NAME_PATTERN.test(apellidos)) {
    throw new Error("Los apellidos solo pueden contener letras y espacios.");
  }

  validateDateOfBirth(fechaNacimiento);

  if (!documentoIdentidad) {
    throw new Error("El documento de identidad es obligatorio.");
  }

  if (!["dni", "ruc", "carnet de extranjeria"].includes(tipoDocumento)) {
    throw new Error("Selecciona un tipo de documento válido.");
  }

  if (tipoDocumento === "dni" && !/^\d{8}$/.test(documentoIdentidad)) {
    throw new Error("El DNI debe contener exactamente 8 dígitos.");
  }

  if (tipoDocumento === "ruc" && !/^\d{11}$/.test(documentoIdentidad)) {
    throw new Error("El RUC debe contener exactamente 11 dígitos.");
  }

  if (tipoDocumento === "carnet de extranjeria" && !/^[a-z0-9-]{5,20}$/i.test(documentoIdentidad)) {
    throw new Error("El carnet de extranjería debe tener entre 5 y 20 caracteres.");
  }

  if (!telefono) throw new Error("El número de teléfono es obligatorio.");
  if (!modalidad) throw new Error("Debes seleccionar una modalidad.");
  if (!cargoId) throw new Error("Debes seleccionar el cargo del integrante.");

  if (!isGerente && !fechaInicio) {
    throw new Error("La fecha de inicio del periodo es obligatoria.");
  }

  if (!isGerente && !fechaFin) {
    throw new Error("La fecha de fin del periodo es obligatoria.");
  }

  if (!isGerente && !periodoMeses) {
    throw new Error("El periodo seleccionado no es válido.");
  }

  const common = {
    nombres,
    apellidos,
    fecha_nacimiento: fechaNacimiento,
    tipo_integrante: type,
    cargo_id: cargoId,
    periodo_meses: isGerente ? null : periodoMeses,
    fecha_inicio: isGerente ? null : fechaInicio,
    fecha_fin: isGerente ? null : fechaFin,
    documento_identidad: documentoIdentidad,
    tipo_documento: tipoDocumento,
    telefono,
    modalidad,
    departamento,
    ciudad,
    distrito,
  };

  if (type === INTEGRANTE_TYPES.PRACTICANTE) {
    const institucionEducativa = normalizeText(input?.institucion_educativa);
    const carrera = normalizeText(input?.carrera);
    const ciclo = normalizeText(input?.ciclo);
    const horas = Number(input?.horas_practicas_requeridas);

    if (!institucionEducativa) {
      throw new Error("La institución educativa es obligatoria.");
    }

    if (!carrera) {
      throw new Error("La carrera es obligatoria para practicantes.");
    }

    if (!ciclo) {
      throw new Error("El ciclo es obligatorio para practicantes.");
    }

    if (!Number.isInteger(horas) || horas <= 0) {
      throw new Error("Las horas de prácticas deben ser un entero mayor que cero.");
    }

    common.institucion_educativa = institucionEducativa;
    common.carrera = carrera;
    common.ciclo = ciclo;
    common.horas_practicas_requeridas = horas;
  }

  return common;
}

export async function validateCargoForIntegrante(cargoId) {
  const normalizedId = normalizeId(cargoId);

  if (!normalizedId) {
    throw new Error("Selecciona el cargo del integrante.");
  }

  // Laravel valida existencia, estado del cargo/área/rol y alcance institucional.
  return { id: normalizedId };
}
