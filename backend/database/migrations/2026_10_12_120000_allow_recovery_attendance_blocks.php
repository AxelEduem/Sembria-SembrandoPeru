<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asistencias', function (Blueprint $table): void {
            $table->unsignedBigInteger('horario_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        $recoveryAttendanceIds = DB::table('asistencia_recuperaciones')
            ->whereNotNull('asistencia_id')
            ->pluck('asistencia_id');

        DB::table('asistencia_recuperaciones')
            ->whereNotNull('asistencia_id')
            ->update(['asistencia_id' => null]);

        DB::table('asistencias')
            ->whereIn('id', $recoveryAttendanceIds)
            ->whereNull('horario_id')
            ->delete();

        Schema::table('asistencias', function (Blueprint $table): void {
            $table->unsignedBigInteger('horario_id')->nullable(false)->change();
        });
    }
};
