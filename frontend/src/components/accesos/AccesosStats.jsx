import { memo, useCallback, useEffect, useRef, useState } from "react";

import { AppWindow, ChevronLeft, ChevronRight } from "lucide-react";

const statsAnimationStyles = `
  @keyframes accesosStatEnter {
    0% { opacity: 0; transform: translateY(12px) scale(0.985); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .accesos-stat-enter {
    animation: accesosStatEnter 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .accesos-stats-track {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .accesos-stats-track::-webkit-scrollbar {
    display: none;
  }
  .accesos-stat-card {
    flex: 0 0 100%;
  }
  @media (min-width: 768px) {
    .accesos-stat-card {
      flex-basis: calc((100% - 1rem) / 2);
    }
  }
  @media (min-width: 1280px) {
    .accesos-stat-card {
      flex-basis: calc((100% - 2rem) / 3);
    }
  }
  @media (prefers-reduced-motion: reduce) { .accesos-stat-enter { animation: none; } }
`;

function CircularProgress({ percent, color = "#2D5A3D", trackColor = "#E5E7EB" }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;

  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="132" height="132" viewBox="0 0 116 116">
      <circle cx="58" cy="58" r={radius} stroke={trackColor} strokeWidth="7" fill="none" />

      <circle
        cx="58"
        cy="58"
        r={radius}
        stroke={color}
        strokeWidth="7"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 58 58)"
      />
    </svg>
  );
}

function AppLogo({ aplicacion }) {
  if (aplicacion.imagen_url) {
    return (
      <img
        src={aplicacion.imagen_url}
        alt={aplicacion.nombre}
        className="h-11 w-11 rounded-xl border border-slate-200 bg-white object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
      <AppWindow className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
    </div>
  );
}

function AccesosStats({ stats, loading = false }) {
  const trackRef = useRef(null);
  const [scrollState, setScrollState] = useState({ canGoBack: false, canGoForward: false });

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScrollLeft = Math.max(track.scrollWidth - track.clientWidth, 0);
    const nextState = {
      canGoBack: track.scrollLeft > 2,
      canGoForward: track.scrollLeft < maxScrollLeft - 2,
    };

    setScrollState((current) =>
      current.canGoBack === nextState.canGoBack && current.canGoForward === nextState.canGoForward
        ? current
        : nextState,
    );
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const frame = window.requestAnimationFrame(updateScrollState);
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(track);
    track.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      track.removeEventListener("scroll", updateScrollState);
    };
  }, [stats.length, updateScrollState]);

  function moveCarousel(direction) {
    const track = trackRef.current;
    if (!track) return;

    track.scrollBy({
      left: direction * (track.clientWidth + 16),
      behavior: "smooth",
    });
  }

  if (loading) {
    return (
      <>
        <style>{statsAnimationStyles}</style>
        <section aria-label="Cargando estado de licencias">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>

          <div className="accesos-stats-track flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }, (_, index) => (
              <article
                key={index}
                style={{ animationDelay: `${80 + index * 70}ms` }}
                className="accesos-stat-card accesos-stat-enter rounded-2xl border border-t-4 border-slate-200 border-t-emerald-200 bg-white p-5 shadow-[0_5px_16px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-[132px] w-[132px] shrink-0 items-center justify-center rounded-full border-[7px] border-slate-100">
                    <div className="h-8 w-14 animate-pulse rounded bg-slate-200" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-emerald-50" />
                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                        <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                    <div className="mt-5 flex gap-3">
                      <div className="h-10 w-16 animate-pulse rounded-lg bg-slate-100" />
                      <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-100" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <style>{statsAnimationStyles}</style>
      {stats.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                Aplicaciones
              </p>
              <h2 className="mt-1 text-sm font-semibold text-slate-800">Estado de licencias</h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => moveCarousel(-1)}
                disabled={!scrollState.canGoBack}
                aria-label="Ver aplicaciones anteriores"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 disabled:shadow-none"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => moveCarousel(1)}
                disabled={!scrollState.canGoForward}
                aria-label="Ver aplicaciones siguientes"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 disabled:shadow-none"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div
            ref={trackRef}
            className="accesos-stats-track flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
          >
            {stats.map((aplicacion) => (
              <article
                key={aplicacion.id}
                className="accesos-stat-card snap-start rounded-2xl border border-t-4 border-slate-200 border-t-emerald-500 bg-white p-5 shadow-[0_5px_16px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative shrink-0">
                    <CircularProgress percent={aplicacion.percent} />

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[22px] leading-none font-bold tracking-tight text-slate-900">
                        {aplicacion.ocupadas}

                        <span className="text-base text-slate-500">
                          /{aplicacion.licencias_total}
                        </span>
                      </span>

                      <span className="mt-1 text-center text-[11px] leading-3 text-slate-500">
                        licencias
                        <br />
                        ocupadas
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <AppLogo aplicacion={aplicacion} />

                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold tracking-tight text-slate-900">
                          {aplicacion.nombre}
                        </h2>

                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                          {aplicacion.descripcion || "Sin descripcion"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center">
                      <div className="min-w-[65px] text-center">
                        <p className="text-xl leading-none font-bold text-emerald-600">
                          {aplicacion.ocupadas}
                        </p>

                        <p className="mt-1 text-[11px] font-medium text-slate-500">activos</p>
                      </div>

                      <span className="mx-3 h-9 w-px bg-slate-200" />

                      <div className="min-w-[74px] text-center">
                        <p className="text-xl leading-none font-bold text-slate-500">
                          {aplicacion.disponibles}
                        </p>

                        <p className="mt-1 text-[11px] font-medium text-slate-500">disponibles</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <AppWindow className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.7} />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            Aun no existen aplicaciones registradas.
          </p>
        </section>
      )}
    </>
  );
}

export default memo(AccesosStats);
