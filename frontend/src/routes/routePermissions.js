import { PERMISSIONS } from "../utils/permissions";

export const ROUTE_PERMISSIONS = {
  // =========================================================
  // INTEGRANTES
  // =========================================================
  integrantes: PERMISSIONS.INTEGRANTES_VER,
  integrantesCrear: PERMISSIONS.INTEGRANTES_CREAR,
  integrantesVerDetalle: PERMISSIONS.INTEGRANTES_VER_DETALLE,
  integrantesEditar: PERMISSIONS.INTEGRANTES_EDITAR,
  integrantesDesactivar: PERMISSIONS.INTEGRANTES_DESACTIVAR,
  integrantesDescargarExcel: PERMISSIONS.INTEGRANTES_DESCARGAR_EXCEL,
  integrantesVerMetricas: PERMISSIONS.INTEGRANTES_VER_METRICAS,
  integrantesVerHistorial: PERMISSIONS.INTEGRANTES_VER_HISTORIAL,
  integrantesRecontratar: PERMISSIONS.INTEGRANTES_RECONTRATAR,
  integrantesActivar: PERMISSIONS.INTEGRANTES_ACTIVAR,

  // =========================================================
  // ADMINISTRACIÓN
  // =========================================================
  asistencia: PERMISSIONS.ASISTENCIA_VER,
  asistenciaGestionarConfiguracion: PERMISSIONS.ASISTENCIA_GESTIONAR_CONFIGURACION,
  asistenciaGestionarSolicitudes: PERMISSIONS.ASISTENCIA_GESTIONAR_SOLICITUDES,
  asistenciaVerHistorialSolicitudes: PERMISSIONS.ASISTENCIA_VER_HISTORIAL_SOLICITUDES,
  asistenciaGestionarAmonestaciones: PERMISSIONS.ASISTENCIA_GESTIONAR_AMONESTACIONES,
  asistenciaVerMetricas: PERMISSIONS.ASISTENCIA_VER_METRICAS,

  accesos: PERMISSIONS.ACCESOS_VER,
  accesosVerMetricas: PERMISSIONS.ACCESOS_VER_METRICAS,
  accesosVerInactivos: PERMISSIONS.ACCESOS_VER_INACTIVOS,
  bitacora: PERMISSIONS.BITACORA_VER,
  bitacoraVerMetricas: PERMISSIONS.BITACORA_VER_METRICAS,

  aplicaciones: PERMISSIONS.APLICACIONES_VER,

  solicitudesCambioHorario: PERMISSIONS.SOLICITUDES_HORARIO_VER,

  cumpleanos: PERMISSIONS.CUMPLEANOS_VER,
  cumpleanosVerMetricas: PERMISSIONS.CUMPLEANOS_VER_METRICAS,

  areas: PERMISSIONS.AREAS_VER,

  cargos: PERMISSIONS.CARGOS_VER,

  roles: PERMISSIONS.ROLES_VER,

  usuarios: PERMISSIONS.USUARIOS_VER,

  convocatorias: PERMISSIONS.GP_CONVOCATORIAS_VER,
  gpEquipos: PERMISSIONS.GP_EQUIPOS_VER,
  gpEquiposCrear: PERMISSIONS.GP_EQUIPOS_CREAR,
  gpEquiposEditar: PERMISSIONS.GP_EQUIPOS_EDITAR,
  gpEquiposVerMetricas: PERMISSIONS.GP_EQUIPOS_VER_METRICAS,
  gpConvocatoriasCrear: PERMISSIONS.GP_CONVOCATORIAS_CREAR,
  gpConvocatoriasEditar: PERMISSIONS.GP_CONVOCATORIAS_EDITAR,
  gpConvocatoriasEvaluar: PERMISSIONS.GP_CONVOCATORIAS_EVALUAR,
  gpConvocatoriasRevisar: PERMISSIONS.GP_CONVOCATORIAS_REVISAR,
  gpConvocatoriasAprobar: PERMISSIONS.GP_CONVOCATORIAS_APROBAR,
  gpConvocatoriasPostular: PERMISSIONS.GP_CONVOCATORIAS_POSTULAR,
  gpCapacitaciones: PERMISSIONS.GP_CAPACITACIONES_VER,
};
