<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CajaAperturaCierre extends Model
{
    protected $table = 'caja_apertura_cierre';

    protected $fillable = [
        'datetime_apertura',
        'datetime_cierre',
        'monto_apertura',
        'monto_cierre',
        'id_usuario_apertura',
        'id_usuario_cierre',
        'total_ventas',
        'total_egresos',
        'saldo_final',
        'estado',
    ];

    protected $casts = [
        'datetime_apertura' => 'datetime',
        'datetime_cierre' => 'datetime',
        'monto_apertura' => 'decimal:2',
        'monto_cierre' => 'decimal:2',
        'total_ventas' => 'decimal:2',
        'total_egresos' => 'decimal:2',
        'saldo_final' => 'decimal:2',
    ];

    public function usuarioApertura()
    {
        return $this->belongsTo(User::class, 'id_usuario_apertura');
    }

    public function usuarioCierre()
    {
        return $this->belongsTo(User::class, 'id_usuario_cierre');
    }

    public function egresos()
    {
        return $this->hasMany(CajaEgreso::class, 'id_caja');
    }
}
