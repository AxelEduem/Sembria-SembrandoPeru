<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_reunion_participantes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reunion_id')
                ->constrained('agenda_reuniones')
                ->cascadeOnDelete();

            $table->uuid('cuenta_id');

            $table->string('estado', 20)
                ->default('pendiente');

            $table->boolean('es_organizador')
                ->default(false);

            $table->timestampTz('respondido_at')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('cuenta_id')
                ->references('id')
                ->on('cuentas_acceso')
                ->restrictOnDelete();

            $table->index('reunion_id');
            $table->index('cuenta_id');
            $table->index('estado');
            $table->index('es_organizador');

            $table->unique(
                ['reunion_id', 'cuenta_id'],
                'agenda_reunion_participantes_reunion_cuenta_unique'
            );
        });

        DB::statement("
            ALTER TABLE agenda_reunion_participantes
            ADD CONSTRAINT agenda_reunion_participantes_estado_check
            CHECK (
                estado IN (
                    'pendiente',
                    'aceptada',
                    'rechazada'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_reunion_participantes');
    }
};