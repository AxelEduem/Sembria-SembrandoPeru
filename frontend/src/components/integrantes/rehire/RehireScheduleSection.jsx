import HorarioGrid from "@/components/integrantes/form/horario/HorarioGrid";
import { useRehireFormContext } from "@/contexts/RehireFormContext";

export default function RehireScheduleSection() {
  const { horariosState, saving, fechaInicio, fechaFin } = useRehireFormContext();

  return (
    <div>
      <HorarioGrid
        horarios={horariosState.horarios}
        onChange={horariosState.setHorarioLocal}
        disabled={saving}
        canSelect={Boolean(fechaInicio && fechaFin)}
        error={horariosState.error}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
      />
    </div>
  );
}