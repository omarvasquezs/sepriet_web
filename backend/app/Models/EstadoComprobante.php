<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoComprobante extends Model
{
    public $timestamps = false;
    protected $table = 'estado_comprobantes';
    protected $fillable = ['nom_estado', 'habilitado'];
}
