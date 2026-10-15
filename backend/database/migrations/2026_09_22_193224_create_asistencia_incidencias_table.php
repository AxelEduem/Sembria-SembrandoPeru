<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencia_incidencias', function (Blueprint $table) {
            $table->id();

            $table->foreignId('asistencia_id')
                ->constrained('asistencias')
                ->cascadeOnDelete();

            $table->string('tipo', 50);

            $table->integer('minutos')
                ->default(0);

            $table->text('descripcion')->nullable();

            $table->uuid('registrado_por')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('registrado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('asistencia_id');
            $table->index('tipo');
        });

        /*
         * Los minutos de una incidencia no pueden ser negativos.
         */
        DB::statement("
            ALTER TABLE asistencia_incidencias
            ADD CONSTRAINT asistencia_incidencias_minutos_check
            CHECK (minutos >= 0)
        ");

        /*
         * Tipos de incidencia permitidos.
         */
        DB::statement("
            ALTER TABLE asistencia_incidencias
            ADD CONSTRAINT asistencia_incidencias_tipo_check
            CHECK (
                tipo IN (
                    'tardanza',
                    'salida_anticipada',
                    'incumplimiento',
                    'inasistencia',
                    'otra'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencia_incidencias');
    }
};