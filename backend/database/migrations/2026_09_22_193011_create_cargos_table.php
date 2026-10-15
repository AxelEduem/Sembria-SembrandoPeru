<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cargos', function (Blueprint $table) {
            $table->id();

            $table->string('nombre');
            $table->text('descripcion')->nullable();

            $table->foreignId('area_id')
                ->constrained('areas')
                ->restrictOnDelete();

            $table->foreignId('rol_id')
                ->nullable()
                ->constrained('roles')
                ->restrictOnDelete();

            $table->boolean('activo')->default(true);

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE cargos
            ADD CONSTRAINT cargos_nombre_check
            CHECK (btrim(nombre) <> '')
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('cargos');
    }
};
