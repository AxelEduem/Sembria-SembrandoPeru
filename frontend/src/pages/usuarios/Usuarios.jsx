import { useState } from "react";
import { useLocation } from "react-router-dom";

import ConfigurarAccesoDialog from "@/components/usuarios/ConfigurarAccesoDialog";
import EditEmailDialog from "@/components/usuarios/EditEmailDialog";
import ResendCredentialsDialog from "@/components/usuarios/ResendCredentialsDialog";
import UsuariosFilters from "@/components/usuarios/UsuariosFilters";
import UsuariosTable from "@/components/usuarios/UsuariosTable";
import UsuariosViewSelector from "@/components/usuarios/UsuariosViewSelector";
import ExcelIcon from "@/components/ui/ExcelIcon";
import FeedbackToast from "@/components/ui/FeedbackToast";
import ManualButton from "@/components/ui/ManualButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUsuarios } from "@/hooks/useUsuarios";
import { downloadExcel, formatExcelDate } from "@/utils/excelExport";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

function typeLabel(type) {
  if (type === "practicante") return "Practicante";
  if (type === "gerente") return "Gerente";
  return "Voluntario";
}

export default function Usuarios() {
  const location = useLocation();
  const { profile } = useAuth();
  const state = useUsuarios();

  const [selected, setSelected] = useState(null);
  const [resendTarget, setResendTarget] = useState(null);
  const [editEmailTarget, setEditEmailTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const canConfigure = hasPermission(profile, PERMISSIONS.USUARIOS_CONFIGURAR_ACCESO);
  const canResetPassword = hasPermission(
    profile,
    PERMISSIONS.USUARIOS_RESTABLECER_CONTRASENA,
  );
  const canEditEmail = hasPermission(profile, PERMISSIONS.USUARIOS_EDITAR_CORREO);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.USUARIOS_DESCARGAR_EXCEL);
  const activeFeedback =
    feedback || (state.error ? { type: "error", message: state.error } : null);

  function showFeedback(type, message) {
    setFeedback({ type, message });
  }

  function handleDownloadExcel() {
    const hasAccess = state.viewMode === "con_acceso";

    downloadExcel(
      {
        headers: [
          "Integrante",
          "Correo",
          "Tipo de integrante",
          "Área",
          "Cargo",
          "Estado del integrante",
          "Estado de acceso",
          "Fecha de configuración",
        ],
        data: state.filteredUsuarios.map((row) => [
          row.nombre,
          row.correo,
          typeLabel(row.tipo_integrante),
          row.area,
          row.cargo,
          row.integrante_activo ? "Activo" : "Inactivo",
          hasAccess ? (row.activo ? "Activo" : "Inactivo") : "Sin acceso",
          formatExcelDate(row.acceso_created_at),
        ]),
      },
      hasAccess ? "usuarios_con_acceso.xlsx" : "usuarios_sin_acceso.xlsx",
    );
  }

  async function configure(values) {
    const result = await state.configureAccess(values);
    showFeedback(
      result.success ? "success" : "error",
      result.success ? "Acceso creado correctamente." : result.message,
    );
    return result;
  }

  async function handleResend() {
    if (!resendTarget) return;

    const result = await state.resendCredentials({
      integranteId: resendTarget.integrante_id,
      enviarCorreo: false,
    });

    if (!result.success) {
      showFeedback("error", result.message);
    } else {
      showFeedback("success", "Contraseña restablecida correctamente.");
    }

    return result;
  }

  async function handleEditEmail(values) {
    const result = await state.updateEmail(values);
    showFeedback(
      result.success ? "success" : "error",
      result.success ? "Correo institucional actualizado correctamente." : result.message,
    );
    return result;
  }

  return (
    <div className="module-page-enter space-y-4 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <UsuariosViewSelector
          viewMode={state.viewMode}
          onViewModeChange={state.setViewMode}
        />
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <ManualButton
            to="/usuarios/manual"
            state={{ listSearch: location.search }}
            className="w-full sm:w-auto"
          />
          {canDownloadExcel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadExcel}
              disabled={state.loading || Boolean(state.error) || !state.filteredUsuarios.length}
              className="h-10 w-full gap-2 rounded-xl border-emerald-200 bg-white px-4 text-emerald-700 shadow-none hover:bg-emerald-50 hover:text-emerald-800 sm:w-auto"
            >
              <ExcelIcon className="h-4 w-4" />
              Descargar Excel
            </Button>
          )}
        </div>
      </div>

      <UsuariosFilters
        areaFilter={state.areaFilter}
        areaOptions={state.areaOptions}
        loadingAreas={state.loadingAreas}
        cargoFilter={state.cargoFilter}
        cargoOptions={state.cargoOptions}
        loadingCargos={state.loadingCargos}
        dateFilter={state.dateFilter}
        hasFilters={state.hasFilters}
        onAreaFilterChange={state.setAreaFilter}
        onCargoFilterChange={state.setCargoFilter}
        onClearFilters={state.clearFilters}
        onDateFilterChange={state.setDateFilter}
        onSearchChange={state.setSearch}
        onTypeFilterChange={state.setTypeFilter}
        search={state.search}
        typeFilter={state.typeFilter}
      />

      {state.loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <span className="mx-auto mb-3 block h-7 w-7 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-600">Cargando usuarios...</p>
        </section>
      ) : (
        <UsuariosTable
          rows={state.filteredUsuarios}
          onConfigure={setSelected}
          onResendCredentials={setResendTarget}
          onEditEmail={setEditEmailTarget}
          canConfigure={canConfigure}
          canResetPassword={canResetPassword}
          canEditEmail={canEditEmail}
          emptyMessage={
            state.viewMode === "sin_acceso"
              ? "No encontramos usuarios sin acceso"
              : "No encontramos usuarios con acceso"
          }
        />
      )}

      {selected && canConfigure && (
        <ConfigurarAccesoDialog
          key={selected.integrante_id}
          open
          usuario={selected}
          loading={state.saving}
          onOpenChange={(value) => !value && setSelected(null)}
          onSubmit={configure}
          onFeedback={showFeedback}
        />
      )}

      {resendTarget && canResetPassword && (
        <ResendCredentialsDialog
          key={resendTarget.integrante_id}
          open
          usuario={resendTarget}
          loading={state.saving}
          onOpenChange={(value) => !value && setResendTarget(null)}
          onConfirm={handleResend}
          onFeedback={showFeedback}
        />
      )}

      {editEmailTarget && canEditEmail && (
        <EditEmailDialog
          key={editEmailTarget.integrante_id}
          open
          usuario={editEmailTarget}
          loading={state.saving}
          onOpenChange={(value) => !value && setEditEmailTarget(null)}
          onSubmit={handleEditEmail}
          onFeedback={showFeedback}
        />
      )}

      <FeedbackToast
        feedback={activeFeedback}
        onClose={() => {
          if (feedback) {
            setFeedback(null);
          } else {
            state.clearError();
          }
        }}
      />
    </div>
  );
}
