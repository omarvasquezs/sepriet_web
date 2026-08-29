<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComprobanteDetalle extends Model
{
    public $timestamps = false;
    protected $table = 'comprobantes_detalles';

    protected $fillable = [
        'comprobante_id',
        'servicio_id',
        'peso_kg',
        'costo_kilo',
    ];

    protected $casts = [
        'peso_kg' => 'float',
        'costo_kilo' => 'float',
    ];

    protected $appends = ['subtotal'];

    public function getSubtotalAttribute()
    {
        return round((float)($this->peso_kg ?? 0) * (float)($this->costo_kilo ?? 0), 2);
    }

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }
}
