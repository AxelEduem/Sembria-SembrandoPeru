<?php

namespace App\Http\Controllers;

use App\Http\Requests\Agenda\CreateAgendaMeetingRequest;
use App\Http\Requests\Agenda\RespondAgendaInvitationRequest;
use App\Http\Resources\AgendaMeetingResource;
use App\Http\Resources\AgendaMetricsResource;
use App\Models\AgendaMeeting;
use App\Services\Agenda\AgendaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AgendaController extends Controller
{
    public function __construct(private readonly AgendaService $service) {}

    public function people(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->people($request->user())]);
    }

    public function currentPerson(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->currentPerson($request->user())]);
    }

    public function meetings(Request $request): AnonymousResourceCollection
    {
        return AgendaMeetingResource::collection($this->service->meetings($request->user()));
    }

    public function history(Request $request): AnonymousResourceCollection
    {
        return AgendaMeetingResource::collection($this->service->history($request->user()));
    }

    public function metrics(Request $request): AgendaMetricsResource
    {
        return new AgendaMetricsResource($this->service->metrics($request->user()));
    }

    public function store(CreateAgendaMeetingRequest $request): JsonResponse
    {
        $meeting = $this->service->create($request->user(), $request->validated());

        return (new AgendaMeetingResource($meeting))->response()->setStatusCode(201);
    }

    public function respond(
        RespondAgendaInvitationRequest $request,
        AgendaMeeting $meeting,
    ): AgendaMeetingResource {
        return new AgendaMeetingResource(
            $this->service->respond($request->user(), $meeting, $request->validated('respuesta'))
        );
    }

    public function cancel(Request $request, AgendaMeeting $meeting): AgendaMeetingResource
    {
        return new AgendaMeetingResource($this->service->cancel($request->user(), $meeting));
    }
}
