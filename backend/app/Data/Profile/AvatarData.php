<?php

namespace App\Data\Profile;

final readonly class AvatarData
{
    public function __construct(
        public ?string $path,
        public ?string $url,
    ) {}
}
