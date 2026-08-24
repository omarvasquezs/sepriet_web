<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComprobanteDetalle extends Model
{
    protected $table = 'comprobantes_detalles';

    protected $fillable = [
        'comprobante_id',
        'servicio_id',
        'peso_kg',
        'costo_kilo',
        'cantidad',
        'precio_unitario',
        'subtotal',
        'estado_ropa_id',
        'observaciones',
    ];

    protected $casts = [
        'peso_kg' => 'decimal:2',
        'costo_kilo' => 'decimal:2',
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function estadoRopa()
    {
        return $this->belongsTo(EstadoRopa::class, 'estado_ropa_id');
    }
}
