<?php

namespace App\Services\Auth;

use App\Services\Profile\AvatarService;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AuthProfileService
{
    public function __construct(
        private readonly AvatarService $avatarService,
        private readonly InstitutionalAuthorizationService $authorization,
    ) {}

    /**
     * Construye el perfil institucional completo
     * a partir del usuario autenticado.
     */
    public function buildProfile(int $userId): array
    {
        $account = $this->getAccount($userId);

        if (! $account) {
            throw new RuntimeException(
                'El usuario no tiene una cuenta institucional vinculada.'
            );
        }

        if (! $account->activo) {
            throw new RuntimeException(
                'La cuenta institucional se encuentra inactiva.'
            );
        }

        $persona = $this->getPersona($account->persona_id);

        if (! $persona) {
            throw new RuntimeException(
                'La cuenta no tiene una persona institucional válida.'
            );
        }

        $integrante = $this->getActiveIntegrante($persona->id);

        if (! $integrante) {
            throw new RuntimeException(
                'La persona no tiene un integrante activo.'
            );
        }

        $historial = $this->getActiveHistory($integrante->id);

        if (! $historial) {
            throw new RuntimeException(
                'El integrante no tiene un historial activo.'
            );
        }

        $permissions = $this->getRolePermissions(
            $historial->rol_id,
            $account->id,
            $historial->rol_codigo,
            $historial->area_nombre,
            $historial->cargo_nombre,
        );
        $avatarUrl = $this->avatarService->url($integrante->avatar_path);

        return [
            'id' => $account->id,

            'user_id' => $account->user_id,

            'activo' => (bool) $account->activo,

            'must_change_password' => (bool) $account->must_change_password,

            'created_at' => $account->created_at,

            'avatar_path' => $integrante->avatar_path,

            'avatar_url' => $avatarUrl,

            'persona' => [
                'id' => $persona->id,
                'nombres' => $persona->nombres,
                'apellidos' => $persona->apellidos,
                'correo' => $persona->correo,
                'ultimo_envio_credenciales' => $persona->ultimo_envio_credenciales,
                'password_temporal_expira_en' => $persona->password_temporal_expira_en,
            ],

            'integrante' => [
                'id' => $integrante->id,
                'estado' => $integrante->estado,
                'accesos_pendientes_revision' => (bool) $integrante->accesos_pendientes_revision,
                'fecha_nacimiento' => $integrante->fecha_nacimiento,
                'avatar_path' => $integrante->avatar_path,
                'avatar_url' => $avatarUrl,
                'documento_identidad' => $integrante->documento_identidad,
                'telefono' => $integrante->telefono,
                'tipo_documento' => $integrante->tipo_documento,
                'departamento' => $integrante->departamento,
                'ciudad' => $integrante->ciudad,
                'distrito' => $integrante->distrito,
            ],

            // Nombre original que espera AuthContext
            'historial' => [
                'id' => $historial->historial_id,
                'tipo_integrante' => $historial->tipo_integrante,
                'fecha_inicio' => $historial->fecha_inicio,
                'fecha_fin' => $historial->fecha_fin,
                'periodo_meses' => $historial->periodo_meses,
                'estado' => $historial->historial_estado,
                'requiere_asistencia' => (bool) $historial->requiere_asistencia,  // 🆕
                'institucion_educativa' => $historial->institucion_educativa,
                'horas_practicas_requeridas' => $historial->horas_practicas_requeridas,
                'carrera' => $historial->carrera,
                'ciclo' => $historial->ciclo,
                'modalidad' => $historial->modalidad,
            ],

            // Alias temporal para el código nuevo que espera "historial_actual"
            'historial_actual' => [
                'id' => $historial->historial_id,
                'tipo_integrante' => $historial->tipo_integrante,
                'fecha_inicio' => $historial->fecha_inicio,
                'fecha_fin' => $historial->fecha_fin,
                'periodo_meses' => $historial->periodo_meses,
                'estado' => $historial->historial_estado,
                'requiere_asistencia' => (bool) $historial->requiere_asistencia,
                'institucion_educativa' => $historial->institucion_educativa,
                'horas_practicas_requeridas' => $historial->horas_practicas_requeridas,
                'carrera' => $historial->carrera,
                'ciclo' => $historial->ciclo,
                'modalidad' => $historial->modalidad,
            ],

            'cargo' => [
                'id' => $historial->cargo_id,
                'nombre' => $historial->cargo_nombre,
                'descripcion' => $historial->cargo_descripcion,
                'activo' => (bool) $historial->cargo_activo,
            ],

            'area' => [
                'id' => $historial->area_id,
                'nombre' => $historial->area_nombre,
                'descripcion' => $historial->area_descripcion,
                'activo' => (bool) $historial->area_activo,
            ],

            'role' => [
                'id' => $historial->rol_id,
                'codigo' => $historial->rol_codigo,
                'nombre' => $historial->rol_nombre,
                'descripcion' => $historial->rol_descripcion,
                'acceso_total' => (bool) $historial->rol_acceso_total,
                'activo' => (bool) $historial->rol_activo,
            ],

            'acceso_total' => (bool) $historial->rol_acceso_total,

            'permissions' => $permissions,

            'permissions_version' => $this->hashPermissionsVersion(
                $account,
                $integrante,
                $historial,
                $permissions,
            ),
        ];
    }

    /**
     * Genera una versión compacta del estado que determina los permisos efectivos.
     */
    public function permissionsVersion(int $userId): string
    {
        $snapshot = DB::table('cuentas_acceso as ca')
            ->leftJoin('integrantes as i', function ($join): void {
                $join->on('i.persona_id', '=', 'ca.persona_id')
                    ->where('i.estado', 'Activo');
            })
            ->leftJoin('integrantes_historial as ih', function ($join): void {
                $join->on('ih.integrante_id', '=', 'i.id')
                    ->where('ih.estado', 'Activo');
            })
            ->leftJoin('cargos as c', 'c.id', '=', 'ih.cargo_id')
            ->leftJoin('areas as a', 'a.id', '=', 'c.area_id')
            ->leftJoin('roles as r', 'r.id', '=', 'c.rol_id')
            ->where('ca.user_id', $userId)
            ->orderByDesc('ih.fecha_inicio')
            ->orderByDesc('ih.id')
            ->select([
                'ca.id as account_id',
                'ca.activo as account_active',
                'i.id as integrante_id',
                'i.estado as integrante_estado',
                'ih.id as historial_id',
                'c.id as cargo_id',
                'c.nombre as cargo_nombre',
                'c.activo as cargo_activo',
                'a.id as area_id',
                'a.nombre as area_nombre',
                'a.activo as area_activo',
                'r.id as rol_id',
                'r.codigo as rol_codigo',
                'r.acceso_total as rol_acceso_total',
                'r.activo as rol_activo',
            ])
            ->first();

        if ($snapshot === null) {
            return $this->hashPermissionsVersion(null, null, null, []);
        }

        $permissions = $snapshot->rol_id === null
            ? []
            : $this->getRolePermissions(
                (int) $snapshot->rol_id,
                (string) $snapshot->account_id,
                (string) $snapshot->rol_codigo,
                (string) $snapshot->area_nombre,
                (string) $snapshot->cargo_nombre,
            );

        return $this->hashPermissionsVersion(
            (object) [
                'id' => $snapshot->account_id,
                'activo' => $snapshot->account_active,
            ],
            (object) [
                'id' => $snapshot->integrante_id,
                'estado' => $snapshot->integrante_estado,
            ],
            (object) [
                'historial_id' => $snapshot->historial_id,
                'cargo_id' => $snapshot->cargo_id,
                'cargo_nombre' => $snapshot->cargo_nombre,
                'cargo_activo' => $snapshot->cargo_activo,
                'area_id' => $snapshot->area_id,
                'area_nombre' => $snapshot->area_nombre,
                'area_activo' => $snapshot->area_activo,
                'rol_id' => $snapshot->rol_id,
                'rol_codigo' => $snapshot->rol_codigo,
                'rol_acceso_total' => $snapshot->rol_acceso_total,
                'rol_activo' => $snapshot->rol_activo,
            ],
            $permissions,
        );
    }

    /**
     * Obtiene la cuenta institucional vinculada
     * al usuario Laravel.
     */
    private function getAccount(int $userId): ?object
    {
        return DB::table('cuentas_acceso')
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Obtiene la persona institucional.
     */
    private function getPersona(string $personaId): ?object
    {
        return DB::table('personas')
            ->where('id', $personaId)
            ->first();
    }

    /**
     * Obtiene el integrante activo asociado a la persona.
     */
    private function getActiveIntegrante(string $personaId): ?object
    {
        return DB::table('integrantes')
            ->where('persona_id', $personaId)
            ->where('estado', 'Activo')
            ->first();
    }

    /**
     * Obtiene el historial activo junto con:
     * cargo -> área -> rol.
     */
    private function getActiveHistory(int $integranteId): ?object
    {
        return DB::table('integrantes_historial as ih')
            ->join('cargos as c', 'c.id', '=', 'ih.cargo_id')
            ->join('areas as a', 'a.id', '=', 'c.area_id')
            ->join('roles as r', 'r.id', '=', 'c.rol_id')
            ->where('ih.integrante_id', $integranteId)
            ->where('ih.estado', 'Activo')
            ->where('c.activo', true)
            ->where('a.activo', true)
            ->where('r.activo', true)
            ->orderByDesc('ih.fecha_inicio')
            ->orderByDesc('ih.id')
            ->select([
                'ih.id as historial_id',
                'ih.tipo_integrante',
                'ih.fecha_inicio',
                'ih.fecha_fin',
                'ih.periodo_meses',
                'ih.estado as historial_estado',
                'ih.requiere_asistencia',           // 🆕 NUEVO
                'ih.institucion_educativa',
                'ih.horas_practicas_requeridas',
                'ih.carrera',
                'ih.ciclo',
                'ih.modalidad',

                'c.id as cargo_id',
                'c.nombre as cargo_nombre',
                'c.descripcion as cargo_descripcion',
                'c.activo as cargo_activo',

                'a.id as area_id',
                'a.nombre as area_nombre',
                'a.descripcion as area_descripcion',
                'a.activo as area_activo',

                'r.id as rol_id',
                'r.codigo as rol_codigo',
                'r.nombre as rol_nombre',
                'r.descripcion as rol_descripcion',
                'r.acceso_total as rol_acceso_total',
                'r.activo as rol_activo',
            ])
            ->first();
    }

    /**
     * Obtiene los permisos efectivos del rol.
     */
    private function getRolePermissions(
        int $roleId,
        string $accountId,
        string $roleCode,
        string $areaName,
        string $cargoName,
    ): array {
        $permissions = DB::table('rol_permisos as rp')
            ->join('permisos as p', 'p.id', '=', 'rp.permiso_id')
            ->where('rp.rol_id', $roleId)
            ->where('p.activo', true)
            ->select([
                'p.id',
                'p.codigo',
                'p.nombre',
                'p.modulo',
                'p.accion',
                'p.descripcion',
                'rp.alcance',
            ])
            ->orderBy('p.modulo')
            ->orderBy('p.accion')
            ->get()
            ->reject(fn ($permission): bool => $permission->codigo === 'gp.capacitaciones.ver'
                && ! $this->authorization->canViewProjectTraining(
                    $accountId,
                    $areaName,
                    $cargoName,
                ))
            ->map(fn ($permission) => [
                'id' => $permission->id,
                'codigo' => $permission->codigo,
                'nombre' => $permission->nombre,
                'modulo' => $permission->modulo,
                'accion' => $permission->accion,
                'descripcion' => $permission->descripcion,
                'alcance' => $permission->alcance,
            ])
            ->values()
            ->all();

        $automaticCodes = collect($this->authorization->automaticPermissionCodes(
            $accountId,
            $roleCode,
            $areaName,
            $cargoName,
        ))
            ->diff(collect($permissions)->pluck('codigo'))
            ->values();

        if ($automaticCodes->isEmpty()) {
            return $permissions;
        }

        $automaticPermissions = DB::table('permisos')
            ->whereIn('codigo', $automaticCodes)
            ->where('activo', true)
            ->select(['id', 'codigo', 'nombre', 'modulo', 'accion', 'descripcion'])
            ->orderBy('modulo')
            ->orderBy('accion')
            ->get()
            ->map(fn ($permission) => [
                'id' => $permission->id,
                'codigo' => $permission->codigo,
                'nombre' => $permission->nombre,
                'modulo' => $permission->modulo,
                'accion' => $permission->accion,
                'descripcion' => $permission->descripcion,
                'alcance' => 'area',
            ])
            ->all();

        return [...$permissions, ...$automaticPermissions];
    }

    private function hashPermissionsVersion(
        ?object $account,
        ?object $integrante,
        ?object $historial,
        array $permissions,
    ): string {
        $normalizedPermissions = collect($permissions)
            ->map(fn (array $permission): array => [
                'id' => (int) $permission['id'],
                'codigo' => (string) $permission['codigo'],
                'nombre' => (string) $permission['nombre'],
                'modulo' => (string) $permission['modulo'],
                'accion' => (string) $permission['accion'],
                'descripcion' => $permission['descripcion'],
                'alcance' => (string) $permission['alcance'],
            ])
            ->sortBy([
                ['codigo', 'asc'],
                ['alcance', 'asc'],
                ['id', 'asc'],
            ])
            ->values()
            ->all();

        return hash('sha256', json_encode([
            'account_id' => $account?->id,
            'account_active' => $account === null ? null : (bool) $account->activo,
            'integrante_id' => $integrante?->id === null ? null : (int) $integrante->id,
            'integrante_estado' => $integrante?->estado,
            'historial_id' => $historial?->historial_id === null ? null : (int) $historial->historial_id,
            'cargo_id' => $historial?->cargo_id === null ? null : (int) $historial->cargo_id,
            'cargo_nombre' => $historial?->cargo_nombre,
            'cargo_activo' => $historial === null ? null : (bool) $historial->cargo_activo,
            'area_id' => $historial?->area_id === null ? null : (int) $historial->area_id,
            'area_nombre' => $historial?->area_nombre,
            'area_activo' => $historial === null ? null : (bool) $historial->area_activo,
            'rol_id' => $historial?->rol_id === null ? null : (int) $historial->rol_id,
            'rol_codigo' => $historial?->rol_codigo,
            'rol_acceso_total' => $historial === null ? null : (bool) $historial->rol_acceso_total,
            'rol_activo' => $historial === null ? null : (bool) $historial->rol_activo,
            'permissions' => $normalizedPermissions,
        ], JSON_THROW_ON_ERROR));
    }
}
