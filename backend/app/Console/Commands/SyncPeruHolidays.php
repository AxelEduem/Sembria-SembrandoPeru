<?php

namespace App\Console\Commands;

use App\Services\Asistencia\PeruHolidayService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class SyncPeruHolidays extends Command
{
    protected $signature = 'attendance:sync-peru-holidays {year? : Año entre 2000 y 2100}';

    protected $description = 'Sincroniza los feriados nacionales oficiales del Perú';

    public function handle(PeruHolidayService $holidays): int
    {
        $argument = $this->argument('year');
        if ($argument !== null && (! ctype_digit((string) $argument) || (int) $argument < 2000 || (int) $argument > 2100)) {
            $this->error('El año debe estar entre 2000 y 2100.');

            return self::FAILURE;
        }

        $years = $argument === null
            ? [CarbonImmutable::now('America/Lima')->year, CarbonImmutable::now('America/Lima')->year + 1]
            : [(int) $argument];

        foreach ($years as $year) {
            $count = $holidays->syncYear($year);
            $this->info("Feriados nacionales sincronizados para {$year}: {$count}");
        }

        return self::SUCCESS;
    }
}
