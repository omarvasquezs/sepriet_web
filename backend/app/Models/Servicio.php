<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Servicio extends Model
{
    public $timestamps = false;
    protected $table = 'servicios';

    protected $fillable = [
        'nom_servicio',
        'tipo_servicio',
        'habilitado',
        'precio_kilo',
        'activado',
    ];

    protected $casts = [
        'precio_kilo' => 'float',
        'habilitado' => 'boolean',
        'activado' => 'boolean',
    ];
}
