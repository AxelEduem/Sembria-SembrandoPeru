export function recoveryMinutes(rows = []) {
  return rows.reduce((total, row) => {
    if (!row.fecha || !row.hora_inicio || !row.hora_fin) return total;
    return total + Math.max(0, Math.round(
      (new Date(`${row.fecha}T${row.hora_fin}`) - new Date(`${row.fecha}T${row.hora_inicio}`)) / 60000,
    ));
  }, 0);
}
