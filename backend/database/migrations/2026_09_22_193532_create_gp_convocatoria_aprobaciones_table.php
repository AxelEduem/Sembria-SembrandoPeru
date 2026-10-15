<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_convocatoria_aprobaciones', function (Blueprint $table) {
            $table->id();

            /*
             * Una convocatoria solo puede tener
             * un registro de aprobación.
             */
            $table->foreignId('convocatoria_id')
                ->unique()
                ->constrained('gp_convocatorias')
                ->cascadeOnDelete();

            $table->string('decision', 30);

            $table->text('observacion')
                ->nullable();

            $table->uuid('decidido_por');

            $table->timestampTz('decidido_at')
                ->useCurrent();

            $table->timestampsTz();

            $table->foreign('decidido_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->restrictOnDelete();

            $table->index('decidido_por');
            $table->index('decision');
        });

        /*
         * Decisiones permitidas.
         */
        DB::statement("
            ALTER TABLE gp_convocatoria_aprobaciones
            ADD CONSTRAINT gp_convocatoria_aprobaciones_decision_check
            CHECK (
                decision IN (
                    'aprobada',
                    'rechazada'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_convocatoria_aprobaciones');
    }
};