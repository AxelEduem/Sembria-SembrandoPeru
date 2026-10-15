import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import AccesoConfirmDialog from "@/components/accesos/AccesoConfirmDialog";
import AccesosFeedback from "@/components/accesos/AccesosFeedback";
import VoluntariosConAccesoTable from "@/components/accesos/VoluntariosConAccesoTable";
import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useAplicaciones } from "@/hooks/useAplicaciones";
import {
  getAsignacionesAplicacionesInactivos,
  revokeAplicacionFromVoluntario,
} from "@/services/integrantes-accesos/integrantesAccesosService";
import { downloadExcel } from "@/utils/excelExport";
import { PERMISSIONS, hasPermission } from "@/utils/permissions";

const PAGE_SIZE = 5;

function getTipoLabel(tipo) {
  if (tipo === "practicante") return "Practicante";
  if (tipo === "gerente") return "Gerente";
  return "Voluntario";
}

export default function AccesosInactivosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { aplicaciones, loading: aplicacionesLoading } = useAplicaciones();
  const canRevoke = hasPermission(profile, PERMISSIONS.ACCESOS_GESTIONAR);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.ACCESOS_DESCARGAR_EXCEL);

  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("todas");
  const [cargoFilter, setCargoFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [appFilter, setAppFilter] = useState("todas");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [asignacionToRevoke, setAsignacionToRevoke] = useState(null);

  const loadData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError("");
    try {
      setAsignaciones(await getAsignacionesAplicacionesInactivos(profile, {}, { force: true }));
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los accesos pendientes.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const areaOptions = useMemo(
    () =>
      Array.from(new Set(asignaciones.map((row) => row.voluntario?.area).filter(Boolean))).sort(
        (first, second) => first.localeCompare(second),
      ),
    [asignaciones],
  );

  const cargoOptions = useMemo(
    () =>
      Array.from(
        new Set(
          asignaciones
            .filter((row) => areaFilter === "todas" || row.voluntario?.area === areaFilter)
            .map((row) => row.voluntario?.cargo)
            .filter(Boolean),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [areaFilter, asignaciones],
  );

  const filteredAsignaciones = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return asignaciones.filter((row) => {
      const integrante = row.integrante || row.voluntario || {};
      const matchesSearch =
        !normalizedSearch ||
        [integrante.nombre, integrante.correo].some((value) =>
          String(value || "")
            .toLocaleLowerCase()
            .includes(normalizedSearch),
        );
      return (
        matchesSearch &&
        (areaFilter === "todas" || integrante.area === areaFilter) &&
        (cargoFilter === "todos" || integrante.cargo === cargoFilter) &&
        (typeFilter === "todos" || integrante.tipo_integrante === typeFilter) &&
        (appFilter === "todas" || String(row.aplicacion_id) === String(appFilter))
      );
    });
  }, [appFilter, areaFilter, asignaciones, cargoFilter, search, typeFilter]);

  function resetPage(setter) {
    return (value) => {
      setter(value);
      setCurrentPage(1);
    };
  }

  function handleDownload() {
    downloadExcel(
      {
        headers: ["Integrante", "Correo", "Tipo", "Área", "Cargo", "Aplicación"],
        data: filteredAsignaciones.map((row) => {
          const integrante = row.integrante || row.voluntario || {};
          return [
            integrante.nombre,
            integrante.correo,
            getTipoLabel(integrante.tipo_integrante),
            integrante.area,
            integrante.cargo,
            row.aplicacion?.nombre || "",
          ];
        }),
      },
      "integrantes_inactivos_con_acceso.xls",
    );
  }

  function handleOpenRevoke(asignacion) {
    setAsignacionToRevoke(asignacion);
    setConfirmOpen(true);
  }

  async function handleConfirmRevoke() {
    if (!asignacionToRevoke || !canRevoke) return;
    setSaving(true);
    setFeedback(null);
    try {
      await revokeAplicacionFromVoluntario(asignacionToRevoke.id, profile);
      await loadData();
      setConfirmOpen(false);
      setAsignacionToRevoke(null);
      setFeedback({ type: "success", message: "Acceso retirado correctamente." });
    } catch (revokeError) {
      setFeedback({
        type: "error",
        message: revokeError.message || "No se pudo retirar el acceso.",
      });
    } finally {
      setSaving(false);
    }
  }

  const listSearch = location.state?.listSearch || "";

  return (
    <div className="module-page-enter pb-6">
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(`/accesos${listSearch}`)}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a accesos
        </button>
        {canDownloadExcel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            disabled={loading || filteredAsignaciones.length === 0}
            className="h-10 gap-2 rounded-xl"
          >
            <ExcelIcon className="h-4 w-4" /> Descargar Excel
          </Button>
        )}
      </section>

      <AccesosFeedback
        feedback={feedback || (error ? { type: "error", message: error } : null)}
        onClose={() => {
          setFeedback(null);
          setError("");
        }}
      />

      {loading || aplicacionesLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-700">Cargando accesos pendientes...</p>
        </section>
      ) : (
        <VoluntariosConAccesoTable
          asignaciones={filteredAsignaciones}
          aplicaciones={aplicaciones}
          accessSearch={search}
          accessAreaFilter={areaFilter}
          accessCargoFilter={cargoFilter}
          accessTypeFilter={typeFilter}
          accessAppFilter={appFilter}
          accessAreaOptions={areaOptions}
          accessCargoOptions={cargoOptions}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          saving={saving}
          canRevoke={canRevoke}
          onSearchChange={resetPage(setSearch)}
          onAreaChange={resetPage(setAreaFilter)}
          onCargoChange={resetPage(setCargoFilter)}
          onTypeChange={resetPage(setTypeFilter)}
          onAppChange={resetPage(setAppFilter)}
          onPageChange={setCurrentPage}
          onRevoke={handleOpenRevoke}
        />
      )}

      {canRevoke && (
        <AccesoConfirmDialog
          open={confirmOpen}
          asignacion={asignacionToRevoke}
          loading={saving}
          onOpenChange={(open) => {
            if (saving) return;
            setConfirmOpen(open);
            if (!open) setAsignacionToRevoke(null);
          }}
          onConfirm={handleConfirmRevoke}
        />
      )}
    </div>
  );
}
