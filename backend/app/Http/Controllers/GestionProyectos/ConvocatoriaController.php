<?php

namespace App\Http\Controllers\GestionProyectos;

use App\Http\Controllers\Controller;
use App\Http\Requests\GestionProyectos\SaveConvocatoriaRequest;
use App\Http\Requests\GestionProyectos\SavePrimerFiltroRequest;
use App\Http\Requests\GestionProyectos\SaveSegundoFiltroRequest;
use App\Http\Resources\GestionProyectos\ConvocatoriaResource;
use App\Models\GestionProyectos\Convocatoria;
use App\Services\GestionProyectos\ConvocatoriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ConvocatoriaController extends Controller
{
    public function __construct(private readonly ConvocatoriaService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return ConvocatoriaResource::collection($this->service->list($request->user()));
    }

    public function store(SaveConvocatoriaRequest $request): JsonResponse
    {
        return (new ConvocatoriaResource(
            $this->service->create($request->user(), $request->validated())
        ))->response()->setStatusCode(201);
    }

    public function show(Request $request, Convocatoria $convocatoria): ConvocatoriaResource
    {
        return new ConvocatoriaResource($this->service->find($request->user(), $convocatoria));
    }

    public function update(
        SaveConvocatoriaRequest $request,
        Convocatoria $convocatoria
    ): ConvocatoriaResource {
        return new ConvocatoriaResource(
            $this->service->update($request->user(), $convocatoria, $request->validated())
        );
    }

    public function primerFiltro(Request $request, Convocatoria $convocatoria): ConvocatoriaResource
    {
        return new ConvocatoriaResource($this->service->primerFiltro($request->user(), $convocatoria));
    }

    public function savePrimerFiltro(
        SavePrimerFiltroRequest $request,
        Convocatoria $convocatoria
    ): ConvocatoriaResource {
        return new ConvocatoriaResource($this->service->savePrimerFiltro(
            $request->user(),
            $convocatoria,
            $request->validated('evaluaciones')
        ));
    }

    public function segundoFiltro(Request $request, Convocatoria $convocatoria): ConvocatoriaResource
    {
        return new ConvocatoriaResource($this->service->segundoFiltro($request->user(), $convocatoria));
    }

    public function saveSegundoFiltro(
        SaveSegundoFiltroRequest $request,
        Convocatoria $convocatoria
    ): ConvocatoriaResource {
        return new ConvocatoriaResource($this->service->saveSegundoFiltro(
            $request->user(),
            $convocatoria,
            $request->validated('evaluaciones')
        ));
    }
}
