<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrante_horarios', function (Blueprint $table) {
            $table->id();

            $table->smallInteger('dia_semana');

            $table->time('hora_inicio');
            $table->time('hora_fin');

            $table->foreignId('historial_id')
                ->constrained('integrantes_historial')
                ->cascadeOnDelete();

            $table->timestampsTz();

            $table->index('historial_id');
            $table->index('dia_semana');
        });

        /*
         * Días permitidos:
         * 1 = lunes
         * 2 = martes
         * 3 = miércoles
         * 4 = jueves
         * 5 = viernes
         * 6 = sábado
         */
        DB::statement("
            ALTER TABLE integrante_horarios
            ADD CONSTRAINT integrante_horarios_dia_semana_check
            CHECK (dia_semana BETWEEN 1 AND 6)
        ");

        /*
         * La hora de inicio no puede ser anterior a las 08:00.
         */
        DB::statement("
            ALTER TABLE integrante_horarios
            ADD CONSTRAINT integrante_horarios_hora_inicio_check
            CHECK (hora_inicio >= TIME '08:00')
        ");

        /*
         * La hora de fin no puede superar las 18:00.
         */
        DB::statement("
            ALTER TABLE integrante_horarios
            ADD CONSTRAINT integrante_horarios_hora_fin_check
            CHECK (hora_fin <= TIME '18:00')
        ");

        /*
         * La hora de fin debe ser posterior a la hora de inicio.
         */
        DB::statement("
            ALTER TABLE integrante_horarios
            ADD CONSTRAINT integrante_horarios_horas_validas_check
            CHECK (hora_fin > hora_inicio)
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('integrante_horarios');
    }
};