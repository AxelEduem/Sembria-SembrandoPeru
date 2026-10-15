<?php

namespace App\Data\Auth;

final readonly class AuthorizationScope
{
    public function __construct(
        public bool $global,
        public ?int $areaId,
        public string $accountId,
        public string $personaId,
        public bool $accessTotal = false,
    ) {}
}
