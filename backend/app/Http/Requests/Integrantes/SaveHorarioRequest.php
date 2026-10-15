<?php

namespace App\Http\Requests\Integrantes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveHorarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'blocks' => ['present', 'array'],
            'blocks.*.dia_semana' => ['required', 'integer', 'between:1,6'],
            'blocks.*.hora_inicio' => ['required', 'date_format:H:i'],
            'blocks.*.hora_fin' => ['required', 'date_format:H:i', 'after:blocks.*.hora_inicio'],
            'require_minimum_hours' => ['sometimes', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $byDay = [];
            $total = 0;
            foreach ($this->input('blocks', []) as $index => $block) {
                $start = $this->minutes($block['hora_inicio'] ?? '');
                $end = $this->minutes($block['hora_fin'] ?? '');
                if ($start === null || $end === null) {
                    continue;
                }
                if ($start < 480 || $end > 1080) {
                    $validator->errors()->add("blocks.$index", 'El horario debe estar entre 08:00 y 18:00.');
                }
                if ($end - $start < 120) {
                    $validator->errors()->add("blocks.$index", 'Cada bloque debe durar al menos 2 horas.');
                }
                $total += max(0, $end - $start);
                $byDay[(int) ($block['dia_semana'] ?? 0)][] = [$start, $end, $index];
            }
            foreach ($byDay as $blocks) {
                usort($blocks, fn ($a, $b) => $a[0] <=> $b[0]);
                for ($i = 1; $i < count($blocks); $i++) {
                    if ($blocks[$i][0] < $blocks[$i - 1][1]) {
                        $validator->errors()->add("blocks.{$blocks[$i][2]}", 'Los bloques del mismo día no pueden superponerse.');
                    }
                }
            }
            if ($this->boolean('require_minimum_hours', true) && $total < 600) {
                $validator->errors()->add('blocks', 'El horario debe tener al menos 10 horas semanales.');
            }
        }];
    }

    private function minutes(string $time): ?int
    {
        if (! preg_match('/^(\d{2}):(\d{2})$/', $time, $matches)) {
            return null;
        }

        return ((int) $matches[1]) * 60 + (int) $matches[2];
    }
}
