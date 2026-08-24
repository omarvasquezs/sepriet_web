<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['nom_rol'];

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
