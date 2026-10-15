import { useIntegrantes, STATUS_FILTERS, STATUS_OPTIONS } from "./integrantes/useIntegrantes";

export const VOLUNTARIO_STATUS_FILTERS = STATUS_FILTERS;
export const VOLUNTARIO_STATUS_OPTIONS = STATUS_OPTIONS;

export function useVoluntarios() {
  const integrantes = useIntegrantes("voluntario");

  return {
    ...integrantes,
    voluntarios: integrantes.integrantes,
    filteredVoluntarios: integrantes.filteredIntegrantes,
    createVoluntario: integrantes.createIntegrante,
    updateVoluntario: integrantes.updateIntegrante,
    deactivateVoluntario: integrantes.deactivateIntegrante,
    restoreVoluntario: integrantes.restoreIntegrante,
    validateVoluntarioAccesses: integrantes.validateIntegranteAccesses,
    removeVoluntarioAccess: integrantes.removeIntegranteAccess,
    refreshVoluntarios: async () => ({ success: true }),
    confirmVoluntarioAccessesRemoved: async () => ({ success: true }),
  };
}
