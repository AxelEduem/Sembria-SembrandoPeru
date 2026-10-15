<?php

namespace App\Console\Commands;

use App\Services\Integrantes\IntegranteExpirationService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class ProcessExpiredIntegrantes extends Command
{
    protected $signature = 'integrantes:procesar-vencimientos {fecha? : Fecha de corte en formato Y-m-d}';

    protected $description = 'Desactiva periodos e integrantes cuyo periodo ya venció';

    public function handle(IntegranteExpirationService $service): int
    {
        $date = $this->argument('fecha')
            ? CarbonImmutable::createFromFormat('!Y-m-d', $this->argument('fecha'), 'America/Lima')
            : CarbonImmutable::now('America/Lima');

        if ($date === false) {
            $this->error('La fecha debe usar el formato Y-m-d.');

            return self::FAILURE;
        }

        $count = $service->process($date);
        $this->info("Vencimientos de integrantes procesados: {$count}");

        return self::SUCCESS;
    }
}
