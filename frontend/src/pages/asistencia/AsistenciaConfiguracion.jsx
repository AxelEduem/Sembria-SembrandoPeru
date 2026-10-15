import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AttendanceWorkflowAdmin from "@/components/asistencia/AttendanceWorkflowAdmin";

export default function AsistenciaConfiguracion() {
  const navigate = useNavigate();

  return (
    <div className="module-page-enter space-y-4 pb-10">
      <button
        type="button"
        onClick={() => navigate("/asistencia/administracion")}
        className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a gestión de asistencia
      </button>
      <AttendanceWorkflowAdmin mode="settings" />
    </div>
  );
}
