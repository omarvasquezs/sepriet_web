<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Local extends Model
{
    public $timestamps = false;
    protected $table = 'locales';
    protected $fillable = ['nombre', 'direccion', 'telefono', 'observaciones', 'habilitado'];
}
