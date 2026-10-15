<?php

namespace Tests\Feature\Auth;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class LoginRateLimitTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function test_login_is_temporarily_blocked_after_five_failed_attempts(): void
    {
        $credentials = [
            'email' => 'victima@example.com',
            'password' => 'password-incorrecto',
        ];

        foreach (range(1, 5) as $_attempt) {
            $this->postJson('/api/login', $credentials)->assertUnauthorized();
        }

        $this->postJson('/api/login', $credentials)
            ->assertTooManyRequests()
            ->assertHeader('Retry-After')
            ->assertJsonPath('code', 'LOGIN_RATE_LIMITED')
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['retry_after']);
    }

    public function test_repeated_failure_groups_increase_the_block_duration(): void
    {
        $credentials = [
            'email' => 'progresivo@example.com',
            'password' => 'password-incorrecto',
        ];

        foreach (range(1, 5) as $_attempt) {
            $this->postJson('/api/login', $credentials)->assertUnauthorized();
        }

        $firstBlock = $this->postJson('/api/login', $credentials)
            ->assertTooManyRequests()
            ->json('retry_after');

        $this->travel(61)->seconds();

        foreach (range(6, 10) as $_attempt) {
            $this->postJson('/api/login', $credentials)->assertUnauthorized();
        }

        $secondBlock = $this->postJson('/api/login', $credentials)
            ->assertTooManyRequests()
            ->json('retry_after');

        $this->assertGreaterThan($firstBlock, $secondBlock);
        $this->assertGreaterThanOrEqual(299, $secondBlock);
    }

    public function test_failed_attempts_from_the_same_ip_are_limited_across_emails(): void
    {
        foreach (range(1, 20) as $attempt) {
            $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
                ->postJson('/api/login', [
                    'email' => "persona{$attempt}@example.com",
                    'password' => 'password-incorrecto',
                ])
                ->assertUnauthorized();
        }

        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
            ->postJson('/api/login', [
                'email' => 'otra-persona@example.com',
                'password' => 'password-incorrecto',
            ])
            ->assertTooManyRequests()
            ->assertJsonPath('code', 'LOGIN_RATE_LIMITED');
    }

    public function test_route_throttle_also_limits_invalid_login_payload_bursts(): void
    {
        foreach (range(1, 10) as $_attempt) {
            $this->postJson('/api/login', [
                'email' => 'rafaga@example.com',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/login', [
            'email' => 'rafaga@example.com',
        ])
            ->assertTooManyRequests()
            ->assertJsonPath('code', 'LOGIN_RATE_LIMITED')
            ->assertJsonStructure(['retry_after']);
    }

    public function test_failed_login_is_logged_without_password_or_plain_email(): void
    {
        Log::spy();
        $email = 'auditoria@example.com';
        $password = 'secreto-no-registrar';

        $this->postJson('/api/login', [
            'email' => $email,
            'password' => $password,
        ])->assertUnauthorized();

        Log::shouldHaveReceived('warning')
            ->once()
            ->withArgs(function (string $message, array $context) use ($email, $password): bool {
                $serialized = json_encode($context, JSON_THROW_ON_ERROR);

                return $context['event'] === 'login_failed'
                    && isset($context['email_hash'], $context['ip'])
                    && ! str_contains($serialized, $email)
                    && ! str_contains($serialized, $password)
                    && ! array_key_exists('password', $context)
                    && str_contains($message, 'inicio de sesión fallido');
            });
    }
}
