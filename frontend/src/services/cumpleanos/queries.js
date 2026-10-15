import { apiRequest } from "@/services/api";

export async function getCumpleanosIntegrantes() {
  const response = await apiRequest("/api/cumpleanos");
  return Array.isArray(response?.data) ? response.data : [];
}
