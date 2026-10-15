<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const PERMISSION_CODES = [
        'gp.proyectos.ver',
        'gp.proyectos.gestionar',
        'gp.proyectos.descargar_excel',
    ];

    public function up(): void
    {
        $permissionIds = DB::table('permisos')
            ->whereIn('codigo', self::PERMISSION_CODES)
            ->pluck('id');

        if ($permissionIds->isNotEmpty()) {
            DB::table('rol_permisos')->whereIn('permiso_id', $permissionIds)->delete();
            DB::table('permisos')->whereIn('id', $permissionIds)->delete();
        }

        Schema::dropIfExists('gp_proyectos');
    }

    public function down(): void
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

        foreach ([
            'gp.proyectos.ver' => ['Ver proyectos adjudicados', 'ver'],
            'gp.proyectos.gestionar' => ['Gestionar ejecución de proyectos', 'gestionar'],
            'gp.proyectos.descargar_excel' => ['Descargar Excel', 'descargar_excel'],
        ] as $code => [$name, $action]) {
            DB::table('permisos')->updateOrInsert(
                ['codigo' => $code],
                [
                    'nombre' => $name,
                    'modulo' => 'proyectos',
                    'accion' => $action,
                    'descripcion' => null,
                    'activo' => true,
                    'updated_at' => now(),
                    'created_at' => now(),
                ],
            );
        }
    }
};
