<?php

use App\Services\Asistencia\PeruHolidayService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asistencia_dias_no_laborables', function (Blueprint $table) {
            $table->string('tipo', 40)->default('institucional')->after('nombre');
            $table->string('origen', 30)->default('manual')->after('tipo');
            $table->boolean('es_oficial')->default(false)->after('origen');
            $table->boolean('requiere_asistencia')->default(false)->after('es_oficial');
            $table->string('norma')->nullable()->after('requiere_asistencia');
            $table->string('fuente_url')->nullable()->after('norma');
            $table->uuid('modificado_por')->nullable()->after('registrado_por');
            $table->text('motivo_modificacion')->nullable()->after('modificado_por');
            $table->timestampTz('sincronizado_at')->nullable()->after('motivo_modificacion');

            $table->foreign('modificado_por')
                ->references('id')
                ->on('cuentas_acceso')
                ->nullOnDelete();
            $table->index(['activo', 'requiere_asistencia', 'fecha'], 'asistencia_dias_control_fecha_idx');
            $table->index(['tipo', 'fecha'], 'asistencia_dias_tipo_fecha_idx');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE asistencias DROP CONSTRAINT IF EXISTS asistencias_estado_check');
            DB::statement(<<<'SQL'
                ALTER TABLE asistencias
                ADD CONSTRAINT asistencias_estado_check
                CHECK (estado IN ('pendiente', 'en_jornada', 'completada', 'jornada_abierta', 'falta', 'justificada', 'permiso', 'anulada'))
            SQL);

            DB::statement('ALTER TABLE asistencia_auditoria DROP CONSTRAINT IF EXISTS asistencia_auditoria_accion_check');
            DB::statement(<<<'SQL'
                ALTER TABLE asistencia_auditoria
                ADD CONSTRAINT asistencia_auditoria_accion_check
                CHECK (accion IN ('creada', 'entrada_registrada', 'salida_registrada', 'actualizada', 'justificada', 'corregida', 'cierre_administrativo', 'falta_revertida_por_registro_offline', 'justificacion_aprobada', 'justificacion_rechazada', 'anulada_feriado'))
            SQL);
        }

        (new PeruHolidayService)->syncCurrentAndNextYear();
    }

    public function down(): void
    {
        DB::table('asistencias')->where('estado', 'anulada')->update(['estado' => 'falta']);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE asistencias DROP CONSTRAINT IF EXISTS asistencias_estado_check');
            DB::statement(<<<'SQL'
                ALTER TABLE asistencias
                ADD CONSTRAINT asistencias_estado_check
                CHECK (estado IN ('pendiente', 'en_jornada', 'completada', 'jornada_abierta', 'falta', 'justificada', 'permiso'))
            SQL);

            DB::statement('ALTER TABLE asistencia_auditoria DROP CONSTRAINT IF EXISTS asistencia_auditoria_accion_check');
            DB::statement(<<<'SQL'
                ALTER TABLE asistencia_auditoria
                ADD CONSTRAINT asistencia_auditoria_accion_check
                CHECK (accion IN ('creada', 'entrada_registrada', 'salida_registrada', 'actualizada', 'justificada', 'corregida', 'cierre_administrativo', 'falta_revertida_por_registro_offline', 'justificacion_aprobada', 'justificacion_rechazada'))
            SQL);
        }

        Schema::table('asistencia_dias_no_laborables', function (Blueprint $table) {
            $table->dropForeign(['modificado_por']);
            $table->dropIndex('asistencia_dias_control_fecha_idx');
            $table->dropIndex('asistencia_dias_tipo_fecha_idx');
            $table->dropColumn([
                'tipo',
                'origen',
                'es_oficial',
                'requiere_asistencia',
                'norma',
                'fuente_url',
                'modificado_por',
                'motivo_modificacion',
                'sincronizado_at',
            ]);
        });
    }
};
