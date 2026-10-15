<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_proyectos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('convocatoria_id')->unique()->constrained('gp_convocatorias')->restrictOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->foreignId('equipo_id')->nullable()->constrained('gp_equipos')->nullOnDelete();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->string('financiador_nombre')->nullable();
            $table->string('estado', 30)->default('planificacion');
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->string('moneda', 10)->nullable();
            $table->decimal('monto_adjudicado', 15, 2)->nullable();
            $table->json('presupuesto')->nullable();
            $table->json('desembolsos')->nullable();
            $table->json('hitos')->nullable();
            $table->json('indicadores')->nullable();
            $table->json('beneficiarios')->nullable();
            $table->json('riesgos')->nullable();
            $table->json('responsables')->nullable();
            $table->foreignUuid('creado_por')->nullable()->constrained('cuentas_acceso')->nullOnDelete();
            $table->timestampsTz();
            $table->index(['area_id', 'estado']);
            $table->index(['equipo_id', 'estado']);
        });

        DB::table('gp_convocatorias')
            ->where('resultado_final', 'adjudicada')
            ->orderBy('id')
            ->each(function (object $convocatoria): void {
                DB::table('gp_proyectos')->insertOrIgnore([
                    'convocatoria_id' => $convocatoria->id,
                    'area_id' => $convocatoria->area_id,
                    'equipo_id' => $convocatoria->equipo_id,
                    'nombre' => $convocatoria->nombre,
                    'descripcion' => $convocatoria->descripcion,
                    'financiador_nombre' => $convocatoria->financiador_nombre,
                    'estado' => 'planificacion',
                    'fecha_inicio' => $convocatoria->cerrada_at,
                    'moneda' => $convocatoria->moneda,
                    'monto_adjudicado' => $convocatoria->monto_solicitable,
                    'presupuesto' => json_encode([]),
                    'desembolsos' => json_encode([]),
                    'hitos' => json_encode([]),
                    'indicadores' => json_encode([]),
                    'beneficiarios' => json_encode([]),
                    'riesgos' => json_encode([]),
                    'responsables' => json_encode([]),
                    'creado_por' => $convocatoria->cerrada_por,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_proyectos');
    }
};
