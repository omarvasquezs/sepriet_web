<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CajaAperturaCierre extends Model
{
    public $timestamps = false;
    protected $table = 'caja_apertura_cierre';

    protected $fillable = [
        'datetime_apertura',
        'monto_apertura',
        'id_usuario_apertura',
        'datetime_cierre',
        'monto_cierre',
        'id_usuario_cierre',
    ];

    protected $casts = [
        'datetime_apertura' => 'datetime',
        'datetime_cierre' => 'datetime',
        'monto_apertura' => 'float',
        'monto_cierre' => 'float',
    ];

    protected $appends = ['estado'];

    public function getEstadoAttribute()
    {
        return $this->datetime_cierre ? 'Cerrada' : 'Abierta';
    }

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
