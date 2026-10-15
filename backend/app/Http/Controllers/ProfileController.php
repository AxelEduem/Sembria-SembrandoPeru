<?php

namespace App\Http\Controllers;

use App\Http\Requests\Profile\DestroyAvatarRequest;
use App\Http\Requests\Profile\StoreAvatarRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\Profile\AvatarResource;
use App\Http\Resources\Profile\ProfileResource;
use App\Services\Profile\AvatarService;
use App\Services\Profile\ProfileService;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function __construct(
        private readonly AvatarService $avatarService,
        private readonly ProfileService $profileService,
    ) {}

    public function update(UpdateProfileRequest $request): ProfileResource
    {
        return ProfileResource::make(
            $this->profileService->update($request->user(), $request->validated())
        )->additional([
            'success' => true,
            'message' => 'Perfil actualizado correctamente.',
        ]);
    }

    public function storeAvatar(StoreAvatarRequest $request): AvatarResource
    {
        $avatar = $this->avatarService->replace(
            $request->user(),
            $request->file('avatar'),
        );

        return AvatarResource::make($avatar)->additional([
            'success' => true,
            'message' => 'Foto de perfil actualizada correctamente.',
        ]);
    }

    public function destroyAvatar(DestroyAvatarRequest $request): JsonResponse
    {
        $this->avatarService->delete($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Foto de perfil eliminada correctamente.',
            'data' => [
                'avatar_path' => null,
                'avatar_url' => null,
            ],
        ]);
    }
}
