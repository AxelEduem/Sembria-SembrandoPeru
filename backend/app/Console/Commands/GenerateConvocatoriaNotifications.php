<?php

namespace App\Console\Commands;

use App\Services\Notifications\ConvocatoriaNotificationService;
use Illuminate\Console\Command;

class GenerateConvocatoriaNotifications extends Command
{
    protected $signature = 'notifications:generate-convocatoria-alerts';

    protected $description = 'Genera alertas y el resumen diario de convocatorias';

    public function handle(ConvocatoriaNotificationService $service): int
    {
        $this->info("Alertas de convocatorias creadas: {$service->generateAll()}");

        return self::SUCCESS;
    }
}
