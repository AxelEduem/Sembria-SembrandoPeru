<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('gp_postulaciones')
            ->where('estado', 'en_revision')
            ->update([
                'estado' => 'lista_para_enviar',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // No se revierten postulaciones porque ya pueden haber avanzado o sido enviadas.
    }
};
