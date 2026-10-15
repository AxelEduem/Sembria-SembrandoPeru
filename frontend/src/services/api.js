export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

let csrfInitialized = false;
const mutationListeners = new Set();

const HTTP_ERROR_MESSAGES = {
  400: "La solicitud enviada no es válida.",
  401: "Tu sesión no está activa. Inicia sesión nuevamente.",
  403: "No tienes permisos para realizar esta operación.",
  404: "No se encontró el recurso solicitado.",
  405: "La operación solicitada no está permitida.",
  409: "La operación genera un conflicto con la información existente.",
  419: "Tu sesión venció. Actualiza la página e inténtalo nuevamente.",
  422: "Revisa los datos ingresados e inténtalo nuevamente.",
  429: "Se realizaron demasiadas solicitudes. Espera un momento e inténtalo nuevamente.",
  500: "Ocurrió un error interno en el servidor.",
  503: "El servicio no está disponible temporalmente.",
};

const KNOWN_SERVER_MESSAGES = {
  "Unauthenticated.": HTTP_ERROR_MESSAGES[401],
  "This action is unauthorized.": HTTP_ERROR_MESSAGES[403],
  "The given data was invalid.": HTTP_ERROR_MESSAGES[422],
  "CSRF token mismatch.": HTTP_ERROR_MESSAGES[419],
  "Too Many Attempts.": HTTP_ERROR_MESSAGES[429],
  "Server Error": HTTP_ERROR_MESSAGES[500],
};

function firstValidationMessage(errors) {
  if (!errors || typeof errors !== "object") return "";

  for (const messages of Object.values(errors)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") return messages[0];
    if (typeof messages === "string") return messages;
  }

  return "";
}

function getErrorMessage(data, status) {
  const validationMessage = firstValidationMessage(data?.errors);
  const serverMessage = validationMessage || data?.message || data?.error || "";
  if (KNOWN_SERVER_MESSAGES[serverMessage]) return KNOWN_SERVER_MESSAGES[serverMessage];

  const looksLikeEnglishFrameworkMessage =
    typeof serverMessage === "string" &&
    /\b(the|this|field|must|required|invalid|unauthorized|forbidden|not found|server error)\b/i.test(
      serverMessage,
    );

  if (serverMessage && !looksLikeEnglishFrameworkMessage) return serverMessage;

  return HTTP_ERROR_MESSAGES[status] || "Ocurrió un error al comunicarse con el servidor.";
}

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];

  const cookie = cookies.find((row) => row.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.substring(name.length + 1));
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    success: response.ok,
    message: text || "Respuesta inesperada del servidor.",
  };
}

export async function ensureCsrfCookie() {
  let response;

  try {
    response = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new Error("No se pudo establecer conexión con el servidor.");
  }

  if (!response.ok) {
    throw new Error("No fue posible inicializar la protección CSRF.");
  }

  csrfInitialized = true;

  return response;
}

export async function apiRequest(path, { method = "GET", body, headers = {}, csrf = false } = {}) {
  if (csrf && !csrfInitialized) {
    await ensureCsrfCookie();
  }

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (csrf) {
    const xsrfToken = getCookie("XSRF-TOKEN");

    if (xsrfToken) {
      requestHeaders["X-XSRF-TOKEN"] = xsrfToken;
    }
  }

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: requestHeaders,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo establecer conexión con el servidor.");
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(getErrorMessage(data, response.status));

    error.status = response.status;
    error.data = data;

    throw error;
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(String(method).toUpperCase())) {
    mutationListeners.forEach((listener) => listener({ method, path }));
  }

  return data;
}

export function subscribeApiMutation(listener) {
  mutationListeners.add(listener);
  return () => mutationListeners.delete(listener);
}

export function resetApiState() {
  csrfInitialized = false;
}
