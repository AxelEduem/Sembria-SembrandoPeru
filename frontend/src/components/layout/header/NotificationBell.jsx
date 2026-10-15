import { Bell, Check, CheckCheck, ChevronRight, Inbox, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import useNotificaciones from "@/hooks/useNotificaciones";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const PANEL_ID = "notifications-panel";
const MOBILE_BREAKPOINT = 640;

function getNotificationDestination(item, profile) {
  const type = String(item?.tipo || "");

  if (type === "cumpleanos_proximo") {
    return hasPermission(profile, PERMISSIONS.CUMPLEANOS_VER) ? "/cumpleanos" : null;
  }

  if (type.startsWith("periodo_")) {
    return hasPermission(profile, PERMISSIONS.INTEGRANTES_VER) ? "/integrantes" : null;
  }

  if (type.startsWith("gp_convocatoria_")) {
    return hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_VER)
      ? "/gestion-proyectos/detecta/convocatorias"
      : null;
  }

  if (type === "agenda_solicitud_reunion") {
    return "/agenda/reuniones?vista=solicitudes";
  }
  if (type.startsWith("agenda_")) return "/agenda/reuniones";
  if (type.startsWith("tarea_")) return "/tareas";
  if (type.startsWith("cambio_horario_")) return "/cambiar-horario";
  if (type.startsWith("permiso_")) return "/asistencia/solicitudes";
  if (type.startsWith("apelacion_")) return "/asistencia/faltas";
  if (
    [
      "tardanza_aprobada",
      "tardanza_rechazada",
      "salida_aprobada",
      "salida_rechazada",
      "falta_aprobada",
      "falta_rechazada",
    ].includes(type)
  ) {
    return "/asistencia/solicitudes";
  }
  if (type === "cierre_administrativo") return "/asistencia/historial";
  if (
    ["inicio_proximo", "entrada_pendiente", "salida_proxima", "jornada_sin_cerrar"].includes(type)
  ) {
    return "/asistencia";
  }

  return null;
}

export default function NotificationBell() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { items, unreadCount, loading, markRead, markAllRead, remove, removeAll } =
    useNotificaciones(profile);
  const [open, setOpen] = useState(false);
  const [offsets, setOffsets] = useState({});
  const [panelStyle, setPanelStyle] = useState({});
  const [bulkAction, setBulkAction] = useState(null);
  const starts = useRef({});
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const countLabel = unreadCount > 99 ? "99+" : unreadCount;

  useEffect(() => {
    const outside = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const escape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;

    const updatePanelPosition = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const viewportPadding = 12;
      const width = Math.min(400, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(viewportPadding, trigger.right - width),
        window.innerWidth - width - viewportPadding,
      );

      setPanelStyle({ top: trigger.bottom + 10, left, width });
    };

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open]);

  const startSwipe = (event, id) => {
    if (window.innerWidth >= MOBILE_BREAKPOINT) return;
    starts.current[id] = event.touches[0].clientX;
  };

  const moveSwipe = (event, id) => {
    if (window.innerWidth >= MOBILE_BREAKPOINT) return;
    const currentX = event.touches[0].clientX;
    const delta = currentX - (starts.current[id] ?? currentX);
    setOffsets((current) => ({
      ...current,
      [id]: Math.max(-96, Math.min(0, delta)),
    }));
  };

  const endSwipe = async (id) => {
    if (window.innerWidth >= MOBILE_BREAKPOINT) return;
    if ((offsets[id] || 0) < -80) {
      await remove(id);
      return;
    }
    setOffsets((current) => ({ ...current, [id]: 0 }));
  };

  const handleMarkAllRead = async () => {
    setBulkAction("read");
    try {
      await markAllRead();
    } finally {
      setBulkAction(null);
    }
  };

  const handleRemoveAll = async () => {
    setBulkAction("remove");
    try {
      await removeAll(items.map((item) => item.id));
    } finally {
      setBulkAction(null);
    }
  };

  const handleNotificationClick = (item, destination) => {
    if (!destination) return;

    if (!item.read_at) {
      markRead(item.id).catch(() => undefined);
    }

    setOpen(false);
    navigate(destination);
  };

  return (
    <div ref={triggerRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={unreadCount ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"}
        aria-controls={PANEL_ID}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
          open
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-emerald-700"
        }`}
      >
        <Bell
          aria-hidden="true"
          className={`h-5 w-5 ${open ? "fill-emerald-100" : "fill-transparent"}`}
          strokeWidth={1.8}
        />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] leading-none font-bold text-white shadow-sm">
            {countLabel}
          </span>
        ) : null}
      </button>

      {open
        ? createPortal(
            <section
              ref={panelRef}
              id={PANEL_ID}
              role="dialog"
              aria-label="Panel de notificaciones"
              style={panelStyle}
              className="fixed z-50 origin-top-right overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
            >
              <header className="border-b border-slate-100 bg-white px-5 py-4">
                <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-700 uppercase">
                  Bandeja personal
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                  Notificaciones
                </h2>
                {items.length ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={!unreadCount || bulkAction !== null}
                      onClick={handleMarkAllRead}
                      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-pointer disabled:opacity-45"
                    >
                      <CheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
                      Marcar todas como leídas
                    </button>
                    <button
                      type="button"
                      disabled={bulkAction !== null}
                      onClick={handleRemoveAll}
                      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none disabled:cursor-pointer disabled:opacity-45"
                    >
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      Borrar todas
                    </button>
                  </div>
                ) : null}
              </header>

              <div className="max-h-[min(27rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain bg-slate-50 p-2.5">
                {loading ? (
                  <div aria-label="Cargando notificaciones" className="space-y-2">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4"
                      >
                        <div className="h-3 w-2/5 rounded bg-slate-200" />
                        <div className="mt-2 h-2.5 w-full rounded bg-slate-100" />
                        <div className="mt-1.5 h-2.5 w-3/4 rounded bg-slate-100" />
                      </div>
                    ))}
                  </div>
                ) : items.length ? (
                  <div className="space-y-2">
                    {items.map((item) => {
                      const isUnread = !item.read_at;
                      const destination = getNotificationDestination(item, profile);

                      return (
                        <article
                          key={item.id}
                          className="relative overflow-hidden rounded-2xl bg-rose-500 sm:bg-transparent"
                        >
                          <div
                            aria-hidden="true"
                            className="absolute inset-y-0 right-0 flex w-20 items-center justify-center text-white sm:hidden"
                          >
                            <Trash2 className="h-4 w-4" />
                          </div>
                          <div
                            className="group relative rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_6px_18px_rgba(15,23,42,0.07)]"
                            style={{
                              transform: `translateX(${offsets[item.id] || 0}px)`,
                            }}
                            onTouchStart={(event) => startSwipe(event, item.id)}
                            onTouchMove={(event) => moveSwipe(event, item.id)}
                            onTouchEnd={() => endSwipe(item.id)}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                disabled={!destination}
                                onClick={() => handleNotificationClick(item, destination)}
                                className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-xl text-left focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-default"
                              >
                                <span
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                                    isUnread
                                      ? "bg-amber-50 text-amber-600 ring-amber-100"
                                      : "bg-slate-50 text-slate-400 ring-slate-100"
                                  }`}
                                >
                                  <Bell aria-hidden="true" className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-xs leading-5 font-bold text-slate-800">
                                      {item.titulo}
                                    </h3>
                                    {isUnread ? (
                                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                                    ) : null}
                                  </div>
                                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                                    {item.mensaje}
                                  </p>
                                </span>
                                {destination ? (
                                  <ChevronRight
                                    aria-hidden="true"
                                    className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-emerald-600"
                                  />
                                ) : null}
                              </button>
                            </div>
                            <div className="mt-2.5 flex items-center justify-between gap-2 pl-12">
                              {isUnread ? (
                                <button
                                  type="button"
                                  onClick={() => markRead(item.id)}
                                  className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-emerald-700 transition-colors hover:text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                                >
                                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                                  Marcar como leída
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                  <CheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
                                  Leída
                                </span>
                              )}
                              <button
                                type="button"
                                aria-label={`Eliminar notificación: ${item.titulo}`}
                                onClick={() => remove(item.id)}
                                className="hidden h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none sm:inline-flex"
                              >
                                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-emerald-50/60">
                      <Inbox aria-hidden="true" className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-sm font-bold text-slate-800">Estás al día</p>
                    <p className="mt-1 max-w-60 text-xs leading-5 text-slate-500">
                      No hay notificaciones pendientes por revisar.
                    </p>
                  </div>
                )}
              </div>
            </section>,
            document.body,
          )
        : null}
    </div>
  );
}
