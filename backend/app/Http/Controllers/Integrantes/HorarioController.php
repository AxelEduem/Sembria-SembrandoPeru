<?php

namespace App\Http\Controllers\Integrantes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Integrantes\IndexMiHorarioHistoryRequest;
use App\Http\Requests\Integrantes\SaveHorarioBlockRequest;
use App\Http\Requests\Integrantes\SaveHorarioRequest;
use App\Http\Resources\Integrantes\HorarioResource;
use App\Http\Resources\Integrantes\IntegranteHistorialResource;
use App\Models\IntegranteHistorial;
use App\Models\IntegranteHorario;
use App\Services\Integrantes\HorarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HorarioController extends Controller
{
    public function __construct(private readonly HorarioService $service) {}

    public function index(Request $request, IntegranteHistorial $historial): AnonymousResourceCollection
    {
        return HorarioResource::collection($this->service->list($request->user(), $historial));
    }

    public function mineHistory(IndexMiHorarioHistoryRequest $request): AnonymousResourceCollection
    {
        return IntegranteHistorialResource::collection(
            $this->service->mineHistory($request->user(), $request->validated())
        );
    }

    public function replace(SaveHorarioRequest $request, IntegranteHistorial $historial): AnonymousResourceCollection
    {
        return HorarioResource::collection($this->service->replace($request->user(), $historial, $request->validated('blocks')));
    }

    public function store(SaveHorarioBlockRequest $request): HorarioResource
    {
        $history = IntegranteHistorial::query()->findOrFail($request->integer('historial_id'));

        return new HorarioResource($this->service->create($request->user(), $history, $request->validated()));
    }

    public function update(SaveHorarioBlockRequest $request, IntegranteHorario $horario): HorarioResource
    {
        return new HorarioResource($this->service->update($request->user(), $horario, $request->validated()));
    }

    public function destroyAll(Request $request, IntegranteHistorial $historial): JsonResponse
    {
        $this->service->deleteAll($request->user(), $historial);

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, IntegranteHorario $horario): JsonResponse
    {
        $this->service->delete($request->user(), $horario);

        return response()->json(['success' => true]);
    }
}
