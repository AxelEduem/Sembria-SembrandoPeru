<?php

namespace App\Http\Controllers\Integrantes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Integrantes\DeactivateIntegranteRequest;
use App\Http\Requests\Integrantes\SaveIntegranteRequest;
use App\Http\Resources\Integrantes\IntegranteResource;
use App\Models\Integrante;
use App\Services\Integrantes\IntegranteService;
use Illuminate\Http\Request;

class IntegranteLifecycleController extends Controller
{
    public function __construct(private readonly IntegranteService $service) {}

    public function deactivate(DeactivateIntegranteRequest $request, Integrante $integrante): IntegranteResource
    {
        return new IntegranteResource($this->service->deactivate($request->user(), $integrante, $request->validated('motivo')));
    }

    public function restore(Request $request, Integrante $integrante): IntegranteResource
    {
        return new IntegranteResource($this->service->restore($request->user(), $integrante));
    }

    public function rehire(SaveIntegranteRequest $request, Integrante $integrante): IntegranteResource
    {
        return new IntegranteResource($this->service->rehire($request->user(), $integrante, $request->validated()));
    }

    public function confirmAccessRemoval(Request $request, Integrante $integrante): IntegranteResource
    {
        return new IntegranteResource($this->service->confirmAccessRemoval($request->user(), $integrante));
    }
}
