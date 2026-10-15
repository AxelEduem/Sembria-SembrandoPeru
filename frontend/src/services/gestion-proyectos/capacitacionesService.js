import { apiRequest } from "@/services/api";

export async function getCapacitaciones() {
  const response = await apiRequest("/api/gestion-proyectos/capacitaciones");

  return {
    items: response?.data || [],
    canManage: response?.meta?.can_manage === true,
  };
}

export async function completeCapacitacionStage(integranteId, stage) {
  const response = await apiRequest(
    `/api/gestion-proyectos/capacitaciones/${integranteId}/etapas/${stage}`,
    { method: "PATCH", csrf: true },
  );

  return response?.data;
}
