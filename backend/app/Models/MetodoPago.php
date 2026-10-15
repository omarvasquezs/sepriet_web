<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetodoPago extends Model
{
    public $timestamps = false;
    protected $table = 'metodo_pago';
    protected $fillable = ['nom_metodo_pago', 'habilitado'];

    public function getNomMetodoPagoAttribute($value)
    {
        return mb_strtoupper((string)$value, 'UTF-8');
    }

    public function setNomMetodoPagoAttribute($value)
    {
        $this->attributes['nom_metodo_pago'] = mb_strtoupper((string)$value, 'UTF-8');
    }
}
