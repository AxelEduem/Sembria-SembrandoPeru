<?php

namespace App\Services\Usuarios;

use App\Mail\AccessCredentialsMail;
use App\Models\CuentaAcceso;
use App\Models\Integrante;
use App\Models\IntegranteHistorial;
use App\Models\Persona;
use App\Models\User;
use App\Services\Auth\InstitutionalAuthorizationService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class UsuarioService
{
    public function __construct(private readonly InstitutionalAuthorizationService $authorization) {}

    public function list(User $user): Collection
    {
        $scope = $this->authorization->scope($user, ['usuarios.ver']);

        $integrantes = Integrante::query()
            ->with([
                'persona.cuentaAcceso',
                'historiales.cargo.area',
            ])
            ->latest('created_at')
            ->latest('id')
            ->get();

        return $integrantes
            ->each(fn (Integrante $integrante) => $this->attachCurrentHistory($integrante))
            ->when(
                ! $scope->global,
                fn (Collection $rows) => $rows->filter(
                    fn (Integrante $integrante) => (int) $integrante->getRelation('usuarioHistory')?->cargo?->area_id
                        === $scope->areaId
                )->values(),
            );
    }

    /**
     * @return array{integrante: Integrante, email_sent: bool, email_warning: ?string}
     */
    public function configureAccess(User $actor, Integrante $integrante, array $data): array
    {
        $target = Integrante::query()
            ->with([
                'persona.cuentaAcceso',
                'historiales.cargo.area',
            ])
            ->findOrFail($integrante->id);
        $this->attachCurrentHistory($target);
        $history = $target->getRelation('usuarioHistory');

        if ($target->estado !== 'Activo') {
            throw ValidationException::withMessages([
                'integrante' => 'Solo puedes configurar accesos a integrantes activos.',
            ]);
        }

        if (! $history instanceof IntegranteHistorial || $history->estado !== 'Activo' || $history->cargo === null) {
            throw ValidationException::withMessages([
                'integrante' => 'El integrante no tiene un cargo activo válido.',
            ]);
        }

        $this->authorization->authorizeArea(
            $actor,
            ['usuarios.configurar_acceso'],
            (int) $history->cargo->area_id,
        );

        $email = $data['correo'];
        $password = $data['password'];
        $sendEmail = (bool) $data['enviar_correo'];

        $this->ensureEmailIsAvailable($email, (string) $target->persona_id);

        $configured = DB::transaction(function () use ($target, $email, $password): Integrante {
            $lockedTarget = Integrante::query()->lockForUpdate()->findOrFail($target->id);
            $person = Persona::query()->lockForUpdate()->findOrFail($lockedTarget->persona_id);

            if (CuentaAcceso::query()->where('persona_id', $person->id)->exists()) {
                throw ValidationException::withMessages([
                    'integrante' => 'Este integrante ya tiene un acceso configurado.',
                ]);
            }

            $this->ensureEmailIsAvailable($email, (string) $person->id);

            $laravelUser = User::query()->create([
                'name' => trim("{$person->nombres} {$person->apellidos}") ?: 'Usuario Sembria',
                'email' => $email,
                'password' => $password,
                'email_verified_at' => now(),
            ]);

            $person->update([
                'correo' => $email,
                'password_temporal_expira_en' => now()->addDay(),
            ]);

            CuentaAcceso::query()->create([
                'user_id' => $laravelUser->id,
                'persona_id' => $person->id,
                'activo' => true,
                'must_change_password' => true,
            ]);

            return $lockedTarget;
        });

        $emailSent = false;
        $emailWarning = null;

        if ($sendEmail) {
            try {
                Mail::to($email)->send(new AccessCredentialsMail(
                    trim("{$target->persona->nombres} {$target->persona->apellidos}"),
                    $email,
                    $password,
                    (string) config('app.frontend_url'),
                ));
                Persona::query()->whereKey($target->persona_id)->update([
                    'ultimo_envio_credenciales' => now(),
                ]);
                $emailSent = true;
            } catch (Throwable $exception) {
                report($exception);
                $emailWarning = 'La cuenta se creó, pero no se pudo enviar el correo con las credenciales.';
            }
        }

        $configured->load([
            'persona.cuentaAcceso',
            'historiales.cargo.area',
        ]);
        $this->attachCurrentHistory($configured);

        return [
            'integrante' => $configured,
            'email_sent' => $emailSent,
            'email_warning' => $emailWarning,
        ];
    }

    private function attachCurrentHistory(Integrante $integrante): void
    {
        $histories = $integrante->relationLoaded('historiales')
            ? $integrante->historiales
            : collect();
        $current = $histories->firstWhere('estado', 'Activo') ?? $histories->first();

        $integrante->setRelation('usuarioHistory', $current);
    }

    private function ensureEmailIsAvailable(string $email, string $personaId): void
    {
        $normalized = mb_strtolower($email, 'UTF-8');
        $usedByUser = User::query()
            ->whereRaw('LOWER(email) = ?', [$normalized])
            ->exists();
        $usedByPerson = Persona::query()
            ->where('id', '<>', $personaId)
            ->whereRaw('LOWER(correo) = ?', [$normalized])
            ->exists();

        if ($usedByUser || $usedByPerson) {
            throw ValidationException::withMessages([
                'correo' => 'Ese correo institucional ya está en uso.',
            ]);
        }
    }

    public function resendCredentials(User $actor, Integrante $integrante, bool $sendEmail): array
    {
        $target = Integrante::query()
            ->with([
                'persona.cuentaAcceso',
                'historiales.cargo.area',
            ])
            ->findOrFail($integrante->id);
        $this->attachCurrentHistory($target);
        $history = $target->getRelation('usuarioHistory');

        if ($target->estado !== 'Activo') {
            throw ValidationException::withMessages([
                'integrante' => 'Solo puedes reenviar credenciales a integrantes activos.',
            ]);
        }

        if (! $history instanceof IntegranteHistorial || $history->estado !== 'Activo' || $history->cargo === null) {
            throw ValidationException::withMessages([
                'integrante' => 'El integrante no tiene un cargo activo válido.',
            ]);
        }

        $this->authorization->authorizeArea(
            $actor,
            ['usuarios.restablecer_contrasena'],
            (int) $history->cargo->area_id,
        );

        $persona = $target->persona;
        $account = $persona?->cuentaAcceso;
        $laravelUser = $account ? User::query()->find($account->user_id) : null;

        if (! $laravelUser || ! $account->activo) {
            throw ValidationException::withMessages([
                'integrante' => 'El integrante no tiene un acceso configurado o está inactivo.',
            ]);
        }

        $email = $laravelUser->email;
        $password = $this->generateTemporaryPassword();

        DB::transaction(function () use ($laravelUser, $persona, $account, $password): void {
            $laravelUser->forceFill(['password' => $password])->save();

            $persona->update([
                'password_temporal_expira_en' => now()->addDay(),
            ]);

            $account->update(['must_change_password' => true]);

            DB::table('sessions')->where('user_id', $laravelUser->id)->delete();
        });

        $emailSent = false;
        $emailWarning = null;

        if ($sendEmail) {
            try {
                Mail::to($email)->send(new AccessCredentialsMail(
                    trim("{$persona->nombres} {$persona->apellidos}"),
                    $email,
                    $password,
                    (string) config('app.frontend_url'),
                ));

                $persona->update(['ultimo_envio_credenciales' => now()]);
                $emailSent = true;
            } catch (Throwable $exception) {
                report($exception);
                $emailWarning = 'La contraseña se actualizó, pero no se pudo enviar el correo.';
            }
        }

        return [
            'email_sent' => $emailSent,
            'email_warning' => $emailWarning,
            'password' => $password,
        ];
    }

    public function updateEmail(User $actor, Integrante $integrante, string $email): Integrante
    {
        $target = Integrante::query()
            ->with([
                'persona.cuentaAcceso',
                'historiales.cargo.area',
            ])
            ->findOrFail($integrante->id);
        $this->attachCurrentHistory($target);
        $history = $target->getRelation('usuarioHistory');

        if ($target->estado !== 'Activo') {
            throw ValidationException::withMessages([
                'integrante' => 'Solo puedes editar el correo de integrantes activos.',
            ]);
        }

        if (! $history instanceof IntegranteHistorial || $history->estado !== 'Activo' || $history->cargo === null) {
            throw ValidationException::withMessages([
                'integrante' => 'El integrante no tiene un cargo activo válido.',
            ]);
        }

        $this->authorization->authorizeArea(
            $actor,
            ['usuarios.editar_correo'],
            (int) $history->cargo->area_id,
        );

        $persona = $target->persona;
        $account = $persona?->cuentaAcceso;

        if (! $account) {
            throw ValidationException::withMessages([
                'integrante' => 'El integrante no tiene un acceso configurado.',
            ]);
        }

        $this->ensureEmailIsAvailable($email, (string) $target->persona_id);

        DB::transaction(function () use ($persona, $account, $email): void {
            $persona->update(['correo' => $email]);

            $laravelUser = User::query()->find($account->user_id);
            if ($laravelUser) {
                $laravelUser->update(['email' => $email]);
            }
        });

        $target->load(['persona.cuentaAcceso', 'historiales.cargo.area']);
        $this->attachCurrentHistory($target);

        return $target;
    }

    private function generateTemporaryPassword(int $length = 10): string
    {
        $lowercase = 'abcdefghijkmnopqrstuvwxyz';
        $uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $numbers = '23456789';
        $symbols = '!@#$%&*';

        $password = $uppercase[random_int(0, strlen($uppercase) - 1)]
            .$lowercase[random_int(0, strlen($lowercase) - 1)]
            .$numbers[random_int(0, strlen($numbers) - 1)]
            .$symbols[random_int(0, strlen($symbols) - 1)];

        $pool = $lowercase.$uppercase.$numbers.$symbols;

        for ($i = strlen($password); $i < $length; $i++) {
            $password .= $pool[random_int(0, strlen($pool) - 1)];
        }

        return str_shuffle($password);
    }
}
