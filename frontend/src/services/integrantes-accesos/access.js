import { apiRequest } from "@/services/api";

export async function getAplicacionActiva(applicationId) {
  return { id: Number(applicationId), activo: true };
}

export async function countAssignments(applicationId) {
  const response = await apiRequest("/api/integrante-access-assignments");
  return (response?.data || []).filter((row) => Number(row.aplicacion_id) === Number(applicationId)).length;
}
