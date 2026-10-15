export {
  getAsignacionesAplicaciones,
  getAsignacionesAplicacionesInactivos,
  getIntegrantesActivosParaAccesos,
  getVoluntariosActivosParaAccesos,
} from "./queries";
export {
  assignAplicacionToIntegrante,
  assignAplicacionToVoluntario,
  revokeAplicacionFromIntegrante,
  revokeAplicacionFromVoluntario,
} from "./mutations";
