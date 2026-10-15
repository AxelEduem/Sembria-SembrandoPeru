<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RolPermisoSeeder extends Seeder
{
    private const PERMISSIONS_BY_ROLE = [
        'coordinador_area' => [],
        'co_coordinador_area' => [],
        'integrante' => [],
        'lider_tecnologia' => [],
    ];

    public function run(): void
    {
        $roles = DB::table('roles')
            ->whereIn('codigo', array_keys(self::PERMISSIONS_BY_ROLE))
            ->pluck('id', 'codigo');
        $permissionCodes = collect(self::PERMISSIONS_BY_ROLE)->flatten()->unique()->values();
        $permissions = DB::table('permisos')
            ->whereIn('codigo', $permissionCodes)
            ->pluck('id', 'codigo');

        foreach (self::PERMISSIONS_BY_ROLE as $roleCode => $codes) {
            $roleId = $roles->get($roleCode);
            if (! $roleId) {
                throw new RuntimeException("No existe el rol {$roleCode}.");
            }

            $expectedPermissionIds = collect($codes)
                ->map(fn (string $code) => $permissions->get($code))
                ->filter()
                ->values();

            DB::table('rol_permisos')
                ->where('rol_id', $roleId)
                ->when(
                    $expectedPermissionIds->isNotEmpty(),
                    fn ($query) => $query->whereNotIn('permiso_id', $expectedPermissionIds),
                )
                ->delete();

            foreach ($codes as $code) {
                $permissionId = $permissions->get($code);
                if (! $permissionId) {
                    throw new RuntimeException("No existe el permiso {$code}.");
                }

                DB::table('rol_permisos')->updateOrInsert(
                    ['rol_id' => $roleId, 'permiso_id' => $permissionId],
                    [
                        'alcance' => 'area',
                        'updated_at' => now(),
                        'created_at' => DB::table('rol_permisos')
                            ->where('rol_id', $roleId)
                            ->where('permiso_id', $permissionId)
                            ->value('created_at') ?? now(),
                    ],
                );
            }
        }
    }
}
