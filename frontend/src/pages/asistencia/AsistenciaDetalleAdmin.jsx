/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, FileSearch } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import AttendanceDetailView from "@/components/asistencia/seguimiento/AttendanceDetailView";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { getSeguimientoJornadas } from "@/services/asistencia/asistenciaService";
import { attendanceStatus } from "@/utils/attendanceTracking";

export default function AsistenciaDetalleAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const fecha = searchParams.get("fecha") || "";
  const asistenciaId = searchParams.get("asistencia") || "";
  const integranteId = searchParams.get("integrante") || "";
  const horarioId = searchParams.get("horario") || "";
  const returnTo = typeof location.state?.from === "string" ? location.state.from : `/asistencia/administracion${fecha ? `?fecha=${fecha}` : ""}`;

  const load = useCallback(async () => {
    if (!fecha || (!asistenciaId && !integranteId)) {
      setLoading(false);
      setRow(null);
      return;
    }
    setLoading(true);
    try {
      const rows = await getSeguimientoJornadas(fecha) || [];
      const match = rows.find((item) => asistenciaId && String(item.asistencia_id) === asistenciaId)
        || rows.find((item) => String(item.integrante_id) === integranteId && (!horarioId || String(item.horario_id) === horarioId));
      setRow(match ? { ...match, seguimiento: attendanceStatus(match, match.fecha || fecha) } : null);
    } catch (error) {
      setRow(null);
      setFeedback({ type: "error", message: error?.message || "No se pudo cargar el detalle de asistencia." });
    } finally {
      setLoading(false);
    }
  }, [asistenciaId, fecha, horarioId, integranteId]);

  useEffect(() => { void load(); }, [load]);

  return <div className="module-page-enter space-y-4 pb-10">
    <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
    <button type="button" onClick={() => navigate(returnTo)} className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"><ArrowLeft className="h-4 w-4" />Volver a gestión de asistencia</button>
    {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400 shadow-sm">Cargando detalle de asistencia...</div> : row ? <AttendanceDetailView row={row} /> : <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm"><FileSearch className="mx-auto h-8 w-8 text-slate-300" /><h1 className="mt-3 text-base font-bold text-slate-700">No encontramos esta asistencia</h1><p className="mt-1 text-xs text-slate-400">Es posible que el registro ya no exista o que la dirección esté incompleta.</p></div>}
  </div>;
}
