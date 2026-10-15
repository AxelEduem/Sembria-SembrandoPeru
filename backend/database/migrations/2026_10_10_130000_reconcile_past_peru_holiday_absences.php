<?php

use App\Services\Asistencia\PeruHolidayService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        (new PeruHolidayService)->syncCurrentAndNextYear();
    }

    public function down(): void
    {
        // La reconciliación histórica no se revierte porque podría recrear faltas inválidas.
    }
};
