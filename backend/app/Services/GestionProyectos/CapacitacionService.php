<?php

namespace App\Services\GestionProyectos;

use App\Models\GestionProyectos\Capacitacion;
use App\Models\Integrante;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CapacitacionService
{
    private const AREA = 'GESTIÓN DE PROYECTOS';

    private const MEMBER_CARGO = 'MIEMBRO DE GESTIÓN DE PROYECTOS';

    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    /** @return array{items: Collection<int, Integrante>, can_manage: bool} */
    public function list(User $user): array
    {
        $scope = $this->authorization->scope($user, [
            'gp.capacitaciones.ver',
            'gp.capacitaciones.gestionar',
        ]);
        $canManage = $this->canManage($user);

        $items = $this->eligibleMembers()
            ->when(! $canManage, fn ($query) => $query->where('persona_id', $scope->personaId))
            ->orderBy(
                DB::table('personas')->select('nombres')->whereColumn('personas.id', 'integrantes.persona_id')
            )
            ->get();

        return ['items' => $items, 'can_manage' => $canManage];
    }

    public function completeStage(User $user, Integrante $integrante, int $stage): Integrante
    {
        $scope = $this->authorization->scope($user, ['gp.capacitaciones.gestionar']);

        if (! $this->eligibleMembers()->whereKey($integrante->id)->exists()) {
            throw ValidationException::withMessages([
                'integrante' => 'Solo se puede capacitar a miembros activos de Gestión de Proyectos.',
            ]);
        }

        DB::transaction(function () use ($integrante, $scope, $stage): void {
            $training = Capacitacion::query()->lockForUpdate()->firstOrCreate([
                'integrante_id' => $integrante->id,
            ]);

            for ($previous = 1; $previous < $stage; $previous++) {
                if ($training->{"fase_{$previous}_completada_at"} === null) {
                    throw ValidationException::withMessages([
                        'etapa' => 'Las etapas deben completarse en orden.',
                    ]);
                }
            }

            $field = "fase_{$stage}_completada_at";
            if ($training->{$field} === null) {
                $training->update([$field => now(), 'actualizado_por' => $scope->accountId]);
            }
        });

        return $integrante->refresh()->load($this->relations());
    }

    private function eligibleMembers()
    {
        return Integrante::query()
            ->where('estado', 'Activo')
            ->whereHas('historiales', fn ($query) => $query
                ->where('estado', 'Activo')
                ->whereHas('cargo', fn ($cargo) => $cargo
                    ->where('nombre', self::MEMBER_CARGO)
                    ->whereHas('area', fn ($area) => $area->where('nombre', self::AREA))))
            ->with($this->relations());
    }

    /** @return list<string> */
    private function relations(): array
    {
        return [
            'persona:id,nombres,apellidos,correo',
            'historiales' => fn ($query) => $query->where('estado', 'Activo')->latest('fecha_inicio')->latest('id'),
            'historiales.cargo:id,nombre,area_id',
            'capacitacionGestionProyectos',
        ];
    }

    private function canManage(User $user): bool
    {
        try {
            $this->authorization->scope($user, ['gp.capacitaciones.gestionar']);

            return true;
        } catch (AuthorizationException) {
            return false;
        }
    }
}
