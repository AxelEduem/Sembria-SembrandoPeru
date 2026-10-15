<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_postulaciones', function (Blueprint $table) {
            $table->id();

            $table->foreignId('convocatoria_id')
                ->constrained('gp_convocatorias')
                ->restrictOnDelete();

            $table->string('estado', 40)
                ->default('pendiente');

            $table->timestampTz('fecha_inicio')
                ->useCurrent();

            $table->date('fecha_limite')
                ->nullable();

            $table->date('fecha_envio')
                ->nullable();

            $table->time('hora_envio')
                ->nullable();

            $table->uuid('enviada_por')
                ->nullable();

            $table->string('canal_envio')
                ->nullable();

            $table->text('url_postulacion')
                ->nullable();

            $table->string('codigo_postulacion')
                ->nullable();

            $table->text('constancia_url')
                ->nullable();

            $table->text('observaciones')
                ->nullable();

            $table->timestampsTz();

            $table->foreign('enviada_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();

            $table->index('convocatoria_id');
            $table->index('estado');
            $table->index('fecha_limite');
            $table->index('fecha_envio');
            $table->index('enviada_por');
        });

        DB::statement("
            ALTER TABLE gp_postulaciones
            ADD CONSTRAINT gp_postulaciones_estado_check
            CHECK (
                estado IN (
                    'pendiente',
                    'en_preparacion',
                    'en_revision',
                    'lista_para_enviar',
                    'enviada',
                    'cancelada'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_postulaciones');
    }
};