import {
  BriefcaseBusiness,
  Clock3,
  GraduationCap,
  IdCard,
  Phone,
  UserRound,
  MapPin, // Nuevo ícono
} from "lucide-react";
import { useIntegranteDetailContext } from "@/contexts/IntegranteDetailContext";
import { formatDate } from "@/utils/formatters";
import InfoCard from "./InfoCard";

export default function MainInfoSection() {
  const { row, isPracticante, tipoIntegrante, currentHistory } = useIntegranteDetailContext();

  if (!row) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">Información del integrante</h2>
        <p className="mt-1 text-sm text-slate-500">Información institucional y datos del periodo.</p>
      </div>

      <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard icon={UserRound} label="Fecha de nacimiento" value={formatDate(row.fecha_nacimiento)} />
        <InfoCard icon={IdCard} label="Documento de identidad" value={row.documento_identidad} />
        <InfoCard icon={IdCard} label="Tipo de documento" value={row.tipo_documento} />
        <InfoCard icon={Phone} label="Teléfono" value={row.telefono} copyValue={row.telefono} copyLabel="teléfono" />
        <InfoCard icon={BriefcaseBusiness} label="Modalidad" value={row.modalidad} />
        <InfoCard icon={BriefcaseBusiness} label="Área" value={row.area} />
        <InfoCard icon={BriefcaseBusiness} label="Cargo" value={row.cargo} />
        {tipoIntegrante !== "gerente" && (
          <InfoCard
            icon={Clock3}
            label="Periodo"
            value={`${currentHistory?.periodo_meses || row.periodo_meses || "-"} meses`}
          />
        )}

        {/* Nuevas tarjetas de ubicación */}
        <InfoCard icon={MapPin} label="Departamento" value={row.departamento} />
        <InfoCard icon={MapPin} label="Ciudad / Provincia" value={row.ciudad} />
        <InfoCard icon={MapPin} label="Distrito" value={row.distrito} />

        {isPracticante && (
          <>
            <InfoCard
              icon={GraduationCap}
              label="Institución educativa"
              value={currentHistory?.institucion_educativa || row.institucion_educativa}
            />
            <InfoCard icon={GraduationCap} label="Carrera" value={row.carrera} />
            <InfoCard icon={GraduationCap} label="Ciclo" value={row.ciclo} />
            <InfoCard
              icon={Clock3}
              label="Horas prácticas requeridas"
              value={
                currentHistory?.horas_practicas_requeridas || row.horas_practicas_requeridas
                  ? `${currentHistory?.horas_practicas_requeridas || row.horas_practicas_requeridas} horas`
                  : "-"
              }
            />
          </>
        )}
      </div>
    </section>
  );
}
