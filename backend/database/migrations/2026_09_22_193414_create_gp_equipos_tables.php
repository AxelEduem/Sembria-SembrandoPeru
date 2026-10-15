<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_equipos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('area_id')->constrained('areas')->restrictOnDelete();
            $table->string('nombre', 120);
            $table->boolean('activo')->default(true);
            $table->foreignUuid('creado_por')->constrained('cuentas_acceso')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['area_id', 'nombre']);
        });

        Schema::create('gp_equipo_integrantes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('equipo_id')->constrained('gp_equipos')->cascadeOnDelete();
            $table->foreignId('integrante_id')->constrained('integrantes')->restrictOnDelete();
            $table->string('rol', 20);
            $table->timestamps();
            $table->unique('integrante_id');
            $table->unique(['equipo_id', 'integrante_id']);
            $table->index(['equipo_id', 'rol']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE gp_equipo_integrantes ADD CONSTRAINT gp_equipo_integrantes_rol_check CHECK (rol IN ('lider','integrante'))");
            DB::statement("CREATE UNIQUE INDEX gp_equipo_un_lider_idx ON gp_equipo_integrantes (equipo_id) WHERE rol = 'lider'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_equipo_integrantes');
        Schema::dropIfExists('gp_equipos');
    }
};
