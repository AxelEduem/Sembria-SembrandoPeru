<?php

namespace App\Services\Asistencia;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PeruHolidayService
{
    public const OFFICIAL_SOURCE = 'https://www.gob.pe/feriados';

    public function syncYear(int $year): int
    {
        if ($year < 2000 || $year > 2100) {
            throw ValidationException::withMessages(['anio' => 'El año debe estar entre 2000 y 2100.']);
        }

        $synced = 0;
        DB::transaction(function () use ($year, &$synced): void {
            foreach ($this->nationalHolidays($year) as $holiday) {
                $existing = DB::table('asistencia_dias_no_laborables')
                    ->where('fecha', $holiday['fecha'])
                    ->lockForUpdate()
                    ->first();
                $requiresAttendance = $existing !== null && (bool) $existing->requiere_asistencia;

                $official = [
                    'nombre' => $holiday['nombre'],
                    'tipo' => 'feriado_nacional',
                    'origen' => 'calendario_oficial_peru',
                    'es_oficial' => true,
                    'norma' => $holiday['norma'],
                    'fuente_url' => self::OFFICIAL_SOURCE,
                    'activo' => true,
                    'sincronizado_at' => now(),
                    'updated_at' => now(),
                ];

                if ($existing === null) {
                    DB::table('asistencia_dias_no_laborables')->insert($official + [
                        'fecha' => $holiday['fecha'],
                        'requiere_asistencia' => false,
                        'registrado_por' => null,
                        'created_at' => now(),
                    ]);
                } else {
                    DB::table('asistencia_dias_no_laborables')
                        ->where('id', $existing->id)
                        ->update($official);
                }

                if (! $requiresAttendance) {
                    $this->reconcileNonWorkingDate($holiday['fecha'], null);
                }

                $synced++;
            }
        });

        return $synced;
    }

    public function syncCurrentAndNextYear(): int
    {
        $year = CarbonImmutable::now('America/Lima')->year;

        return $this->syncYear($year) + $this->syncYear($year + 1);
    }

    public function nationalHolidays(int $year): array
    {
        $easter = $this->easterSunday($year);
        $fixed = [
            ['01-01', 'Año Nuevo'],
            ['05-01', 'Día del Trabajo'],
            ['06-07', 'Batalla de Arica y Día de la Bandera'],
            ['06-29', 'San Pedro y San Pablo'],
            ['07-23', 'Día de la Fuerza Aérea del Perú'],
            ['07-28', 'Fiestas Patrias'],
            ['07-29', 'Fiestas Patrias'],
            ['08-06', 'Batalla de Junín'],
            ['08-30', 'Santa Rosa de Lima'],
            ['10-08', 'Combate de Angamos'],
            ['11-01', 'Día de Todos los Santos'],
            ['12-08', 'Inmaculada Concepción'],
            ['12-09', 'Batalla de Ayacucho'],
            ['12-25', 'Navidad'],
        ];
        $holidays = collect($fixed)->map(fn (array $holiday): array => [
            'fecha' => "{$year}-{$holiday[0]}",
            'nombre' => $holiday[1],
            'norma' => 'Decreto Legislativo N.º 713 y modificatorias',
        ]);
        $holidays->push(
            ['fecha' => $easter->subDays(3)->toDateString(), 'nombre' => 'Jueves Santo', 'norma' => 'Decreto Legislativo N.º 713'],
            ['fecha' => $easter->subDays(2)->toDateString(), 'nombre' => 'Viernes Santo', 'norma' => 'Decreto Legislativo N.º 713'],
        );

        return $holidays->sortBy('fecha')->values()->all();
    }

    public function calendar(CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        return DB::table('asistencia_dias_no_laborables')
            ->where('activo', true)
            ->whereBetween('fecha', [$from->toDateString(), $to->toDateString()])
            ->orderBy('fecha')
            ->get();
    }

    public function day(CarbonImmutable|string $date): ?object
    {
        $dateString = $date instanceof CarbonImmutable ? $date->toDateString() : $date;

        return DB::table('asistencia_dias_no_laborables')
            ->whereDate('fecha', $dateString)
            ->where('activo', true)
            ->first();
    }

    public function isNonWorkingDay(CarbonImmutable|string $date): bool
    {
        $day = $this->day($date);

        return $day !== null && ! (bool) $day->requiere_asistencia;
    }

    public function addInstitutionalDay(string $accountId, string $date, string $name): object
    {
        return DB::transaction(function () use ($accountId, $date, $name): object {
            $existing = DB::table('asistencia_dias_no_laborables')->where('fecha', $date)->lockForUpdate()->first();
            $values = [
                'activo' => true,
                'requiere_asistencia' => false,
                'modificado_por' => $accountId,
                'motivo_modificacion' => 'Configurado como día sin asistencia por la organización.',
                'updated_at' => now(),
            ];

            if ($existing === null) {
                $id = DB::table('asistencia_dias_no_laborables')->insertGetId($values + [
                    'fecha' => $date,
                    'nombre' => $name,
                    'tipo' => 'institucional',
                    'origen' => 'manual',
                    'es_oficial' => false,
                    'registrado_por' => $accountId,
                    'created_at' => now(),
                ]);
            } else {
                if (! (bool) $existing->es_oficial) {
                    $values['nombre'] = $name;
                    $values['tipo'] = 'institucional';
                    $values['origen'] = 'manual';
                }
                DB::table('asistencia_dias_no_laborables')->where('id', $existing->id)->update($values);
                $id = $existing->id;
            }

            $this->reconcileNonWorkingDate($date, $accountId);

            return DB::table('asistencia_dias_no_laborables')->find($id);
        });
    }

    public function updateTreatment(string $accountId, int $id, bool $requiresAttendance, ?string $reason): array
    {
        return DB::transaction(function () use ($accountId, $id, $requiresAttendance, $reason): array {
            $day = DB::table('asistencia_dias_no_laborables')->lockForUpdate()->find($id);
            if ($day === null) {
                throw ValidationException::withMessages(['dia' => 'El día indicado no existe.']);
            }

            DB::table('asistencia_dias_no_laborables')->where('id', $id)->update([
                'activo' => true,
                'requiere_asistencia' => $requiresAttendance,
                'modificado_por' => $accountId,
                'motivo_modificacion' => $reason,
                'updated_at' => now(),
            ]);

            $reconciliation = $requiresAttendance
                ? $this->reconcileWorkingDate((string) $day->fecha, $accountId)
                : $this->reconcileNonWorkingDate((string) $day->fecha, $accountId);

            return [
                'day' => DB::table('asistencia_dias_no_laborables')->find($id),
                'reconciliation' => $reconciliation,
            ];
        });
    }

    public function remove(string $accountId, int $id): object
    {
        return DB::transaction(function () use ($accountId, $id): object {
            $day = DB::table('asistencia_dias_no_laborables')->lockForUpdate()->find($id);
            if ($day === null) {
                throw ValidationException::withMessages(['dia' => 'El día indicado no existe.']);
            }

            $values = (bool) $day->es_oficial
                ? ['activo' => true, 'requiere_asistencia' => true]
                : ['activo' => false, 'requiere_asistencia' => true];
            DB::table('asistencia_dias_no_laborables')->where('id', $id)->update($values + [
                'modificado_por' => $accountId,
                'motivo_modificacion' => 'Se habilitó la asistencia para esta fecha.',
                'updated_at' => now(),
            ]);

            $this->reconcileWorkingDate((string) $day->fecha, $accountId);

            return DB::table('asistencia_dias_no_laborables')->find($id);
        });
    }

    private function reconcileNonWorkingDate(string $date, ?string $accountId): array
    {
        $attendances = DB::table('asistencias')
            ->whereDate('fecha', $date)
            ->whereNull('hora_entrada')
            ->whereIn('estado', ['falta', 'justificada', 'permiso'])
            ->lockForUpdate()
            ->get();

        foreach ($attendances as $attendance) {
            DB::table('asistencias')->where('id', $attendance->id)->update([
                'estado' => 'anulada',
                'minutos_incumplidos' => 0,
                'observacion' => 'Registro anulado automáticamente porque la fecha fue declarada no laborable.',
                'updated_at' => now(),
            ]);
            DB::table('asistencia_amonestaciones')
                ->where('asistencia_id', $attendance->id)
                ->where('estado', 'activa')
                ->update([
                    'estado' => 'anulada_feriado',
                    'updated_at' => now(),
                ]);
            DB::table('asistencia_auditoria')->insert([
                'asistencia_id' => $attendance->id,
                'accion' => 'anulada_feriado',
                'actor_id' => $accountId,
                'datos_anteriores' => json_encode((array) $attendance, JSON_THROW_ON_ERROR),
                'datos_nuevos' => json_encode(['estado' => 'anulada', 'minutos_incumplidos' => 0], JSON_THROW_ON_ERROR),
                'motivo' => 'La fecha fue configurada como día no laborable.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $notifications = DB::table('notificaciones_asistencia')
            ->whereDate('created_at', $date)
            ->whereNull('dismissed_at')
            ->whereIn('tipo', ['inicio_proximo', 'entrada_pendiente', 'salida_proxima', 'jornada_sin_cerrar'])
            ->update(['dismissed_at' => now(), 'updated_at' => now()]);

        return [
            'asistencias_anuladas' => $attendances->count(),
            'notificaciones_descartadas' => $notifications,
        ];
    }

    private function reconcileWorkingDate(string $date, string $accountId): array
    {
        $attendances = DB::table('asistencias')
            ->whereDate('fecha', $date)
            ->where('estado', 'anulada')
            ->lockForUpdate()
            ->get();
        $restoredAttendances = 0;
        $restoredWarnings = 0;

        foreach ($attendances as $attendance) {
            $annulment = DB::table('asistencia_auditoria')
                ->where('asistencia_id', $attendance->id)
                ->where('accion', 'anulada_feriado')
                ->latest('id')
                ->first(['datos_anteriores']);
            if ($annulment === null || $annulment->datos_anteriores === null) {
                continue;
            }

            $previous = json_decode($annulment->datos_anteriores, true, 512, JSON_THROW_ON_ERROR);
            if (! is_array($previous) || ! in_array($previous['estado'] ?? null, ['falta', 'justificada', 'permiso'], true)) {
                continue;
            }

            $restored = [
                'estado' => $previous['estado'],
                'minutos_incumplidos' => (int) ($previous['minutos_incumplidos'] ?? 0),
                'observacion' => $previous['observacion'] ?? null,
                'updated_at' => now(),
            ];
            DB::table('asistencias')->where('id', $attendance->id)->update($restored);
            $restoredWarnings += DB::table('asistencia_amonestaciones')
                ->where('asistencia_id', $attendance->id)
                ->where('estado', 'anulada_feriado')
                ->update([
                    'estado' => 'activa',
                    'updated_at' => now(),
                ]);
            DB::table('asistencia_auditoria')->insert([
                'asistencia_id' => $attendance->id,
                'accion' => 'corregida',
                'actor_id' => $accountId,
                'datos_anteriores' => json_encode((array) $attendance, JSON_THROW_ON_ERROR),
                'datos_nuevos' => json_encode($restored, JSON_THROW_ON_ERROR),
                'motivo' => 'La fecha fue habilitada nuevamente como día laborable.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $restoredAttendances++;
        }

        return [
            'asistencias_restauradas' => $restoredAttendances,
            'amonestaciones_restauradas' => $restoredWarnings,
        ];
    }

    private function easterSunday(int $year): CarbonImmutable
    {
        $a = $year % 19;
        $b = intdiv($year, 100);
        $c = $year % 100;
        $d = intdiv($b, 4);
        $e = $b % 4;
        $f = intdiv($b + 8, 25);
        $g = intdiv($b - $f + 1, 3);
        $h = (19 * $a + $b - $d - $g + 15) % 30;
        $i = intdiv($c, 4);
        $k = $c % 4;
        $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7;
        $m = intdiv($a + 11 * $h + 22 * $l, 451);
        $month = intdiv($h + $l - 7 * $m + 114, 31);
        $day = (($h + $l - 7 * $m + 114) % 31) + 1;

        return CarbonImmutable::create($year, $month, $day, 0, 0, 0, 'America/Lima');
    }
}
