<?php

namespace App\Http\Resources;

use App\Services\Profile\AvatarService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgendaMeetingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $accountId = $request->user()?->cuentaAcceso?->id;
        $ownParticipant = $this->participants->firstWhere('cuenta_id', $accountId);
        $avatarService = app(AvatarService::class);

        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'descripcion' => $this->descripcion,
            'fecha' => $this->fecha?->format('Y-m-d'),
            'hora_inicio' => substr((string) $this->hora_inicio, 0, 8),
            'hora_fin' => substr((string) $this->hora_fin, 0, 8),
            'modalidad' => $this->modalidad,
            'ubicacion' => $this->ubicacion,
            'enlace' => $this->enlace,
            'estado' => $this->estado,
            'creada_por' => $this->creada_por,
            'created_at' => $this->created_at?->toISOString(),
            'mi_estado' => $ownParticipant?->estado,
            'soy_organizador' => (bool) ($ownParticipant?->es_organizador ?? false),
            'participantes' => $this->participants
                ->sortBy([
                    ['es_organizador', 'desc'],
                    [fn ($participant) => $participant->account?->persona?->nombres ?? '', 'asc'],
                ])
                ->values()
                ->map(function ($participant) use ($avatarService): array {
                    $members = $participant->account?->persona?->integrantes;
                    $member = $members?->where('estado', 'Activo')->sortByDesc('id')->first()
                        ?? $members?->sortByDesc('id')->first();

                    return [
                        'cuenta_id' => $participant->cuenta_id,
                        'nombre' => trim(
                            ($participant->account?->persona?->nombres ?? '').' '.
                            ($participant->account?->persona?->apellidos ?? '')
                        ),
                        'avatar_path' => $member?->avatar_path,
                        'avatar_url' => $avatarService->url($member?->avatar_path),
                        'estado' => $participant->estado,
                        'es_organizador' => (bool) $participant->es_organizador,
                    ];
                }),
        ];
    }
}
