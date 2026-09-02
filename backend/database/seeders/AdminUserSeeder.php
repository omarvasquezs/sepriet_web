<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::whereRaw('LOWER(username) = ?', ['admin'])->first();
        if (!$user) {
            $user = new User();
            $user->username = 'admin';
        }
        $user->password = Hash::make('admin123');
        $user->role_id = 1;
        $user->habilitado = true;
        $user->save();

        $this->command->info("Usuario Administrador configurado: admin / admin123 (Role ID: {$user->role_id})");
    }
}
