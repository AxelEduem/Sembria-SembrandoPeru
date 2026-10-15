<?php

namespace App\Console\Commands;

use App\Services\Asistencia\AttendanceAbsenceService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class ProcessAttendanceAbsences extends Command
{
    protected $signature = 'attendance:process-absences {date? : Fecha en formato Y-m-d}';

    protected $description = 'Registra faltas para bloques vencidos sin entrada';

    public function handle(AttendanceAbsenceService $service): int
    {
        $date = $this->argument('date')
            ? CarbonImmutable::createFromFormat('!Y-m-d', $this->argument('date'), 'America/Lima')
            : CarbonImmutable::now('America/Lima');

        if ($date === false) {
            $this->error('La fecha debe usar el formato Y-m-d.');

            return self::FAILURE;
        }

        $count = $service->processExpired($date);
        $this->info("Faltas registradas: {$count}");

        return self::SUCCESS;
    }
}
