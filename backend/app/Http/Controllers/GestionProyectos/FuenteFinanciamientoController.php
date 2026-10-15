<?php

namespace App\Http\Controllers\GestionProyectos;

use App\Http\Controllers\Controller;
use App\Http\Requests\GestionProyectos\SaveFuenteFinanciamientoRequest;
use App\Http\Resources\GestionProyectos\FuenteFinanciamientoResource;
use App\Services\GestionProyectos\ConvocatoriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FuenteFinanciamientoController extends Controller
{
    public function __construct(private readonly ConvocatoriaService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return FuenteFinanciamientoResource::collection(
            $this->service->listFuentes($request->user())
        );
    }

    public function store(SaveFuenteFinanciamientoRequest $request): JsonResponse
    {
        return (new FuenteFinanciamientoResource(
            $this->service->createFuente($request->user(), $request->validated())
        ))->response()->setStatusCode(201);
    }
}
