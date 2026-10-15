<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_convocatoria_evaluaciones', function (Blueprint $table) {
            $table->id();

            $table->foreignId('convocatoria_id')
                ->constrained('gp_convocatorias')
                ->cascadeOnDelete();

            $table->string('criterio_codigo', 100);

            $table->string('estado_revision', 30)
                ->default('pendiente');

            $table->text('observacion')
                ->nullable();

            $table->uuid('revisado_por')
                ->nullable();

            $table->timestampTz('revisado_at')
                ->nullable();

            $table->string('tipo_filtro', 30)
                ->default('primer_filtro');

            $table->timestampsTz();

            $table->foreign('revisado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->unique(
                ['convocatoria_id', 'tipo_filtro', 'criterio_codigo'],
                'gp_conv_eval_conv_filtro_criterio_unique'
            );

            $table->index('convocatoria_id');
            $table->index('criterio_codigo');
            $table->index('estado_revision');
            $table->index('tipo_filtro');
            $table->index('revisado_por');
        });

        /*
         * El código del criterio debe tener contenido.
         */
        DB::statement("
            ALTER TABLE gp_convocatoria_evaluaciones
            ADD CONSTRAINT gp_conv_eval_criterio_codigo_check
            CHECK (btrim(criterio_codigo) <> '')
        ");

        /*
         * Estados permitidos para una evaluación.
         */
        DB::statement("
            ALTER TABLE gp_convocatoria_evaluaciones
            ADD CONSTRAINT gp_conv_eval_estado_revision_check
            CHECK (
                estado_revision IN (
                    'pendiente',
                    'cumple',
                    'no_cumple'
                )
            )
        ");

        /*
         * Filtros permitidos.
         */
        DB::statement("
            ALTER TABLE gp_convocatoria_evaluaciones
            ADD CONSTRAINT gp_conv_eval_tipo_filtro_check
            CHECK (
                tipo_filtro IN (
                    'primer_filtro',
                    'segundo_filtro'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_convocatoria_evaluaciones');
    }
};
