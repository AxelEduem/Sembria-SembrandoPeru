<?php

namespace App\Services\Auth;

use App\Data\Auth\AuthorizationScope;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InstitutionalAuthorizationService
{
    private const PROJECT_MANAGEMENT_AREA = 'GESTIÓN DE PROYECTOS';

    private const PROJECT_MANAGEMENT_COORDINATOR_CARGO = 'COORDINADOR DE GESTIÓN DE PROYECTOS';

    private const PROJECT_MANAGEMENT_CO_COORDINATOR_CARGO = 'CO-COORDINADOR DE GESTIÓN DE PROYECTOS';

    private const PROJECT_MANAGEMENT_MEMBER_CARGO = 'MIEMBRO DE GESTIÓN DE PROYECTOS';

    /**
     * Autoriza cualquiera de los permisos indicados y devuelve su alcance efectivo.
     * El navegador nunca decide el área autorizada.
     *
     * @param  list<string>  $permissionCodes
     */
    public function scope(User $user, array $permissionCodes): AuthorizationScope
    {
        $identity = DB::table('cuentas_acceso as ca')
            ->join('integrantes as i', function ($join): void {
                $join->on('i.persona_id', '=', 'ca.persona_id')->where('i.estado', 'Activo');
            })
            ->join('integrantes_historial as ih', function ($join): void {
                $join->on('ih.integrante_id', '=', 'i.id')->where('ih.estado', 'Activo');
            })
            ->join('cargos as c', 'c.id', '=', 'ih.cargo_id')
            ->join('areas as a', 'a.id', '=', 'c.area_id')
            ->join('roles as r', 'r.id', '=', 'c.rol_id')
            ->where('ca.user_id', $user->id)
            ->where('ca.activo', true)
            ->where('c.activo', true)
            ->where('r.activo', true)
            ->orderByDesc('ih.fecha_inicio')
            ->orderByDesc('ih.id')
            ->select(
                'ca.id as account_id',
                'ca.persona_id',
                'c.area_id',
                'c.nombre as cargo_name',
                'a.nombre as area_name',
                'r.id as role_id',
                'r.codigo as role_code',
                'r.acceso_total',
            )
            ->first();

        if ($identity === null) {
            throw new AuthorizationException('La cuenta institucional no está activa o configurada.');
        }

        if ((bool) $identity->acceso_total) {
            return new AuthorizationScope(true, null, $identity->account_id, $identity->persona_id, true);
        }

        if (
            in_array('gp.capacitaciones.ver', $permissionCodes, true)
            && ! $this->canViewProjectTraining(
                $identity->account_id,
                $identity->area_name,
                $identity->cargo_name,
            )
        ) {
            throw new AuthorizationException('Tu capacitación finalizó y el periodo de consulta ya terminó.');
        }

        $permissions = DB::table('rol_permisos as rp')
            ->join('permisos as p', 'p.id', '=', 'rp.permiso_id')
            ->where('rp.rol_id', $identity->role_id)
            ->where('p.activo', true)
            ->whereIn('p.codigo', $permissionCodes)
            ->pluck('rp.alcance');

        $automaticPermissions = array_intersect(
            $permissionCodes,
            $this->automaticPermissionCodes(
                $identity->account_id,
                $identity->role_code,
                $identity->area_name,
                $identity->cargo_name,
            ),
        );

        if ($permissions->isEmpty() && $automaticPermissions === []) {
            throw new AuthorizationException('No tienes permisos para realizar esta acción.');
        }

        return new AuthorizationScope(
            $permissions->contains('global'),
            (int) $identity->area_id,
            $identity->account_id,
            $identity->persona_id,
            false,
        );
    }

    /** @return list<string> */
    public function automaticPermissionCodes(
        string $accountId,
        string $roleCode,
        string $areaName,
        string $cargoName,
    ): array {
        $permissions = $this->teamPermissionCodes($accountId, $roleCode);

        if (
            $roleCode === 'coordinador_area'
            && mb_strtoupper(trim($areaName), 'UTF-8') === self::PROJECT_MANAGEMENT_AREA
            && mb_strtoupper(trim($cargoName), 'UTF-8') === self::PROJECT_MANAGEMENT_COORDINATOR_CARGO
        ) {
            $permissions = [
                ...$permissions,
                'gp.equipos.ver',
                'gp.equipos.crear',
                'gp.equipos.editar',
                'gp.equipos.descargar_excel',
                'gp.equipos.ver_metricas',
                'gp.convocatorias.ver',
                'gp.convocatorias.aprobar',
                'gp.convocatorias.ver_aprobacion',
                'gp.convocatorias.postular',
                'gp.convocatorias.ver_postulacion',
                'gp.convocatorias.ver_envio',
                'gp.convocatorias.ver_seguimiento',
                'gp.convocatorias.ver_cierre',
                'gp.capacitaciones.ver',
                'gp.capacitaciones.gestionar',
            ];
        }

        if (
            $roleCode === 'co_coordinador_area'
            && mb_strtoupper(trim($areaName), 'UTF-8') === self::PROJECT_MANAGEMENT_AREA
            && mb_strtoupper(trim($cargoName), 'UTF-8') === self::PROJECT_MANAGEMENT_CO_COORDINATOR_CARGO
        ) {
            $permissions = [
                ...$permissions,
                'gp.equipos.ver',
                'gp.equipos.crear',
                'gp.equipos.editar',
                'gp.equipos.descargar_excel',
                'gp.equipos.ver_metricas',
                'gp.convocatorias.ver',
                'gp.convocatorias.revisar',
                'gp.capacitaciones.ver',
                'gp.capacitaciones.gestionar',
            ];
        }

        if (
            mb_strtoupper(trim($areaName), 'UTF-8') === self::PROJECT_MANAGEMENT_AREA
            && mb_strtoupper(trim($cargoName), 'UTF-8') === self::PROJECT_MANAGEMENT_MEMBER_CARGO
            && $this->canViewProjectTraining($accountId, $areaName, $cargoName)
        ) {
            $permissions[] = 'gp.capacitaciones.ver';
        }

        return array_values(array_unique($permissions));
    }

    public function canViewProjectTraining(string $accountId, string $areaName, string $cargoName): bool
    {
        if (
            mb_strtoupper(trim($areaName), 'UTF-8') !== self::PROJECT_MANAGEMENT_AREA
            || mb_strtoupper(trim($cargoName), 'UTF-8') !== self::PROJECT_MANAGEMENT_MEMBER_CARGO
        ) {
            return true;
        }

        if (! Schema::hasTable('gp_capacitaciones')) {
            return true;
        }

        $completedAt = DB::table('cuentas_acceso as ca')
            ->join('integrantes as i', function ($join): void {
                $join->on('i.persona_id', '=', 'ca.persona_id')->where('i.estado', 'Activo');
            })
            ->leftJoin('gp_capacitaciones as gc', 'gc.integrante_id', '=', 'i.id')
            ->where('ca.id', $accountId)
            ->where('ca.activo', true)
            ->value('gc.fase_3_completada_at');

        return $completedAt === null
            || CarbonImmutable::parse($completedAt)->addDay()->isFuture();
    }

    /** @return list<string> */
    public function teamPermissionCodes(string $accountId, string $roleCode): array
    {
        // Antes: early-return si roleCode !== 'integrante'.
        // Ahora: la verdad la dice la tabla gp_equipo_integrantes, no el rol del cargo.
        return match ($this->teamMembership($accountId)?->rol) {
            'lider' => ['gp.convocatorias.ver', 'gp.convocatorias.evaluar'],
            'integrante' => ['gp.convocatorias.ver', 'gp.convocatorias.crear'],
            default => [],
        };
    }

    public function teamMembership(string $accountId): ?object
    {
        if (! Schema::hasTable('gp_equipo_integrantes') || ! Schema::hasTable('gp_equipos')) {
            return null;
        }

        return DB::table('cuentas_acceso as ca')
            ->join('integrantes as i', function ($join): void {
                $join->on('i.persona_id', '=', 'ca.persona_id')->where('i.estado', 'Activo');
            })
            ->join('integrantes_historial as ih', function ($join): void {
                $join->on('ih.integrante_id', '=', 'i.id')->where('ih.estado', 'Activo');
            })
            ->join('cargos as c', function ($join): void {
                $join->on('c.id', '=', 'ih.cargo_id')->where('c.activo', true);
            })
            ->join('gp_equipo_integrantes as gei', 'gei.integrante_id', '=', 'i.id')
            ->join('gp_equipos as ge', function ($join): void {
                $join->on('ge.id', '=', 'gei.equipo_id')->where('ge.activo', true);
            })
            ->where('ca.id', $accountId)
            ->where('ca.activo', true)
            ->orderByDesc('ih.fecha_inicio')
            ->orderByDesc('ih.id')
            ->select('ge.id as equipo_id', 'ge.area_id', 'gei.rol')
            ->first();
    }

    /** @param list<string> $permissionCodes */
    public function authorizeArea(User $user, array $permissionCodes, int $areaId): AuthorizationScope
    {
        $scope = $this->scope($user, $permissionCodes);

        if (! $scope->global && $scope->areaId !== $areaId) {
            throw new AuthorizationException('No puedes administrar integrantes fuera del alcance de tu área.');
        }

        return $scope;
    }

    public function ownsPersona(User $user, string $personaId): bool
    {
        return DB::table('cuentas_acceso')
            ->where('user_id', $user->id)
            ->where('persona_id', $personaId)
            ->where('activo', true)
            ->exists();
    }
}
