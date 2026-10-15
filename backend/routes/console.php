<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('attendance:process-absences')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command('attendance:generate-reminders')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command('attendance:sync-peru-holidays')
    ->dailyAt('00:15')
    ->timezone('America/Lima')
    ->withoutOverlapping(30);

Schedule::command('notifications:generate-agenda-reminders')
    ->everyFiveMinutes()
    ->withoutOverlapping(10);

Schedule::command('notifications:generate-institutional')
    ->dailyAt('00:05')
    ->timezone('America/Lima')
    ->withoutOverlapping(60);

Schedule::command('notifications:generate-convocatoria-alerts')
    ->dailyAt('00:07')
    ->timezone('America/Lima')
    ->withoutOverlapping(60);

Schedule::command('integrantes:procesar-vencimientos')
    ->dailyAt('00:10')
    ->timezone('America/Lima')
    ->withoutOverlapping(60);
