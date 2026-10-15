<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_cambio_horario_detalle', function (Blueprint $table) {
            $table->id();

            $table->foreignId('solicitud_id')
                ->constrained('solicitudes_cambio_horario')
                ->cascadeOnDelete();

            $table->smallInteger('dia_semana');

            $table->time('hora_inicio');

            $table->time('hora_fin');

            $table->index('solicitud_id');
            $table->index('dia_semana');
        });

        /*
         * 1 = lunes
         * 2 = martes
         * 3 = miércoles
         * 4 = jueves
         * 5 = viernes
         * 6 = sábado
         */
        DB::statement("
            ALTER TABLE solicitudes_cambio_horario_detalle
            ADD CONSTRAINT solicitudes_cambio_horario_detalle_dia_semana_check
            CHECK (dia_semana BETWEEN 1 AND 6)
        ");

        /*
         * La hora de inicio no puede ser anterior a las 08:00.
         */
        DB::statement("
            ALTER TABLE solicitudes_cambio_horario_detalle
            ADD CONSTRAINT solicitudes_cambio_horario_detalle_hora_inicio_check
            CHECK (hora_inicio >= TIME '08:00')
        ");

        /*
         * La hora de fin no puede superar las 18:00.
         */
        DB::statement("
            ALTER TABLE solicitudes_cambio_horario_detalle
            ADD CONSTRAINT solicitudes_cambio_horario_detalle_hora_fin_check
            CHECK (hora_fin <= TIME '18:00')
        ");

        /*
         * La hora de fin debe ser posterior a la hora de inicio.
         */
        DB::statement("
            ALTER TABLE solicitudes_cambio_horario_detalle
            ADD CONSTRAINT solicitudes_cambio_horario_detalle_horas_validas_check
            CHECK (hora_fin > hora_inicio)
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_cambio_horario_detalle');
    }
};