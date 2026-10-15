<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_convocatoria_historial', function (Blueprint $table) {
            $table->id();

            $table->foreignId('convocatoria_id')
                ->constrained('gp_convocatorias')
                ->cascadeOnDelete();

            $table->string('accion', 100);

            $table->string('estado_anterior', 50)
                ->nullable();

            $table->string('estado_nuevo', 50)
                ->nullable();

            $table->string('etapa_anterior', 50)
                ->nullable();

            $table->string('etapa_nueva', 50)
                ->nullable();

            $table->text('observacion')
                ->nullable();

            $table->uuid('actor_id');

            $table->timestampsTz();

            $table->foreign('actor_id')
                ->references('id')
                ->on('cuentas_acceso')
                ->restrictOnDelete();

            $table->index('convocatoria_id');
            $table->index('accion');
            $table->index('actor_id');
            $table->index('created_at');
        });

        DB::statement("
            ALTER TABLE gp_convocatoria_historial
            ADD CONSTRAINT gp_convocatoria_historial_accion_check
            CHECK (btrim(accion) <> '')
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_convocatoria_historial');
    }
};