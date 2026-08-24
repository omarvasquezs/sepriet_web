<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CajaEgreso extends Model
{
    protected $table = 'caja_egresos';

    protected $fillable = [
        'id_caja',
        'fecha',
        'descripcion',
        'monto',
        'id_metodo_pago',
        'id_usuario',
        'imagen_path',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'monto' => 'decimal:2',
    ];

    public function caja()
    {
        return $this->belongsTo(CajaAperturaCierre::class, 'id_caja');
    }

    public function metodoPago()
    {
        return $this->belongsTo(MetodoPago::class, 'id_metodo_pago');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }
}
