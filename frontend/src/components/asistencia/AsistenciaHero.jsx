import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

function formatClock(date) {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Lima",
  }).format(date);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Lima",
  }).format(date);
}

function getFullName(profile) {
  return profile?.nombres?.trim() || "Usuario";
}

function AsistenciaHero({
  profile,
  realtimeStatus = "connecting",
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const fullName = getFullName(profile);

  return (
    <section
      className="
        asistencia-section-enter
        relative
        mb-6
        overflow-hidden
        rounded-[26px]
        border
        border-slate-200
        bg-white
        shadow-[0_10px_35px_rgba(15,23,42,0.06)]
      "
    >
      {/* Decoración */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="
            absolute
            -right-20
            -top-20
            h-64
            w-64
            rounded-full
            bg-emerald-50
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -bottom-24
            left-1/3
            h-56
            w-56
            rounded-full
            bg-slate-50
            blur-3xl
          "
        />

        <div
          className="
            absolute
            left-[43%]
            top-1/2
            hidden
            h-52
            w-52
            -translate-y-1/2
            rounded-full
            border
            border-emerald-50
            lg:block
          "
        />
      </div>

      <div className="relative z-10 grid lg:grid-cols-[1fr_auto]">
        {/* =========================================================
            LADO IZQUIERDO
           ========================================================= */}
        <div
          className="
            flex
            min-w-0
            flex-col
            justify-center
            px-6
            py-7
            sm:px-8
            sm:py-8
            lg:min-h-[260px]
            lg:px-9
            lg:py-8
          "
        >
          <div className="max-w-2xl">
            <span
              className="
                inline-flex
                items-center
                rounded-full
                border
                border-emerald-100
                bg-emerald-50/70
                px-3
                py-1.5
                text-[10px]
                font-bold
                tracking-[0.1em]
                text-emerald-700
                uppercase
              "
            >
              Mi jornada
            </span>

            <h1
              className="
                mt-4
                text-[28px]
                font-extrabold
                leading-tight
                tracking-tight
                text-slate-900
                sm:text-[31px]
                lg:text-[34px]
              "
            >
              {fullName}
            </h1>

            <p
              className="
                mt-2
                max-w-xl
                text-sm
                font-medium
                leading-6
                text-slate-500
                sm:text-[15px]
              "
            >
              Consulta y registra tu asistencia de acuerdo con los bloques
              programados para hoy.
            </p>

            <div className="mt-5 h-px w-14 bg-emerald-200" />

            <p
              className="
                mt-3
                max-w-lg
                text-[11px]
                leading-5
                text-slate-400
              "
            >
              Tu jornada se registra de forma independiente en cada bloque de
              tu horario.
            </p>
          </div>
        </div>

        {/* =========================================================
            RELOJ
           ========================================================= */}
        <div
          className="
            relative
            flex
            min-h-[215px]
            min-w-0
            flex-col
            items-center
            justify-center
            border-t
            border-slate-200
            bg-slate-50/80
            px-6
            py-7
            lg:min-h-[260px]
            lg:w-[350px]
            lg:border-l
            lg:border-t-0
          "
        >
          {/* Anillo decorativo */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="
                asistencia-clock-ring
                absolute
                left-1/2
                top-1/2
                h-36
                w-36
                -translate-x-1/2
                -translate-y-1/2
                rounded-full
                border
                border-emerald-100/80
              "
            />
          </div>

          <div className="relative z-10 text-center">
            <p
              className="
                text-[10px]
                font-bold
                tracking-[0.16em]
                text-slate-400
                uppercase
              "
            >
              Hora oficial
            </p>

            <div
              className="
                mt-1.5
                font-mono
                text-4xl
                font-bold
                tracking-tight
                text-slate-900
                sm:text-[44px]
              "
              aria-live="polite"
            >
              {formatClock(now)}
            </div>

            <div className="mt-2.5 flex items-center justify-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-600" />

              <p
                className="
                  text-xs
                  font-semibold
                  capitalize
                  text-slate-600
                "
              >
                {formatDate(now)}
              </p>
            </div>

            <div
              className="
                mt-4
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-slate-200
                bg-white
                px-3
                py-1.5
                shadow-sm
              "
            >
              <span
                className={`
                  h-1.5
                  w-1.5
                  rounded-full
                  ${
                    realtimeStatus === "synced"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }
                `}
              />

              <span className="text-[10px] font-medium text-slate-500">
                {realtimeStatus === "synced"
                  ? "Sincronizado"
                  : "Reconectando…"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AsistenciaHero;