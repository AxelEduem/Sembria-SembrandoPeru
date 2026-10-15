<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencia_permiso_fechas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permiso_id')->constrained('asistencia_permisos')->cascadeOnDelete();
            $table->date('fecha')->index();
            $table->timestampsTz();
            $table->unique(['permiso_id', 'fecha']);
        });

        DB::table('asistencia_permisos')
            ->orderBy('id')
            ->chunkById(100, function ($permissions): void {
                $rows = [];
                foreach ($permissions as $permission) {
                    $from = CarbonImmutable::parse($permission->fecha_inicio);
                    $to = CarbonImmutable::parse($permission->fecha_fin);
                    for ($date = $from; $date->lte($to); $date = $date->addDay()) {
                        $rows[] = [
                            'permiso_id' => $permission->id,
                            'fecha' => $date->toDateString(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }

                if ($rows !== []) {
                    DB::table('asistencia_permiso_fechas')->insert($rows);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencia_permiso_fechas');
    }
};
