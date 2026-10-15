import { apiRequest } from "@/services/api";
import { clearAgendaCache } from "@/services/agenda/cache";
import {
  clearUsuariosCache,
  getCachedUsuariosData,
  USUARIOS_CACHE_GROUPS as GROUPS,
  USUARIOS_CACHE_TTL as TTL,
} from "@/services/usuarios/cache";

export async function getUsuariosIntegrantes({ force = false } = {}) {
  return getCachedUsuariosData(
    "list:default",
    async () => {
      const response = await apiRequest("/api/usuarios");
      return Array.isArray(response?.data) ? response.data : [];
    },
    { force, ttl: TTL.LIST, groups: [GROUPS.LIST] },
  );
}

export async function configurarAccesoIntegrante({ integranteId, correo, password, enviarCorreo }) {
  const response = await apiRequest(`/api/usuarios/${integranteId}/access`, {
    method: "POST",
    csrf: true,
    body: {
      correo,
      password,
      enviar_correo: Boolean(enviarCorreo),
    },
  });

  clearAgendaCache();
  clearUsuariosCache();
  return response;
}

export async function reenviarCredencialesIntegrante(integranteId, enviarCorreo) {
  const response = await apiRequest(
    `/api/usuarios/${integranteId}/resend-credentials`,
    {
      method: "POST",
      csrf: true,
      body: { enviar_correo: Boolean(enviarCorreo) },
    },
  );

  clearAgendaCache();
  clearUsuariosCache();
  return response;
}

export async function actualizarCorreoIntegrante({ integranteId, correo }) {
  const response = await apiRequest(`/api/usuarios/${integranteId}/email`, {
    method: "PATCH",
    csrf: true,
    body: { correo },
  });

  clearAgendaCache();
  clearUsuariosCache();
  return response;
}
