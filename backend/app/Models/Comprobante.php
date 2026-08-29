<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comprobante extends Model
{
    public $timestamps = false;
    protected $table = 'comprobantes';

    protected $fillable = [
        'tipo_comprobante',
        'cliente_id',
        'user_id',
        'fecha',
        'fecha_actualizacion',
        'metodo_pago_id',
        'num_ruc',
        'razon_social',
        'estado_comprobante_id',
        'estado_ropa_id',
        'local_id',
        'observaciones',
        'monto_abonado',
        'last_updated_by',
        'cod_comprobante',
        'descuento',
        'costo_total',
        'activado',
        'fecha_actualizacion_estado_comprobante',
        'fecha_actualizacion_estado_ropa',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'fecha_actualizacion' => 'datetime',
        'fecha_actualizacion_estado_comprobante' => 'datetime',
        'fecha_actualizacion_estado_ropa' => 'datetime',
        'costo_total' => 'float',
        'monto_abonado' => 'float',
        'descuento' => 'float',
        'activado' => 'boolean',
    ];

    protected $appends = ['monto_restante'];

    public function getMontoRestanteAttribute()
    {
        $total = (float)($this->costo_total ?? 0);
        $abonado = (float)($this->monto_abonado ?? 0);
        return max(0, round($total - $abonado, 2));
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function estadoComprobante()
    {
        return $this->belongsTo(EstadoComprobante::class, 'estado_comprobante_id');
    }

    public function estadoRopa()
    {
        return $this->belongsTo(EstadoRopa::class, 'estado_ropa_id');
    }

    public function metodoPago()
    {
        return $this->belongsTo(MetodoPago::class, 'metodo_pago_id');
    }

    public function local()
    {
        return $this->belongsTo(Local::class, 'local_id');
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
