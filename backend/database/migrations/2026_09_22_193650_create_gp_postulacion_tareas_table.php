<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulacion_tareas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('postulacion_id')
                ->constrained('gp_postulaciones')
                ->cascadeOnDelete();

            $table->string('titulo');

            $table->text('descripcion')
                ->nullable();

            $table->uuid('responsable_id')
                ->nullable();

            $table->date('fecha_limite')
                ->nullable();

            $table->string('estado', 30)
                ->default('pendiente');

            $table->string('prioridad', 20)
                ->default('media');

            $table->timestampTz('fecha_completado')
                ->nullable();

            $table->text('observaciones')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('responsable_id')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('postulacion_id');
            $table->index('responsable_id');
            $table->index('estado');
            $table->index('prioridad');
            $table->index('fecha_limite');
        });

        /*
         * El título no puede estar vacío.
         */
        DB::statement("
            ALTER TABLE gp_postulacion_tareas
            ADD CONSTRAINT gp_postulacion_tareas_titulo_check
            CHECK (btrim(titulo) <> '')
        ");

        /*
         * Estados permitidos.
         */
        DB::statement("
            ALTER TABLE gp_postulacion_tareas
            ADD CONSTRAINT gp_postulacion_tareas_estado_check
            CHECK (
                estado IN (
                    'pendiente',
                    'en_proceso',
                    'completada',
                    'bloqueada'
                )
            )
        ");

        /*
         * Prioridades permitidas.
         */
        DB::statement("
            ALTER TABLE gp_postulacion_tareas
            ADD CONSTRAINT gp_postulacion_tareas_prioridad_check
            CHECK (
                prioridad IN (
                    'baja',
                    'media',
                    'alta'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulacion_tareas');
    }
};