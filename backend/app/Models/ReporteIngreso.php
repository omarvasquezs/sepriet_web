<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReporteIngreso extends Model
{
    protected $table = 'reporte_ingresos';

    protected $fillable = [
        'cod_comprobante',
        'cliente_id',
        'metodo_pago_id',
        'fecha',
        'monto_abonado',
        'costo_total',
        'descuento',
        'user_id',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'monto_abonado' => 'decimal:2',
        'costo_total' => 'decimal:2',
        'descuento' => 'decimal:2',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function metodoPago()
    {
        return $this->belongsTo(MetodoPago::class, 'metodo_pago_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
