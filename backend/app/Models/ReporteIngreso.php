<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReporteIngreso extends Model
{
    public $timestamps = false;
    protected $table = 'reporte_ingresos';

    protected $fillable = [
        'cod_comprobante',
        'cliente_id',
        'metodo_pago_id',
        'fecha',
        'monto_abonado',
        'descuento',
        'costo_total',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'monto_abonado' => 'float',
        'descuento' => 'float',
        'costo_total' => 'float',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function metodoPago()
    {
        return $this->belongsTo(MetodoPago::class, 'metodo_pago_id');
    }
}
