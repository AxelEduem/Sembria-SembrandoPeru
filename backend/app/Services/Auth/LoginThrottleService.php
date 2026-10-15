<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

class LoginThrottleService
{
    private const EMAIL_FAILURES_PER_STAGE = 5;

    private const IP_FAILURES_PER_STAGE = 20;

    private const FAILURE_MEMORY_SECONDS = 86400;

    /** @var list<int> */
    private const BLOCK_DURATIONS = [60, 300, 900, 3600];

    public function retryAfter(string $email, string $ip): int
    {
        return max(
            $this->availableIn($this->emailBlockKey($email)),
            $this->availableIn($this->ipBlockKey($ip)),
        );
    }

    public function registerFailure(string $email, string $ip): void
    {
        $emailAttempts = $this->hitCounter($this->emailAttemptsKey($email));
        $ipAttempts = $this->hitCounter($this->ipAttemptsKey($ip));

        $this->applyProgressiveBlock(
            $this->emailBlockKey($email),
            $emailAttempts,
            self::EMAIL_FAILURES_PER_STAGE,
        );
        $this->applyProgressiveBlock(
            $this->ipBlockKey($ip),
            $ipAttempts,
            self::IP_FAILURES_PER_STAGE,
        );

        Log::warning('Intento de inicio de sesión fallido.', [
            'event' => 'login_failed',
            'email_hash' => hash('sha256', $this->normalizeEmail($email)),
            'ip' => $ip,
            'email_attempts' => $emailAttempts,
            'ip_attempts' => $ipAttempts,
        ]);
    }

    public function logBlockedAttempt(string $email, string $ip, int $retryAfter): void
    {
        Log::warning('Intento de inicio de sesión bloqueado temporalmente.', [
            'event' => 'login_rate_limited',
            'email_hash' => hash('sha256', $this->normalizeEmail($email)),
            'ip' => $ip,
            'retry_after' => $retryAfter,
        ]);
    }

    public function clearEmailFailures(string $email): void
    {
        RateLimiter::clear($this->emailAttemptsKey($email));
        RateLimiter::clear($this->emailBlockKey($email));
    }

    private function hitCounter(string $key): int
    {
        RateLimiter::hit($key, self::FAILURE_MEMORY_SECONDS);

        return RateLimiter::attempts($key);
    }

    private function applyProgressiveBlock(string $key, int $attempts, int $failuresPerStage): void
    {
        if ($attempts === 0 || $attempts % $failuresPerStage !== 0) {
            return;
        }

        $stage = intdiv($attempts, $failuresPerStage) - 1;
        $duration = self::BLOCK_DURATIONS[min($stage, count(self::BLOCK_DURATIONS) - 1)];

        RateLimiter::clear($key);
        RateLimiter::hit($key, $duration);
    }

    private function availableIn(string $key): int
    {
        if (! RateLimiter::tooManyAttempts($key, 1)) {
            return 0;
        }

        return max(1, RateLimiter::availableIn($key));
    }

    private function emailAttemptsKey(string $email): string
    {
        return 'login:failures:email:'.hash('sha256', $this->normalizeEmail($email));
    }

    private function ipAttemptsKey(string $ip): string
    {
        return 'login:failures:ip:'.hash('sha256', $ip);
    }

    private function emailBlockKey(string $email): string
    {
        return 'login:block:email:'.hash('sha256', $this->normalizeEmail($email));
    }

    private function ipBlockKey(string $ip): string
    {
        return 'login:block:ip:'.hash('sha256', $ip);
    }

    private function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }
}
