<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetodoPago extends Model
{
    public $timestamps = false;
    protected $table = 'metodo_pago';
    protected $fillable = ['nom_metodo_pago', 'habilitado'];
}
