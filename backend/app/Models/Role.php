<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    public $timestamps = false;
    protected $fillable = ['role_name', 'habilitado'];

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
