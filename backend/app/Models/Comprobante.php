<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comprobante extends Model
{
    protected $fillable = [
        'cod_comprobante',
        'cliente_id',
        'fecha',
        'fecha_entrega',
        'costo_total',
        'monto_abonado',
        'monto_restante',
        'descuento',
        'estado_id',
        'observaciones',
        'user_id',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'fecha_entrega' => 'datetime',
        'costo_total' => 'decimal:2',
        'monto_abonado' => 'decimal:2',
        'monto_restante' => 'decimal:2',
        'descuento' => 'decimal:2',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function estado()
    {
        return $this->belongsTo(EstadoComprobante::class, 'estado_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function detalles()
    {
        return $this->hasMany(ComprobanteDetalle::class, 'comprobante_id');
    }

    public function ingresos()
    {
        return $this->hasMany(ReporteIngreso::class, 'cod_comprobante', 'cod_comprobante');
    }
}
