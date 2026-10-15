<?php

namespace App\Console\Commands;

use App\Services\Notifications\InstitutionalNotificationService;
use Illuminate\Console\Command;

class GenerateInstitutionalNotifications extends Command
{
    protected $signature = 'notifications:generate-institutional';

    protected $description = 'Genera notificaciones institucionales de periodos y cumpleaños';

    public function handle(InstitutionalNotificationService $service): int
    {
        $this->info("Notificaciones institucionales creadas: {$service->generateAll()}");

        return self::SUCCESS;
    }
}
