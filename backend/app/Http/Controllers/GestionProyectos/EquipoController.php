<?php

namespace App\Http\Controllers\GestionProyectos;

use App\Http\Controllers\Controller;
use App\Http\Requests\GestionProyectos\SaveEquipoRequest;
use App\Http\Resources\GestionProyectos\EquipoIntegranteHistorialResource;
use App\Http\Resources\GestionProyectos\EquipoResource;
use App\Models\GestionProyectos\Equipo;
use App\Services\GestionProyectos\EquipoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EquipoController extends Controller
{
    public function __construct(private readonly EquipoService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return EquipoResource::collection($this->service->list($request->user()));
    }

    public function candidates(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->candidates($request->user())]);
    }

    public function context(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->context($request->user())]);
    }

    public function metrics(Request $request): JsonResponse
    {
        $data = $this->service->metrics($request->user());

        return response()->json(['data' => [
            'equipos' => EquipoResource::collection($data['equipos'])->resolve($request),
            'convocatorias' => $data['convocatorias'],
        ]]);
    }

    public function store(SaveEquipoRequest $request): JsonResponse
    {
        return (new EquipoResource($this->service->create($request->user(), $request->validated())))
            ->response()->setStatusCode(201);
    }

    public function update(SaveEquipoRequest $request, Equipo $equipo): EquipoResource
    {
        return new EquipoResource($this->service->update($request->user(), $equipo, $request->validated()));
    }

    public function history(Request $request, Equipo $equipo): AnonymousResourceCollection
    {
        return EquipoIntegranteHistorialResource::collection($this->service->history($request->user(), $equipo));
    }

    public function deactivate(Request $request, Equipo $equipo): EquipoResource
    {
        return new EquipoResource($this->service->setActive($request->user(), $equipo, false));
    }

    public function reactivate(Request $request, Equipo $equipo): EquipoResource
    {
        return new EquipoResource($this->service->setActive($request->user(), $equipo, true));
    }
}
