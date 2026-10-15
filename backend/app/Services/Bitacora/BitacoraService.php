<?php

namespace App\Services\Bitacora;

use App\Data\Auth\AuthorizationScope;
use App\Models\Bitacora;
use App\Models\Integrante;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class BitacoraService
{
    private const EXPORT_LIMIT = 5000;

    private const SENSITIVE_FIELDS = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'access_token',
        'refresh_token',
        'remember_token',
        'documento_identidad',
    ];

    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    /** @return array{records: LengthAwarePaginator, summary: array<string, int>, catalogs: array<string, array<int, string>>} */
    public function search(User $user, array $filters): array
    {
        $scope = $this->authorization->scope($user, ['bitacora.ver']);
        $query = $this->applyFilters($this->scopedQuery($scope), $filters);

        $records = (clone $query)
            ->latest('created_at')
            ->latest('id')
            ->paginate((int) ($filters['per_page'] ?? 20));

        return [
            'records' => $records,
            'summary' => [
                'total' => (clone $query)->count(),
                'exitosos' => (clone $query)->where('resultado', 'exitoso')->count(),
                'errores' => (clone $query)->where('resultado', 'error')->count(),
                'usuarios' => (clone $query)->whereNotNull('cuenta_acceso_id')->distinct()->count('cuenta_acceso_id'),
            ],
            'catalogs' => [
                'modulos' => $this->scopedQuery($scope)->distinct()->orderBy('modulo')->pluck('modulo')->values()->all(),
                'acciones' => $this->scopedQuery($scope)->distinct()->orderBy('accion')->pluck('accion')->values()->all(),
            ],
        ];
    }

    /** @return array{records: Collection<int, Bitacora>, truncated: bool, limit: int} */
    public function export(User $user, array $filters): array
    {
        $scope = $this->authorization->scope($user, ['bitacora.descargar_excel']);
        $records = $this->applyFilters($this->scopedQuery($scope), $filters)
            ->latest('created_at')
            ->latest('id')
            ->limit(self::EXPORT_LIMIT + 1)
            ->get();
        $truncated = $records->count() > self::EXPORT_LIMIT;

        return [
            'records' => $records->take(self::EXPORT_LIMIT)->values(),
            'truncated' => $truncated,
            'limit' => self::EXPORT_LIMIT,
        ];
    }

    /** @return array<string, mixed> */
    public function metrics(User $user): array
    {
        $scope = $this->authorization->scope($user, ['bitacora.ver_metricas']);
        $query = $this->scopedQuery($scope);
        $total = (clone $query)->count();
        $success = (clone $query)->where('resultado', 'exitoso')->count();
        $since = now()->subDays(29)->startOfDay();

        return [
            'summary' => [
                'total' => $total,
                'exitosos' => $success,
                'errores' => (clone $query)->where('resultado', 'error')->count(),
                'usuarios' => (clone $query)->whereNotNull('cuenta_acceso_id')->distinct()->count('cuenta_acceso_id'),
                'tasa_exito' => $total > 0 ? round(($success / $total) * 100, 1) : 0,
            ],
            'por_modulo' => (clone $query)
                ->selectRaw('modulo as nombre, COUNT(*) as total')
                ->selectRaw("SUM(CASE WHEN resultado = 'error' THEN 1 ELSE 0 END) as errores")
                ->groupBy('modulo')
                ->orderByDesc('total')
                ->limit(10)
                ->get(),
            'por_accion' => (clone $query)
                ->selectRaw('accion as nombre, COUNT(*) as total')
                ->groupBy('accion')
                ->orderByDesc('total')
                ->limit(10)
                ->get(),
            'por_dia' => (clone $query)
                ->where('created_at', '>=', $since)
                ->selectRaw('DATE(created_at) as fecha, COUNT(*) as total')
                ->selectRaw("SUM(CASE WHEN resultado = 'error' THEN 1 ELSE 0 END) as errores")
                ->groupByRaw('DATE(created_at)')
                ->orderBy('fecha')
                ->get(),
            'usuarios_activos' => (clone $query)
                ->whereNotNull('cuenta_acceso_id')
                ->selectRaw('actor_nombre as nombre, actor_correo as correo, COUNT(*) as total')
                ->groupBy('cuenta_acceso_id', 'actor_nombre', 'actor_correo')
                ->orderByDesc('total')
                ->limit(8)
                ->get(),
        ];
    }

    public function record(Request $request, int $status, ?Response $response = null): void
    {
        $user = $request->user();
        if (! $user instanceof User || in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }

        $identity = $this->actorIdentity($user);
        $route = $request->route();
        $routeParameters = $route?->parameters() ?? [];
        $parameters = collect($routeParameters)->map(function (mixed $value): mixed {
            if ($value instanceof Model) {
                return $value->getKey();
            }

            return is_scalar($value) ? $value : null;
        })->filter(fn (mixed $value): bool => $value !== null)->all();
        $action = Str::snake((string) ($route?->getActionMethod() ?: $request->method()));
        $module = $this->moduleFromRoute((string) ($route?->uri() ?: $request->path()));
        $responseData = $this->responseData($response);
        $entityType = array_key_last($parameters) ?: $this->entityTypeFromModule($module);
        $entityId = $entityType && array_key_exists($entityType, $parameters)
            ? $parameters[$entityType]
            : ($responseData['id'] ?? null);
        $entityModel = $entityType && (($routeParameters[$entityType] ?? null) instanceof Model)
            ? $routeParameters[$entityType]
            : null;
        $entityName = $this->entityName($responseData, $entityModel, $request->all());
        $context = $parameters;

        if ($entityName !== null) {
            $context['entidad_nombre'] = $entityName;
        }

        Bitacora::query()->create([
            'cuenta_acceso_id' => $identity?->account_id,
            'area_id' => $identity?->area_id,
            'actor_nombre' => $identity
                ? trim("{$identity->nombres} {$identity->apellidos}") ?: $user->name
                : $user->name,
            'actor_correo' => $identity?->correo ?: $user->email,
            'actor_avatar_path' => $identity?->avatar_path,
            'area_nombre' => $identity?->area_name,
            'modulo' => $module,
            'accion' => $action,
            'descripcion' => $this->description($module, $action, $entityType, $entityId, $entityName),
            'entidad_tipo' => $entityType,
            'entidad_id' => $entityId !== null ? (string) $entityId : null,
            'metodo' => $request->method(),
            'ruta' => (string) ($route?->uri() ?: $request->path()),
            'estado_http' => $status,
            'resultado' => $status < 400 ? 'exitoso' : 'error',
            'campos_modificados' => collect(array_keys($request->all()))
                ->reject(fn (string $field): bool => in_array(Str::lower($field), self::SENSITIVE_FIELDS, true))
                ->values()
                ->all(),
            'contexto' => $context,
            'ip' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 1000, ''),
        ]);
    }

    private function scopedQuery(AuthorizationScope $scope): Builder
    {
        return Bitacora::query()
            ->when(! $scope->global, fn (Builder $query) => $query->where('area_id', $scope->areaId));
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        $search = mb_strtolower(trim((string) ($filters['q'] ?? '')), 'UTF-8');

        return $query
            ->when($search !== '', function (Builder $builder) use ($search): void {
                $like = "%{$search}%";
                $builder->where(function (Builder $nested) use ($like): void {
                    $nested
                        ->whereRaw('LOWER(actor_nombre) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(COALESCE(actor_correo, ?)) LIKE ?', ['', $like])
                        ->orWhereRaw('LOWER(descripcion) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(COALESCE(entidad_tipo, ?)) LIKE ?', ['', $like])
                        ->orWhereRaw('LOWER(COALESCE(entidad_id, ?)) LIKE ?', ['', $like]);
                });
            })
            ->when($filters['modulo'] ?? null, fn (Builder $builder, string $module) => $builder->where('modulo', $module))
            ->when($filters['accion'] ?? null, fn (Builder $builder, string $action) => $builder->where('accion', $action))
            ->when($filters['resultado'] ?? null, fn (Builder $builder, string $result) => $builder->where('resultado', $result))
            ->when($filters['desde'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('created_at', '>=', $date))
            ->when($filters['hasta'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('created_at', '<=', $date));
    }

    private function actorIdentity(User $user): ?object
    {
        return DB::table('cuentas_acceso as ca')
            ->join('personas as p', 'p.id', '=', 'ca.persona_id')
            ->leftJoin('integrantes as i', function ($join): void {
                $join->on('i.persona_id', '=', 'p.id')->where('i.estado', 'Activo');
            })
            ->leftJoin('integrantes_historial as ih', function ($join): void {
                $join->on('ih.integrante_id', '=', 'i.id')->where('ih.estado', 'Activo');
            })
            ->leftJoin('cargos as c', 'c.id', '=', 'ih.cargo_id')
            ->leftJoin('areas as a', 'a.id', '=', 'c.area_id')
            ->where('ca.user_id', $user->id)
            ->orderByDesc('ih.fecha_inicio')
            ->orderByDesc('ih.id')
            ->select([
                'ca.id as account_id',
                'a.id as area_id',
                'a.nombre as area_name',
                'p.nombres',
                'p.apellidos',
                'p.correo',
                'i.avatar_path',
            ])
            ->first();
    }

    private function moduleFromRoute(string $route): string
    {
        $normalizedRoute = Str::after($route, 'api/');
        $firstSegment = Str::before($normalizedRoute, '/');

        return match ($firstSegment) {
            'mi-asistencia', 'asistencia', 'notificaciones' => 'asistencia',
            'gestion-proyectos' => 'gestion_proyectos',
            'profile', 'me' => 'perfil',
            default => Str::snake($firstSegment),
        };
    }

    /** @return array<string, mixed> */
    private function responseData(?Response $response): array
    {
        if ($response === null || ! Str::contains((string) $response->headers->get('Content-Type'), 'json')) {
            return [];
        }

        $decoded = json_decode((string) $response->getContent(), true);
        $data = is_array($decoded) ? ($decoded['data'] ?? $decoded) : [];

        return is_array($data) && ! array_is_list($data) ? $data : [];
    }

    private function entityTypeFromModule(string $module): ?string
    {
        return match ($module) {
            'integrantes' => 'integrante',
            'areas' => 'area',
            'cargos' => 'cargo',
            'roles' => 'rol',
            'aplicaciones' => 'aplicacion',
            'tareas' => 'tarea',
            'agenda' => 'reunion',
            default => null,
        };
    }

    /** @param array<string, mixed> $responseData */
    private function entityName(array $responseData, ?Model $model, array $requestData): ?string
    {
        foreach ([$responseData, $this->modelDisplayData($model), $requestData] as $source) {
            $name = $this->displayNameFromArray($source);

            if ($name !== null) {
                return $name;
            }
        }

        return null;
    }

    /** @return array<string, mixed> */
    private function modelDisplayData(?Model $model): array
    {
        if ($model === null) {
            return [];
        }

        if ($model instanceof Integrante) {
            $model->loadMissing('persona');

            return [
                'nombres' => $model->persona?->nombres,
                'apellidos' => $model->persona?->apellidos,
            ];
        }

        return $model->only(['nombre', 'titulo', 'name', 'codigo']);
    }

    /** @param array<string, mixed> $data */
    private function displayNameFromArray(array $data): ?string
    {
        foreach (['nombre', 'nombre_completo', 'titulo', 'name', 'codigo'] as $field) {
            $value = trim((string) ($data[$field] ?? ''));

            if ($value !== '') {
                return Str::limit($value, 180, '');
            }
        }

        $fullName = trim(sprintf('%s %s', $data['nombres'] ?? '', $data['apellidos'] ?? ''));

        return $fullName !== '' ? Str::limit($fullName, 180, '') : null;
    }

    private function description(
        string $module,
        string $action,
        ?string $entityType,
        mixed $entityId,
        ?string $entityName,
    ): string {
        $target = $this->entityReference($entityType, $entityId, $entityName);
        $directTarget = $entityType === 'integrante'
            ? Str::replaceStart('el integrante', 'al integrante', $target)
            : $target;
        $ofTarget = Str::startsWith($target, 'el ')
            ? 'del '.Str::after($target, 'el ')
            : 'de '.$target;
        $description = match ($action) {
            'store', 'create' => "Creó {$directTarget}",
            'update', 'update_email' => "Actualizó {$directTarget}",
            'set_status' => "Cambió el estado {$ofTarget}",
            'deactivate' => "Desactivó {$directTarget}",
            'reactivate', 'restore' => "Activó o restauró {$directTarget}",
            'rehire' => "Recontrató {$directTarget}",
            'destroy', 'delete_document', 'remove_non_working_day' => "Eliminó {$directTarget}",
            'archive' => "Archivó {$directTarget}",
            'close', 'close_convocatoria', 'close_tracking' => "Cerró {$directTarget}",
            'decide', 'resolve_justification', 'resolve_leave', 'resolve_appeal' => "Resolvió {$directTarget}",
            default => "Ejecutó una operación sobre {$target}",
        };

        return "{$description} en el módulo ".Str::replace('_', ' ', $module).'.';
    }

    private function entityReference(?string $entityType, mixed $entityId, ?string $entityName): string
    {
        $label = match ($entityType) {
            'integrante' => 'el integrante',
            'area' => 'el área',
            'cargo' => 'el cargo',
            'rol' => 'el rol',
            'aplicacion' => 'la aplicación',
            'tarea' => 'la tarea',
            'reunion' => 'la reunión',
            'nota' => 'la nota',
            'equipo' => 'el equipo',
            'convocatoria' => 'la convocatoria',
            'solicitud' => 'la solicitud',
            null => 'un registro',
            default => 'el registro '.Str::replace('_', ' ', $entityType),
        };
        $identifier = $entityName ?: ($entityId !== null ? "#{$entityId}" : '');

        return trim("{$label} {$identifier}");
    }
}
