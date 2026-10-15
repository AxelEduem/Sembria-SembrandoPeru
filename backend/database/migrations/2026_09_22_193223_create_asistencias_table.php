<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencias', function (Blueprint $table) {
            $table->id();

            $table->foreignId('integrante_id')
                ->constrained('integrantes')
                ->restrictOnDelete();

            $table->foreignId('historial_id')
                ->constrained('integrantes_historial')
                ->restrictOnDelete();

            $table->foreignId('horario_id')
                ->constrained('integrante_horarios')
                ->restrictOnDelete();

            $table->date('fecha');

            $table->time('hora_inicio_programada');
            $table->time('hora_fin_programada');

            $table->timestampTz('hora_entrada')->nullable();
            $table->string('fuente_entrada', 20)->default('online');
            $table->string('entrada_client_event_id')->nullable()->unique();
            $table->timestampTz('hora_salida')->nullable();
            $table->string('fuente_salida', 20)->nullable();
            $table->string('salida_client_event_id')->nullable()->unique();

            $table->integer('minutos_programados');

            $table->integer('minutos_realizados')
                ->default(0);

            $table->integer('minutos_tardanza')
                ->default(0);

            $table->integer('minutos_salida_anticipada')
                ->default(0);

            $table->integer('minutos_incumplidos')
                ->default(0);

            $table->string('estado', 30)
                ->default('pendiente');

            $table->text('observacion')->nullable();
            $table->text('descripcion_jornada')->nullable();
            $table->string('evidencia_path')->nullable();

            $table->timestampsTz();

            $table->index('integrante_id');
            $table->index('historial_id');
            $table->index('horario_id');
            $table->index('fecha');
            $table->index('estado');
            $table->unique(
                ['integrante_id', 'fecha', 'horario_id'],
                'asistencias_integrante_fecha_horario_unique'
            );
        });

        /*
         * Los minutos programados deben ser positivos.
         */
        DB::statement('
            ALTER TABLE asistencias
            ADD CONSTRAINT asistencias_minutos_programados_check
            CHECK (minutos_programados > 0)
        ');

        /*
         * Los minutos realizados no pueden ser negativos.
         */
        DB::statement('
            ALTER TABLE asistencias
            ADD CONSTRAINT asistencias_minutos_realizados_check
            CHECK (minutos_realizados >= 0)
        ');

        /*
         * Los minutos de tardanza no pueden ser negativos.
         */
        DB::statement('
            ALTER TABLE asistencias
            ADD CONSTRAINT asistencias_minutos_tardanza_check
            CHECK (minutos_tardanza >= 0)
        ');

        /*
         * Los minutos de salida anticipada no pueden ser negativos.
         */
        DB::statement('
            ALTER TABLE asistencias
            ADD CONSTRAINT asistencias_minutos_salida_anticipada_check
            CHECK (minutos_salida_anticipada >= 0)
        ');

        /*
         * Los minutos incumplidos no pueden ser negativos.
         */
        DB::statement('
            ALTER TABLE asistencias
            ADD CONSTRAINT asistencias_minutos_incumplidos_check
            CHECK (minutos_incumplidos >= 0)
        ');

        /*
         * Estados permitidos para una asistencia.
         */
        DB::statement("
            ALTER TABLE asistencias
            ADD CONSTRAINT asistencias_estado_check
            CHECK (
                estado IN (
                    'pendiente',
                    'en_jornada',
                    'completada',
                    'jornada_abierta',
                    'falta',
                    'justificada',
                    'permiso'
                )
            )
        ");

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("CREATE UNIQUE INDEX asistencias_integrante_abierta_unique ON asistencias (integrante_id) WHERE estado = 'en_jornada' AND hora_salida IS NULL");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias');
    }
};
