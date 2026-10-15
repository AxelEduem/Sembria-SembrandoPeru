<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tareas\AddTareaNoteRequest;
use App\Http\Requests\Tareas\CreateTareaRequest;
use App\Http\Requests\Tareas\UpdateTareaRequest;
use App\Http\Requests\Tareas\UpdateTareaStatusRequest;
use App\Http\Resources\TareaResource;
use App\Models\Tarea;
use App\Services\Tareas\TareaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TareaController extends Controller
{
    public function __construct(private readonly TareaService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return TareaResource::collection($this->service->list($request->user()));
    }

    public function people(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->directory($request->user())]);
    }

    public function store(CreateTareaRequest $request): JsonResponse
    {
        $task = $this->service->create($request->user(), $request->validated());

        return (new TareaResource($task))->response()->setStatusCode(201);
    }

    public function update(UpdateTareaRequest $request, Tarea $tarea): TareaResource
    {
        return new TareaResource($this->service->update($request->user(), $tarea, $request->validated()));
    }

    public function updateStatus(UpdateTareaStatusRequest $request, Tarea $tarea): TareaResource
    {
        return new TareaResource(
            $this->service->updateStatus($request->user(), $tarea, $request->validated('estado'))
        );
    }

    public function addNote(AddTareaNoteRequest $request, Tarea $tarea): TareaResource
    {
        return new TareaResource(
            $this->service->addNote($request->user(), $tarea, $request->validated('contenido'))
        );
    }
}
