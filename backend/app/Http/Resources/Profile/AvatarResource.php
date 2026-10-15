<?php

namespace App\Http\Resources\Profile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvatarResource extends JsonResource
{
    /** @return array<string, string|null> */
    public function toArray(Request $request): array
    {
        return [
            'avatar_path' => $this->resource->path,
            'avatar_url' => $this->resource->url,
        ];
    }
}
