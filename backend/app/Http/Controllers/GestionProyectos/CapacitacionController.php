<?php

namespace App\Http\Controllers\GestionProyectos;

use App\Http\Controllers\Controller;
use App\Http\Requests\GestionProyectos\CompleteCapacitacionStageRequest;
use App\Http\Resources\GestionProyectos\CapacitacionResource;
use App\Models\Integrante;
use App\Services\GestionProyectos\CapacitacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CapacitacionController extends Controller
{
    public function __construct(private readonly CapacitacionService $service) {}

    public function index(Request $request): JsonResponse
    {
        $result = $this->service->list($request->user());

        return response()->json([
            'data' => CapacitacionResource::collection($result['items'])->resolve($request),
            'meta' => ['can_manage' => $result['can_manage']],
        ]);
    }

    public function completeStage(
        CompleteCapacitacionStageRequest $request,
        Integrante $integrante,
        int $etapa,
    ): CapacitacionResource {
        return new CapacitacionResource(
            $this->service->completeStage($request->user(), $integrante, $etapa)
        );
    }
}
