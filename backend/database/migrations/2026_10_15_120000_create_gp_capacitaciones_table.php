<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const PERMISSIONS = [
        'gp.capacitaciones.ver' => ['Ver capacitación de proyectos', 'ver'],
        'gp.capacitaciones.gestionar' => ['Gestionar capacitación de proyectos', 'gestionar'],
    ];

    public function up(): void
    {
        Schema::create('gp_capacitaciones', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('integrante_id')->unique()->constrained('integrantes')->cascadeOnDelete();
            $table->timestampTz('fase_1_completada_at')->nullable();
            $table->timestampTz('fase_2_completada_at')->nullable();
            $table->timestampTz('fase_3_completada_at')->nullable();
            $table->foreignUuid('actualizado_por')->nullable()->constrained('cuentas_acceso')->nullOnDelete();
            $table->timestampsTz();
        });

        foreach (self::PERMISSIONS as $code => [$name, $action]) {
            DB::table('permisos')->updateOrInsert(
                ['codigo' => $code],
                [
                    'nombre' => $name,
                    'modulo' => 'capacitaciones',
                    'accion' => $action,
                    'descripcion' => "Permite {$name}.",
                    'activo' => true,
                    'updated_at' => now(),
                    'created_at' => DB::table('permisos')->where('codigo', $code)->value('created_at') ?? now(),
                ],
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_capacitaciones');

        $permissionIds = DB::table('permisos')->whereIn('codigo', array_keys(self::PERMISSIONS))->pluck('id');
        DB::table('rol_permisos')->whereIn('permiso_id', $permissionIds)->delete();
        DB::table('permisos')->whereIn('id', $permissionIds)->delete();
    }
};
