<?php

namespace App\Console\Commands;

use App\Services\Notifications\AgendaNotificationService;
use Illuminate\Console\Command;

class GenerateAgendaReminders extends Command
{
    protected $signature = 'notifications:generate-agenda-reminders';

    protected $description = 'Genera recordatorios de reuniones de agenda';

    public function handle(AgendaNotificationService $service): int
    {
        $this->info("Recordatorios de agenda creados: {$service->generateAll()}");

        return self::SUCCESS;
    }
}
