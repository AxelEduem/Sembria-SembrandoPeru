<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulacion_seguimiento_eventos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('seguimiento_id')
                ->constrained('gp_postulacion_seguimientos')
                ->cascadeOnDelete();

            $table->string('tipo', 50);

            $table->timestampTz('fecha_evento')
                ->useCurrent();

            $table->text('descripcion')
                ->nullable();

            $table->uuid('registrado_por');

            $table->timestampsTz();

            $table->foreign('registrado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->restrictOnDelete();

            $table->index('seguimiento_id');
            $table->index('tipo');
            $table->index('fecha_evento');
            $table->index('registrado_por');
        });

        DB::statement("
            ALTER TABLE gp_postulacion_seguimiento_eventos
            ADD CONSTRAINT gp_postulacion_seguimiento_eventos_tipo_check
            CHECK (btrim(tipo) <> '')
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulacion_seguimiento_eventos');
    }
};