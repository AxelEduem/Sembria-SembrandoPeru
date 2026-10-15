import {
  Activity,
  Braces,
  CalendarClock,
  Database,
  Globe2,
  MonitorSmartphone,
  Route,
  ScrollText,
  Tags,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAvatarUrl } from "@/utils/avatar";

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "medium",
  }).format(new Date(value));
}

function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">{label}</p>
        <div className="mt-1 break-words text-sm font-medium text-slate-700">{children || "—"}</div>
      </div>
    </div>
  );
}

export default function BitacoraDetailDialog({ record, open, onOpenChange }) {
  if (!record) return null;

  const context = Object.entries(record.contexto || {});
  const avatarUrl =
    getAvatarUrl(record.actor?.avatar_url) || getAvatarUrl(record.actor?.avatar_path);
  const successful = record.resultado === "exitoso";
  const entity = record.entidad?.tipo
    ? `${record.entidad.nombre || record.entidad.tipo}${record.entidad.id ? ` (ID #${record.entidad.id})` : ""}`
    : "Sin entidad asociada";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[860px]">
        <header className="shrink-0 border-b border-slate-200 px-6 py-5 sm:px-7">
          <DialogHeader className="pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                <ScrollText className="h-4.5 w-4.5" strokeWidth={1.8} />
              </span>
              <Badge
                variant="outline"
                className={
                  successful
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }
              >
                <span
                  className={`mr-1.5 h-1.5 w-1.5 rounded-full ${successful ? "bg-emerald-500" : "bg-red-500"}`}
                />
                {successful ? "Operación exitosa" : "Operación con error"}
              </Badge>
              <span className="text-xs font-medium text-slate-400">Evento #{record.id}</span>
            </div>
            <DialogTitle className="mt-3 text-xl font-bold tracking-tight text-slate-900">
              Detalle del evento
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Información de trazabilidad registrada automáticamente por el sistema.
            </DialogDescription>
          </DialogHeader>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7">
          <section className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                <Activity className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-[0.08em] text-emerald-700 uppercase">
                  Actividad registrada
                </p>
                <p className="mt-1 text-sm leading-6 font-medium text-slate-700">
                  {record.descripcion}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4">
              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                  Responsable
                </h3>
                <div className="mt-3 flex items-center gap-3">
                  {avatarUrl ? (
                    <EnlargeablePhoto
                      src={avatarUrl}
                      fallbackSrc={getAvatarUrl(record.actor?.avatar_path)}
                      alt={`Foto de ${record.actor?.nombre || "responsable"}`}
                      className="h-12 w-12 rounded-xl border border-slate-200"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700">
                      {initials(record.actor?.nombre)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {record.actor?.nombre || "Usuario no identificado"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {record.actor?.correo || "Sin correo registrado"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-emerald-700">
                      {record.actor?.area || "Sin área asignada"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                  Clasificación
                </h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400">Módulo</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700 capitalize">
                      {record.modulo?.replaceAll("_", " ") || "—"}
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-400">Acción</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700 capitalize">
                      {record.accion?.replaceAll("_", " ") || "—"}
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-400">Entidad relacionada</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{entity}</p>
                  </div>
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 px-4">
              <InfoRow icon={CalendarClock} label="Fecha y hora">
                {formatDate(record.fecha)}
              </InfoRow>
              <InfoRow icon={Route} label="Solicitud">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 font-mono text-blue-700">
                    {record.solicitud?.metodo || "—"}
                  </Badge>
                  <span className="break-all font-mono text-xs font-normal text-slate-600">
                    /api/{record.solicitud?.ruta || "—"}
                  </span>
                </div>
              </InfoRow>
              <InfoRow icon={Database} label="Respuesta del servidor">
                <span className={successful ? "text-emerald-700" : "text-red-700"}>
                  HTTP {record.solicitud?.estado_http || "—"}
                </span>
              </InfoRow>
              <InfoRow icon={Globe2} label="Dirección IP">
                <span className="font-mono text-xs">{record.solicitud?.ip || "No disponible"}</span>
              </InfoRow>
            </section>
          </div>

          <section className="mt-5 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold text-slate-800">Campos involucrados</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {record.campos_modificados?.length ? (
                record.campos_modificados.map((field) => (
                  <Badge
                    key={field}
                    variant="outline"
                    className="rounded-lg border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-medium text-slate-600"
                  >
                    {field}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-400">No se registraron campos modificados.</span>
              )}
            </div>
          </section>

          {context.length > 0 && (
            <section className="mt-4 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <Braces className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
                <h3 className="text-sm font-semibold text-slate-800">Contexto de la operación</h3>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {context.map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="font-mono text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                      {key}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-700">{String(value)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                Dispositivo y navegador
              </p>
              <p className="mt-1 break-all text-xs leading-5 text-slate-500">
                {record.solicitud?.user_agent || "No disponible"}
              </p>
            </div>
          </section>
        </div>

        <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:px-7">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-10 rounded-xl px-5">
              Cerrar
            </Button>
          </DialogClose>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
