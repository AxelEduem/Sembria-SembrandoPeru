import { useState, useMemo } from "react";
import { useCumpleanos } from "@/hooks/useCumpleanos";
import CumpleanosFilters from "./CumpleanosFilters";
import CumpleanosList from "./CumpleanosList";
import CumpleanosSidebar from "./CumpleanosSidebar";
import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";
import ManualButton from "@/components/ui/ManualButton";
import { BarChart3, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  downloadExcel,
  formatExcelDate,
} from "@/utils/excelExport";
import { getAgeAtBirthday } from "@/utils/cumpleanosUtils";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const TYPE_OPTIONS = [
  { value: "voluntario", label: "Voluntario" },
  { value: "practicante", label: "Practicante" },
  { value: "gerente", label: "Gerente" },
];

export default function CumpleanosPageContent() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const canDownloadExcel = hasPermission(
    profile,
    PERMISSIONS.CUMPLEANOS_DESCARGAR_EXCEL,
  );
  const canViewMetrics = hasPermission(profile, PERMISSIONS.CUMPLEANOS_VER_METRICAS);
  const canPrintSchedule = hasPermission(
    profile,
    PERMISSIONS.CUMPLEANOS_IMPRIMIR_HORARIO,
  );
  const {
    rows,
    upcomingRows,
    loading,
    error,
    range,
    setRange,
  } = useCumpleanos();

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [view, setView] = useState("list");

  const [calendarMonth, setCalendarMonth] = useState(
    () =>
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      ),
  );

  const [birthdayPage, setBirthdayPage] = useState(1);

  const birthdayPageSize = 10;

  const [exporting, setExporting] = useState(false);

  

  const areaOptions = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map((row) => row.area)
          .filter(Boolean)
          .map((value) => String(value)),
      ),
    ).sort((a, b) =>
      a.localeCompare(b, "es"),
    );
  }, [rows]);

  

  const filteredRows = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("es-PE");

    return upcomingRows.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        String(row.nombre || "")
          .toLocaleLowerCase("es-PE")
          .includes(normalizedSearch);

      const matchesArea =
        areaFilter === "all" ||
        String(row.area || "") === areaFilter;

      const matchesType =
        typeFilter === "all" ||
        String(row.tipo_integrante || "") ===
          typeFilter;

      return (
        matchesSearch &&
        matchesArea &&
        matchesType
      );
    });
  }, [
    upcomingRows,
    search,
    areaFilter,
    typeFilter,
  ]);

  

  const nextBirthday =
    upcomingRows[0] ||
    rows[0] ||
    null;

  const nextThree = useMemo(() => {
    if (!upcomingRows.length) {
      return [];
    }

    return upcomingRows
      .filter(
        (row) =>
          row.id !==
          nextBirthday?.id,
      )
      .slice(0, 3);
  }, [
    upcomingRows,
    nextBirthday,
  ]);

  

  const birthdayTotalPages = Math.max(
    1,
    Math.ceil(
      filteredRows.length /
        birthdayPageSize,
    ),
  );

  const safeBirthdayPage = Math.min(
    birthdayPage,
    birthdayTotalPages,
  );

  const paginatedBirthdayRows =
    useMemo(() => {
      const start =
        (safeBirthdayPage - 1) *
        birthdayPageSize;

      return filteredRows.slice(
        start,
        start + birthdayPageSize,
      );
    }, [
      filteredRows,
      safeBirthdayPage,
    ]);

  

  const hasFilters =
    Boolean(search.trim()) ||
    areaFilter !== "all" ||
    typeFilter !== "all" ||
    range !== 365;

  const rangeLabel =
    range === 365
      ? "todos los próximos cumpleaños"
      : `${range} días`;

  

  const resetFilters = () => {
    setSearch("");
    setAreaFilter("all");
    setTypeFilter("all");
    setRange(365);
    setBirthdayPage(1);
  };

  const updateFilter = (setter) => (value) => {
    setter(value);
    setBirthdayPage(1);
  };

  

  const handleDownloadExcel = async () => {
    if (
      !canDownloadExcel ||
      exporting ||
      loading ||
      !filteredRows.length
    ) {
      return;
    }

    setExporting(true);

    try {
      await downloadExcel(
        {
          headers: [
            "Nombre",
            "Área",
            "Cargo",
            "Cumpleaños",
            "Edad",
            "Días restantes",
          ],

          data: filteredRows.map((row) => [
            row.nombre || "-",
            row.area || "Sin área",
            row.cargo || "Sin cargo",
            formatExcelDate(
              row.cumpleanos,
            ),
            getAgeAtBirthday(row) ?? "-",
            row.dias_restantes ?? "-",
          ]),
        },
        "cumpleanos.xls",
      );
    } finally {
      setExporting(false);
    }
  };

  

  const handlePrint = () => {
    if (!canPrintSchedule || loading) return;

    setView("calendar");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const printArea = document.querySelector(
          ".cumpleanos-print-area",
        );

        if (!printArea) return;

        // Clonamos el calendario dentro de un "portal" insertado
        // directamente como hijo de <body>. Así, sin importar cómo
        // esté armado el layout (topbar, sidebar, etc.), solo
        // necesitamos ocultar los hijos directos de body y centrar
        // este portal con flexbox de forma confiable.
        const portal = document.createElement("div");
        portal.id = "cumpleanos-print-portal";
        portal.appendChild(printArea.cloneNode(true));
        document.body.appendChild(portal);

        document.body.classList.add("cumpleanos-printing");

        const cleanup = () => {
          document.body.classList.remove("cumpleanos-printing");
          portal.remove();
          window.removeEventListener("afterprint", cleanup);
        };

        window.addEventListener("afterprint", cleanup);
        window.print();
      });
    });
  };

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 font-semibold">
          !
        </div>

        <span>{error}</span>
      </div>
    );
  }

  

  return (
    <div className="space-y-4 cumpleanos-page">
      

      <div className="module-section-enter module-enter-delay-1 cumpleanos-print-hidden flex flex-wrap justify-end gap-2">
        {canViewMetrics && (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/cumpleanos/metricas")}
            className="h-10 gap-2 rounded-xl border-blue-200 bg-white px-4 text-blue-700 shadow-none hover:bg-blue-50 hover:text-blue-800"
          >
            <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
            Métricas
          </Button>
        )}

        {canDownloadExcel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadExcel}
            disabled={exporting || loading || !filteredRows.length}
            className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-4 text-slate-700 shadow-none hover:bg-slate-50"
          >
            <ExcelIcon className="h-4 w-4" />

            {exporting ? "Exportando..." : "Descargar Excel"}
          </Button>
        )}

        <ManualButton to="/cumpleanos/manual" />

        {canPrintSchedule && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            disabled={loading}
            className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-4 text-slate-600 shadow-none hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" strokeWidth={1.8} />

            Imprimir Horario
          </Button>
        )}
      </div>

      

      <CumpleanosFilters
        range={range}
        search={search}
        areaFilter={areaFilter}
        typeFilter={typeFilter}
        areaOptions={areaOptions}
        typeOptions={TYPE_OPTIONS}
        onRangeChange={updateFilter(setRange)}
        onSearchChange={updateFilter(setSearch)}
        onAreaFilterChange={updateFilter(setAreaFilter)}
        onTypeFilterChange={updateFilter(setTypeFilter)}
        onClear={resetFilters}
      />

      

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr] xl:items-start cumpleanos-main-grid">
        <CumpleanosList
          view={view}
          setView={setView}
          filteredRows={filteredRows}
          paginatedRows={
            paginatedBirthdayRows
          }
          loading={loading}
          hasFilters={hasFilters}
          resetFilters={resetFilters}
          calendarMonth={calendarMonth}
          setCalendarMonth={
            setCalendarMonth
          }
          rangeLabel={rangeLabel}
          birthdayPage={
            safeBirthdayPage
          }
          setBirthdayPage={
            setBirthdayPage
          }
          birthdayTotalPages={
            birthdayTotalPages
          }
          birthdayPageSize={
            birthdayPageSize
          }
        />

        <CumpleanosSidebar
          nextBirthday={
            nextBirthday
          }
          nextThree={nextThree}
          loading={loading}
        />
      </section>
    </div>
  );
}
