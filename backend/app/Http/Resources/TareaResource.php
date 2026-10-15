<?php

namespace App\Http\Resources;

use App\Services\Profile\AvatarService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TareaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $accountId = $request->user()?->cuentaAcceso?->id;
        $responsibles = $this->assignees
            ->sortBy(fn ($account) => trim(
                ($account->persona?->nombres ?? '').' '.($account->persona?->apellidos ?? '')
            ), SORT_NATURAL | SORT_FLAG_CASE)
            ->values();
        $primaryResponsible = $this->assignee ?? $responsibles->first();

        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'descripcion' => $this->descripcion,
            'prioridad' => $this->prioridad,
            'estado' => $this->estado,
            'fecha_limite' => $this->fecha_limite?->format('Y-m-d'),
            'completada_at' => $this->completada_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'soy_creador' => $this->asignada_por === $accountId,
            'soy_responsable' => $responsibles->contains('id', $accountId),
            'creador' => $this->person($this->creator),
            'responsable' => $this->person($primaryResponsible),
            'responsables' => $responsibles
                ->map(fn ($account) => $this->person($account))
                ->values(),
            'notas' => $this->notes->map(fn ($note) => [
                'id' => $note->id,
                'contenido' => $note->contenido,
                'created_at' => $note->created_at?->toISOString(),
                'autor' => $this->person($note->author),
                'es_mia' => $note->autor_id === $accountId,
            ])->values(),
        ];
    }

    private function person($account): ?array
    {
        if ($account === null) {
            return null;
        }

        $members = $account->persona?->integrantes;
        $member = $members?->where('estado', 'Activo')->sortByDesc('id')->first()
            ?? $members?->sortByDesc('id')->first();

        return [
            'id' => $account->id,
            'nombre' => trim(
                ($account->persona?->nombres ?? '').' '.($account->persona?->apellidos ?? '')
            ) ?: 'Sin nombre',
            'avatar_path' => $member?->avatar_path,
            'avatar_url' => app(AvatarService::class)->url($member?->avatar_path),
        ];
    }
}
