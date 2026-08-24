<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $fillable = [
        'nombres',
        'dni',
        'codigo_pais',
        'telefono',
        'email',
        'direccion',
    ];

    public function comprobantes()
    {
        return $this->hasMany(Comprobante::class, 'cliente_id');
    }
}
