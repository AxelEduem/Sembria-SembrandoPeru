<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_reuniones', function (Blueprint $table) {
            $table->id();

            $table->string('titulo', 120);

            $table->text('descripcion')
                ->nullable();

            $table->date('fecha');

            $table->time('hora_inicio');

            $table->time('hora_fin');

            $table->string('modalidad', 20)
                ->default('virtual');

            $table->text('ubicacion')
                ->nullable();

            $table->text('enlace')
                ->nullable();

            $table->string('estado', 20)
                ->default('pendiente');

            $table->uuid('creada_por');

            $table->timestampsTz();

            $table->foreign('creada_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->restrictOnDelete();

            $table->index('fecha');
            $table->index('estado');
            $table->index('modalidad');
            $table->index('creada_por');
        });

        DB::statement("
            ALTER TABLE agenda_reuniones
            ADD CONSTRAINT agenda_reuniones_titulo_check
            CHECK (
                char_length(btrim(titulo)) BETWEEN 3 AND 120
            )
        ");

        DB::statement("
            ALTER TABLE agenda_reuniones
            ADD CONSTRAINT agenda_reuniones_horas_check
            CHECK (hora_fin > hora_inicio)
        ");

        DB::statement("
            ALTER TABLE agenda_reuniones
            ADD CONSTRAINT agenda_reuniones_modalidad_check
            CHECK (
                modalidad IN (
                    'virtual',
                    'presencial',
                    'hibrida'
                )
            )
        ");

        DB::statement("
            ALTER TABLE agenda_reuniones
            ADD CONSTRAINT agenda_reuniones_estado_check
            CHECK (
                estado IN (
                    'pendiente',
                    'confirmada',
                    'rechazada',
                    'cancelada'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_reuniones');
    }
};