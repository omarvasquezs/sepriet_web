<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoRopa extends Model
{
    public $timestamps = false;
    protected $table = 'estado_ropa';
    protected $fillable = ['nom_estado_ropa'];
}
