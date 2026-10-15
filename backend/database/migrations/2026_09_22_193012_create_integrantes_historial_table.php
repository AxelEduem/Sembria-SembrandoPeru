<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrantes_historial', function (Blueprint $table) {
            $table->id();

            $table->foreignId('integrante_id')
                ->constrained('integrantes')
                ->cascadeOnDelete();

            $table->string('tipo_integrante', 30);

            $table->foreignId('cargo_id')
                ->constrained('cargos')
                ->restrictOnDelete();

            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();

            $table->integer('periodo_meses')->nullable();

            $table->string('estado', 20)
                ->default('Activo');

            $table->boolean('requiere_asistencia')
                ->default(true);

            $table->timestampTz('fecha_desactivacion')->nullable();

            $table->uuid('desactivado_por')->nullable();

            $table->text('motivo_desactivacion')->nullable();

            $table->string('tipo_desactivacion', 20)->nullable();

            /*
             * Datos específicos de practicantes.
             */
            $table->string('institucion_educativa')->nullable();
            $table->integer('horas_practicas_requeridas')->nullable();
            $table->string('carrera')->nullable();
            $table->string('ciclo')->nullable();
            $table->string('modalidad')->nullable();

            $table->timestampsTz();

            $table->foreign('desactivado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('integrante_id');
            $table->index('cargo_id');
            $table->index('estado');
            $table->index('tipo_integrante');
        });

        /*
         * Tipo de integrante permitido.
         */
        DB::statement("
            ALTER TABLE integrantes_historial
            ADD CONSTRAINT integrantes_historial_tipo_integrante_check
            CHECK (
                tipo_integrante IN (
                    'voluntario',
                    'practicante',
                    'gerente'
                )
            )
        ");

        /*
         * Estado permitido.
         */
        DB::statement("
            ALTER TABLE integrantes_historial
            ADD CONSTRAINT integrantes_historial_estado_check
            CHECK (
                estado IN (
                    'Activo',
                    'Inactivo'
                )
            )
        ");

        /*
         * Tipo de desactivación permitido.
         */
        DB::statement("
            ALTER TABLE integrantes_historial
            ADD CONSTRAINT integrantes_historial_tipo_desactivacion_check
            CHECK (
                tipo_desactivacion IS NULL
                OR tipo_desactivacion IN (
                    'manual',
                    'automatica'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('integrantes_historial');
    }
};
