import { apiRequest } from "./api.js";
import { clearCumpleanosCache } from "./cumpleanos/cache.js";
import {
  clearIntegranteDetailCaches,
  clearIntegrantesListCache,
} from "./integrantes/cache.js";

function invalidateAvatarConsumers() {
  clearCumpleanosCache();
  clearIntegranteDetailCaches();
  clearIntegrantesListCache();
}

export async function uploadAvatar(file) {
  const formData = new FormData();

  formData.append("avatar", file);

  const response = await apiRequest("/api/profile/avatar", {
    method: "POST",
    csrf: true,
    body: formData,
  });

  invalidateAvatarConsumers();
  return response;
}

export async function deleteAvatar() {
  const response = await apiRequest("/api/profile/avatar", {
    method: "DELETE",
    csrf: true,
  });

  invalidateAvatarConsumers();
  return response;
}
