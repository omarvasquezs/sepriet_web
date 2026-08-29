<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComprobanteCounter extends Model
{
    public $timestamps = false;
    public $incrementing = false;
    protected $table = 'comprobante_counter';
    protected $primaryKey = 'tipo_comprobante';
    protected $keyType = 'string';

    protected $fillable = [
        'tipo_comprobante',
        'last_value',
    ];
}
