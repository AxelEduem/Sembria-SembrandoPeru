<?php

namespace App\Services\Integrantes;

use App\Models\Integrante;
use App\Models\IntegranteHistorial;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class IntegranteQueryService
{
    public const LIST_PERMISSIONS = ['integrantes.ver', 'voluntarios.ver', 'practicantes.ver', 'accesos.ver', 'accesos.gestionar'];

    public const DETAIL_PERMISSIONS = ['integrantes.ver_detalle'];

    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function list(
        User $user,
        array $filters = [],
        ?int $perPage = null,
    ): Collection|LengthAwarePaginator {
        $query = $this->filteredListQuery($user, $filters, self::LIST_PERMISSIONS);

        if ($perPage === null) {
            return $query->get();
        }

        return $query->paginate(
            $perPage,
            ['integrantes.*'],
            'pagina',
            (int) ($filters['pagina'] ?? 1),
        );
    }

    public function export(User $user, array $filters = []): Collection
    {
        return $this->filteredListQuery(
            $user,
            $filters,
            ['integrantes.descargar_excel'],
        )->get();
    }

    public function find(User $user, int $id, array $permissions = self::DETAIL_PERMISSIONS): Integrante
    {
        $integrante = Integrante::query()->with($this->relations())->findOrFail($id);
        $areaId = $this->currentHistory($integrante)?->cargo?->area_id;

        if ($areaId === null) {
            $this->authorization->scope($user, $permissions);
        } else {
            $this->authorization->authorizeArea($user, $permissions, (int) $areaId);
        }

        return $integrante;
    }

    public function history(User $user, int $id): Integrante
    {
        $integrante = $this->find($user, $id, ['integrantes.ver_historial']);
        $integrante->loadMissing('historiales.horarios');

        return $integrante;
    }

    public function attendanceHours(User $user, int $id): float
    {
        $this->find($user, $id);

        return $this->completedAttendanceHours($id);
    }

    public function mineAttendanceHours(User $user): float
    {
        $integrante = $this->mine($user);

        return $integrante === null ? 0 : $this->completedAttendanceHours($integrante->id);
    }

    private function completedAttendanceHours(int $integranteId): float
    {

        $minutes = DB::table('asistencias')
            ->where('integrante_id', $integranteId)
            ->whereIn('estado', ['completada', 'justificada'])
            ->sum('minutos_realizados');

        return round(((int) $minutes) / 60, 2);
    }

    public function mine(User $user): ?Integrante
    {
        $account = $user->cuentaAcceso()->where('activo', true)->first();

        if ($account === null) {
            return null;
        }

        return Integrante::query()
            ->with($this->relations())
            ->where('persona_id', $account->persona_id)
            ->latest('id')
            ->first();
    }

    public function catalogs(User $user): array
    {
        $scope = $this->authorization->scope($user, [
            'integrantes.ver', 'integrantes.crear', 'integrantes.editar', 'integrantes.recontratar',
            'voluntarios.ver', 'voluntarios.crear', 'voluntarios.editar', 'voluntarios.recontratar',
            'practicantes.ver', 'practicantes.crear', 'practicantes.editar',
        ]);

        $areas = DB::table('areas')
            ->when(! $scope->global, fn ($query) => $query->where('id', $scope->areaId))
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'descripcion', 'activo']);
        $cargos = DB::table('cargos')
            ->when(! $scope->global, fn ($query) => $query->where('area_id', $scope->areaId))
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'descripcion', 'area_id', 'rol_id', 'activo']);
        $periods = DB::table('integrantes_historial as history')
            ->join('cargos as position', 'position.id', '=', 'history.cargo_id')
            ->whereNotNull('history.periodo_meses')
            ->when(! $scope->global, fn ($query) => $query->where('position.area_id', $scope->areaId))
            ->distinct()
            ->orderBy('history.periodo_meses')
            ->pluck('history.periodo_meses')
            ->map(fn ($period): int => (int) $period)
            ->values();

        return ['areas' => $areas, 'cargos' => $cargos, 'periodos' => $periods];
    }

    public function birthdays(User $user): Collection
    {
        $scope = $this->authorization->scope($user, ['cumpleanos.ver']);

        return Integrante::query()
            ->with(['persona', 'historiales.cargo.area'])
            ->where('estado', 'Activo')
            ->whereNotNull('fecha_nacimiento')
            ->whereHas('persona.cuentaAcceso', fn ($query) => $query->where('activo', true))
            ->get()
            ->filter(function (Integrante $integrante) use ($scope): bool {
                $history = $this->currentHistory($integrante);

                if ($history?->estado !== 'Activo') {
                    return false;
                }

                return $scope->global || (int) $history->cargo?->area_id === $scope->areaId;
            })
            ->values();
    }

    public function currentHistory(Integrante $integrante): ?IntegranteHistorial
    {
        $histories = $integrante->relationLoaded('historiales')
            ? $integrante->historiales
            : $integrante->historiales()->with(['cargo.area', 'cargo.role'])->get();
        $today = CarbonImmutable::now('America/Lima')->toDateString();
        $covers = fn (IntegranteHistorial $row): bool => ($row->fecha_inicio === null || $row->fecha_inicio->format('Y-m-d') <= $today)
            && ($row->fecha_fin === null || $row->fecha_fin->format('Y-m-d') >= $today);

        return $histories->first(fn ($row) => $row->estado === 'Activo' && $covers($row))
            ?? $histories->first($covers)
            ?? $histories->firstWhere('estado', 'Activo')
            ?? $histories->first();
    }

    public function fresh(int $id): Integrante
    {
        return Integrante::query()->with($this->relations())->findOrFail($id);
    }

    private function relations(): array
    {
        return ['persona', 'historiales.cargo.area', 'historiales.cargo.role', 'historiales.desactivador.persona'];
    }

    private function filteredListQuery(User $user, array $filters, array $permissions): Builder
    {
        $scope = $this->authorization->scope($user, $permissions);
        $today = CarbonImmutable::now('America/Lima')->toDateString();
        $rankedHistories = DB::table('integrantes_historial as ranked_history')
            ->select([
                'ranked_history.id',
                'ranked_history.integrante_id',
                'ranked_history.tipo_integrante',
                'ranked_history.cargo_id',
                'ranked_history.periodo_meses',
            ])
            ->selectRaw(
                <<<'SQL'
                    ROW_NUMBER() OVER (
                        PARTITION BY ranked_history.integrante_id
                        ORDER BY
                            CASE
                                WHEN ranked_history.estado = 'Activo'
                                    AND (ranked_history.fecha_inicio IS NULL OR ranked_history.fecha_inicio <= ?)
                                    AND (ranked_history.fecha_fin IS NULL OR ranked_history.fecha_fin >= ?) THEN 0
                                WHEN (ranked_history.fecha_inicio IS NULL OR ranked_history.fecha_inicio <= ?)
                                    AND (ranked_history.fecha_fin IS NULL OR ranked_history.fecha_fin >= ?) THEN 1
                                WHEN ranked_history.estado = 'Activo' THEN 2
                                ELSE 3
                            END,
                            ranked_history.created_at DESC,
                            ranked_history.id DESC
                    ) AS position_rank
                    SQL,
                [$today, $today, $today, $today],
            );

        return Integrante::query()
            ->select('integrantes.*')
            ->join('personas as list_person', 'list_person.id', '=', 'integrantes.persona_id')
            ->leftJoinSub($rankedHistories, 'current_history', function ($join): void {
                $join->on('current_history.integrante_id', '=', 'integrantes.id')
                    ->where('current_history.position_rank', 1);
            })
            ->leftJoin('cargos as current_position', 'current_position.id', '=', 'current_history.cargo_id')
            ->with($this->relations())
            ->when(! $scope->global, fn ($item) => $item->where('current_position.area_id', $scope->areaId))
            ->when(array_key_exists('inactive', $filters), fn ($item) => $item->where(
                'integrantes.estado',
                $filters['inactive'] ? 'Inactivo' : 'Activo',
            ))
            ->when(
                ! array_key_exists('inactive', $filters) && isset($filters['estado']),
                fn ($item) => $item->where(
                    'integrantes.estado',
                    $filters['estado'] === 'inactivo' ? 'Inactivo' : 'Activo',
                ),
            )
            ->when(
                $filters['con_cuenta'] ?? false,
                fn ($item) => $item->whereHas(
                    'persona.cuentaAcceso',
                    fn ($account) => $account->where('activo', true),
                ),
            )
            ->when(
                $filters['tipo_integrante'] ?? $filters['tipo'] ?? null,
                fn ($item, $type) => $item->where('current_history.tipo_integrante', $type),
            )
            ->when($filters['area'] ?? null, fn ($item, $area) => $item->where('current_position.area_id', $area))
            ->when($filters['cargo'] ?? null, fn ($item, $position) => $item->where('current_history.cargo_id', $position))
            ->when($filters['periodo'] ?? null, fn ($item, $period) => $item->where('current_history.periodo_meses', $period))
            ->when($filters['fecha'] ?? null, fn ($item, $date) => $item->whereDate('integrantes.created_at', $date))
            ->when(trim((string) ($filters['q'] ?? '')), function ($item, $search): void {
                $term = '%'.mb_strtolower(trim((string) $search)).'%';
                $item->where(function ($matches) use ($term): void {
                    $matches
                        ->whereRaw("LOWER(COALESCE(list_person.nombres, '') || ' ' || COALESCE(list_person.apellidos, '')) LIKE ?", [$term])
                        ->orWhereRaw("LOWER(COALESCE(list_person.correo, '')) LIKE ?", [$term])
                        ->orWhereRaw("LOWER(COALESCE(integrantes.documento_identidad, '')) LIKE ?", [$term])
                        ->orWhereRaw("LOWER(COALESCE(integrantes.telefono, '')) LIKE ?", [$term]);
                });
            })
            ->latest('integrantes.created_at')
            ->latest('integrantes.id');
    }
}
