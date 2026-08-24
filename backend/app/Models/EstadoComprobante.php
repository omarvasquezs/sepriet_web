<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoComprobante extends Model
{
    protected $table = 'estado_comprobantes';
    protected $fillable = ['nombre'];
}
