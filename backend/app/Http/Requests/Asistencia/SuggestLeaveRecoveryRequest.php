<?php

namespace App\Http\Requests\Asistencia;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class SuggestLeaveRecoveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $today = CarbonImmutable::now('America/Lima')->toDateString();

        return [
            'fechas' => ['required', 'array', 'min:1', 'max:60'],
            'fechas.*' => ['required', 'date_format:Y-m-d', "after_or_equal:{$today}", 'distinct'],
            'dias' => ['required', 'integer', 'between:1,30'],
        ];
    }
}
