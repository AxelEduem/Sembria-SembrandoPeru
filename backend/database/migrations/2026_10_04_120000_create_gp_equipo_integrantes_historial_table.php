<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_equipo_integrantes_historial', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('equipo_id')->constrained('gp_equipos')->cascadeOnDelete();
            $table->foreignId('integrante_id')->constrained('integrantes')->restrictOnDelete();
            $table->string('accion', 20);
            $table->string('rol_anterior', 20)->nullable();
            $table->string('rol_nuevo', 20)->nullable();
            $table->foreignUuid('realizado_por')->nullable()->constrained('cuentas_acceso')->nullOnDelete();
            $table->timestamps();
            $table->index(['equipo_id', 'created_at']);
            $table->index(['integrante_id', 'created_at']);
        });

        DB::table('gp_equipo_integrantes')
            ->join('gp_equipos', 'gp_equipos.id', '=', 'gp_equipo_integrantes.equipo_id')
            ->orderBy('gp_equipo_integrantes.id')
            ->select([
                'gp_equipo_integrantes.equipo_id',
                'gp_equipo_integrantes.integrante_id',
                'gp_equipo_integrantes.rol',
                'gp_equipo_integrantes.created_at',
                'gp_equipo_integrantes.updated_at',
                'gp_equipos.creado_por',
            ])
            ->each(function (object $membership): void {
                DB::table('gp_equipo_integrantes_historial')->insert([
                    'equipo_id' => $membership->equipo_id,
                    'integrante_id' => $membership->integrante_id,
                    'accion' => 'asignado',
                    'rol_anterior' => null,
                    'rol_nuevo' => $membership->rol,
                    'realizado_por' => $membership->creado_por,
                    'created_at' => $membership->created_at,
                    'updated_at' => $membership->updated_at,
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_equipo_integrantes_historial');
    }
};
