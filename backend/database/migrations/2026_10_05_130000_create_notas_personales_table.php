<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notas_personales', function (Blueprint $table): void {
            $table->id();
            $table->uuid('cuenta_id');
            $table->string('titulo', 140);
            $table->text('contenido')->nullable();
            $table->string('color', 20)->default('amarillo');
            $table->boolean('fijada')->default(false);
            $table->timestampsTz();

            $table->foreign('cuenta_id')->references('id')->on('cuentas_acceso')->cascadeOnDelete();
            $table->index(['cuenta_id', 'fijada', 'updated_at']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE notas_personales ADD CONSTRAINT notas_personales_titulo_check CHECK (char_length(btrim(titulo)) BETWEEN 2 AND 140)');
            DB::statement("ALTER TABLE notas_personales ADD CONSTRAINT notas_personales_color_check CHECK (color IN ('amarillo','verde','azul','violeta','rosa'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('notas_personales');
    }
};
