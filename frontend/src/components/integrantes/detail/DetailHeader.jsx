import { ArrowLeft, CheckCircle2, ImagePlus, Mail, Save, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIntegranteDetailContext } from "@/contexts/IntegranteDetailContext";
import { getInitials } from "@/utils/formatters";
import { getAvatarUrl } from "@/utils/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import CopyValueButton from "@/components/ui/CopyValueButton";

export default function DetailHeader({
  showBackButton = true,
  photoPreview = "",
  selectedPhoto = null,
  savingPhoto = false,
  onPhotoChange,
  onSavePhoto,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { row, tipoIntegrante } = useIntegranteDetailContext();
  const avatarUrl = row
    ? photoPreview || getAvatarUrl(row.avatar_url) || getAvatarUrl(row.avatar_path)
    : null;
  const canEditPhoto = Boolean(onPhotoChange);

  if (!row) return null;

  return (
    <>
      {showBackButton && (
        <button
          type="button"
          onClick={() => navigate("/integrantes" + (location.state?.listSearch ?? ""))}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Volver a integrantes
        </button>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="h-2 bg-[#2D5A3D]" />
        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <EnlargeablePhoto
                src={avatarUrl}
                fallbackSrc={getAvatarUrl(row.avatar_path)}
                fallback={
                  getInitials(row.nombre) || <UserRound className="h-7 w-7" strokeWidth={1.7} />
                }
                alt={`Foto de ${row.nombre || "integrante"}`}
                className="h-16 w-16 rounded-2xl border border-emerald-100 bg-emerald-50 text-lg font-bold text-emerald-700 transition-transform hover:scale-105"
              />

              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold tracking-[0.12em] text-emerald-700 uppercase">
                    {tipoIntegrante === "practicante" ? "Practicante" : tipoIntegrante === "gerente" ? "Gerente" : "Voluntario"}
                  </span>
                </div>

                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
                  {row.nombre}
                </h1>

                {row.correo && (
                  <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm text-slate-500">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
                    <span className="truncate">{row.correo}</span>
                    <CopyValueButton value={row.correo} label="correo" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {canEditPhoto && (
                <>
                  <input
                    id="profile-detail-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onPhotoChange}
                    disabled={savingPhoto}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-detail-photo"
                    className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <ImagePlus className="h-4 w-4" strokeWidth={1.8} />
                    {selectedPhoto ? "Cambiar foto" : "Editar foto"}
                  </label>

                  {selectedPhoto && (
                    <button
                      type="button"
                      onClick={onSavePhoto}
                      disabled={savingPhoto}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2D5A3D] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#234B32] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" strokeWidth={1.8} />
                      {savingPhoto ? "Guardando..." : "Guardar foto"}
                    </button>
                  )}
                </>
              )}

              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4">
                <CheckCircle2
                  className={`h-4 w-4 ${row.activo ? "text-emerald-600" : "text-slate-400"}`}
                  strokeWidth={1.8}
                />
                <div>
                  <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                    Estado
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {row.activo ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
