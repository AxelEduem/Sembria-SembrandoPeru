<?php

namespace App\Http\Controllers;

use App\Http\Requests\Roles\ReplaceRoleCargosRequest;
use App\Http\Requests\Roles\ReplaceRolePermissionsRequest;
use App\Http\Requests\Roles\SaveRoleRequest;
use App\Http\Requests\Roles\SetRoleStatusRequest;
use App\Http\Resources\CargoResource;
use App\Http\Resources\Roles\PermissionResource;
use App\Http\Resources\Roles\RolePermissionResource;
use App\Http\Resources\Roles\RoleResource;
use App\Models\Role;
use App\Services\Roles\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RoleController extends Controller
{
    public function __construct(private readonly RoleService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return RoleResource::collection($this->service->list($request->user()));
    }

    public function permissionCatalog(Request $request): AnonymousResourceCollection
    {
        return PermissionResource::collection($this->service->permissionCatalog($request->user()));
    }

    public function store(SaveRoleRequest $request): JsonResponse
    {
        return (new RoleResource(
            $this->service->create($request->user(), $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function show(Request $request, Role $role): RoleResource
    {
        return new RoleResource($this->service->find($request->user(), $role));
    }

    public function update(SaveRoleRequest $request, Role $role): RoleResource
    {
        return new RoleResource(
            $this->service->update($request->user(), $role, $request->validated())
        );
    }

    public function setStatus(SetRoleStatusRequest $request, Role $role): RoleResource
    {
        return new RoleResource(
            $this->service->setActive($request->user(), $role, $request->boolean('activo'))
        );
    }

    public function permissions(Request $request, Role $role): AnonymousResourceCollection
    {
        return RolePermissionResource::collection(
            $this->service->permissions($request->user(), $role)
        );
    }

    public function cargos(Request $request, Role $role): AnonymousResourceCollection
    {
        return CargoResource::collection(
            $this->service->cargos($request->user(), $role)
        );
    }

    public function replaceCargos(
        ReplaceRoleCargosRequest $request,
        Role $role,
    ): AnonymousResourceCollection {
        return CargoResource::collection(
            $this->service->replaceCargos(
                $request->user(),
                $role,
                $request->validated('cargo_ids'),
            )
        );
    }

    public function replacePermissions(
        ReplaceRolePermissionsRequest $request,
        Role $role,
    ): AnonymousResourceCollection {
        $data = $request->validated();

        return RolePermissionResource::collection(
            $this->service->replacePermissions(
                $request->user(),
                $role,
                $data['permisos'],
                $data['acceso_total'] ?? null,
            )
        );
    }
}
