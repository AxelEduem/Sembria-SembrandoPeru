export function idOf(value, label = "El valor seleccionado") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} no es valido.`);
  return id;
}

export function toAccesoError(error, fallback) {
  if (error?.code === "23505") return new Error("El integrante ya tiene acceso a esta aplicacion.");
  if (error?.code === "42501" || error?.status === 401 || error?.status === 403) {
    return new Error("No tienes permisos para realizar esta accion.");
  }
  return new Error(error?.message || fallback);
}
