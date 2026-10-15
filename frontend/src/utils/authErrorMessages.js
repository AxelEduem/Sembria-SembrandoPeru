const PASSWORD_ERROR_MESSAGES = {
  same_password: "No puedes reutilizar tu contraseña actual. Ingresa una contraseña diferente.",
  weak_password:
    "La contraseña no cumple los requisitos de seguridad. Usa una combinación más difícil de adivinar.",
  reauthentication_needed:
    "Por seguridad, debes volver a iniciar sesión antes de cambiar tu contraseña.",
  reauthentication_not_valid:
    "No se pudo confirmar tu identidad. Vuelve a iniciar sesión e inténtalo nuevamente.",
  session_not_found:
    "Tu sesión ya no está disponible. Inicia sesión nuevamente para cambiar tu contraseña.",
  session_expired: "Tu sesión ha vencido. Inicia sesión nuevamente para cambiar tu contraseña.",
  over_request_rate_limit:
    "Has realizado demasiados intentos. Espera unos minutos antes de volver a intentarlo.",
  request_timeout: "La solicitud tardó demasiado. Verifica tu conexión e inténtalo nuevamente.",
};

function includesAny(value, fragments) {
  return fragments.some((fragment) => value.includes(fragment));
}

function getWeakPasswordMessage(error) {
  const reasons = Array.isArray(error?.reasons) ? error.reasons : [];

  if (reasons.includes("pwned")) {
    return "Esta contraseña apareció en una filtración de datos y no es segura. Elige otra contraseña.";
  }

  if (reasons.includes("characters")) {
    return "La contraseña necesita una combinación más segura de letras, números o símbolos.";
  }

  if (reasons.includes("length")) {
    return "La contraseña no tiene la longitud mínima requerida.";
  }

  return PASSWORD_ERROR_MESSAGES.weak_password;
}

export function getPasswordUpdateErrorMessage(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  if (code === "weak_password") {
    return getWeakPasswordMessage(error);
  }

  if (PASSWORD_ERROR_MESSAGES[code]) {
    return PASSWORD_ERROR_MESSAGES[code];
  }

  if (
    includesAny(message, [
      "same password",
      "different from the old password",
      "different from old password",
      "different from the current password",
      "contraseña anterior",
      "contrasena anterior",
    ])
  ) {
    return PASSWORD_ERROR_MESSAGES.same_password;
  }

  if (includesAny(message, ["weak password", "password is too weak"])) {
    return PASSWORD_ERROR_MESSAGES.weak_password;
  }

  if (includesAny(message, ["session expired", "jwt expired"])) {
    return PASSWORD_ERROR_MESSAGES.session_expired;
  }

  if (includesAny(message, ["rate limit", "too many requests"])) {
    return PASSWORD_ERROR_MESSAGES.over_request_rate_limit;
  }

  if (includesAny(message, ["failed to fetch", "networkerror", "network request failed"])) {
    return "No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo nuevamente.";
  }

  return "No se pudo actualizar la contraseña. Inténtalo nuevamente o vuelve a iniciar sesión si el problema continúa.";
}
