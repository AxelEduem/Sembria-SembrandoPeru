<?php

namespace App\Http\Controllers\Integrantes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Integrantes\AssignApplicationRequest;
use App\Http\Requests\Integrantes\IndexAccessAssignmentRequest;
use App\Http\Resources\Integrantes\AccessAssignmentResource;
use App\Models\Integrante;
use App\Models\IntegranteAplicacion;
use App\Models\IntegranteHistorial;
use App\Services\Integrantes\IntegranteAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class IntegranteAccessController extends Controller
{
    public function __construct(private readonly IntegranteAccessService $service) {}

    public function index(IndexAccessAssignmentRequest $request): AnonymousResourceCollection
    {
        return AccessAssignmentResource::collection($this->service->assignments(
            $request->user(),
            $request->boolean('inactive'),
            $request->safe()->except('inactive'),
        ));
    }

    public function forIntegrante(Request $request, Integrante $integrante): AnonymousResourceCollection
    {
        return AccessAssignmentResource::collection($this->service->forIntegrante($request->user(), $integrante));
    }

    public function count(Request $request, IntegranteHistorial $historial): JsonResponse
    {
        return response()->json([
            'count' => $this->service->countForHistory($request->user(), $historial),
        ]);
    }

    public function store(AssignApplicationRequest $request): AccessAssignmentResource
    {
        return new AccessAssignmentResource($this->service->assign(
            $request->user(), (int) $request->validated('aplicacion_id'), (int) $request->validated('historial_id'),
        ));
    }

    public function destroy(Request $request, IntegranteAplicacion $assignment): JsonResponse
    {
        $this->service->revoke($request->user(), $assignment);

        return response()->json(['success' => true]);
    }
}
