<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrante_aplicaciones', function (Blueprint $table) {
            $table->id();

            $table->foreignId('aplicacion_id')
                ->constrained('aplicaciones')
                ->restrictOnDelete();

            $table->foreignId('historial_id')
                ->constrained('integrantes_historial')
                ->cascadeOnDelete();

            $table->boolean('activo')
                ->default(true);

            $table->timestampTz('fecha_retiro')
                ->nullable();

            $table->uuid('retirado_por')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('retirado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('aplicacion_id');
            $table->index('historial_id');
            $table->index('activo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integrante_aplicaciones');
    }
};