export const INTEGRANTE_TYPES = {
  VOLUNTARIO: "voluntario",
  PRACTICANTE: "practicante",
  GERENTE: "gerente",
};

export const INTEGRANTE_COLUMNS = `
  id,
  persona_id,
  fecha_nacimiento,
  documento_identidad,
  tipo_documento,
  telefono,
  estado,
  accesos_pendientes_revision,
  avatar_path,
  created_at,
  departamento,
  ciudad,
  distrito,
  personas (
    id,
    nombres,
    apellidos,
    correo,
    created_at
  )
`;

export const HISTORIAL_COLUMNS = `
  id,
  integrante_id,
  tipo_integrante,
  cargo_id,
  periodo_meses,
  fecha_inicio,
  fecha_fin,
  institucion_educativa,
  horas_practicas_requeridas,
  carrera,
  ciclo,
  modalidad,
  estado,
  fecha_desactivacion,
  desactivado_por,
  motivo_desactivacion,
  tipo_desactivacion,
  created_at,
  cargos (
    id,
    nombre,
    area_id,
    rol_id,
    areas (
      id,
      nombre,
      activo
    ),
    roles (
      id,
      codigo,
      nombre,
      descripcion,
      acceso_total,
      activo
    )
  )
`;

export const CUENTA_COLUMNS = `
  id,
  persona_id,
  activo,
  must_change_password,
  created_at
`;

export const AUTO_DEACTIVATION_REASON = "Se desactivo porque acabo su periodo.";

export const NAME_PATTERN = /^[\p{L} ]+$/u;
export const EMAIL_DOMAIN = "@sembrandoperu.org";
