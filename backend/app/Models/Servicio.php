<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Servicio extends Model
{
    protected $fillable = [
        'nom_servicio',
        'tipo_servicio',
        'precio_kilo',
        'precio_unidad',
        'habilitado',
    ];

    protected $casts = [
        'precio_kilo' => 'decimal:2',
        'precio_unidad' => 'decimal:2',
        'habilitado' => 'boolean',
    ];
}
