<?php

namespace App\Console\Commands;

use App\Services\Asistencia\AttendanceReminderService;
use Illuminate\Console\Command;

class GenerateAttendanceReminders extends Command
{
    protected $signature = 'attendance:generate-reminders';

    protected $description = 'Genera recordatorios personales de asistencia';

    public function handle(AttendanceReminderService $service): int
    {
        $this->info("Recordatorios creados: {$service->generateAll()}");

        return self::SUCCESS;
    }
}
