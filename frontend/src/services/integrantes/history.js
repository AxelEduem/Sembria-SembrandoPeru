export function getPastIntegranteHistories(integrante) {
  const histories = Array.isArray(integrante?.historiales) ? integrante.historiales : [];
  const currentId = integrante?.historial_actual?.id ?? integrante?.historial_id;

  if (currentId == null) return histories;

  return histories.filter((history) => String(history.id) !== String(currentId));
}

export function hasPastIntegranteHistories(integrante) {
  return getPastIntegranteHistories(integrante).length > 0;
}
