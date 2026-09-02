<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    public $timestamps = false;
    protected $fillable = ['nom_rol', 'role_name', 'habilitado'];

    protected $appends = ['nombre'];

    public function getNombreAttribute()
    {
        return $this->nom_rol ?? $this->role_name ?? 'Rol';
    }

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
