<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ensure 'habilitado' column exists on 'roles' table
        if (!Schema::hasColumn('roles', 'habilitado')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->boolean('habilitado')->default(true);
            });
        }

        // 2. Ensure 'permisos' column exists on 'roles' table
        if (!Schema::hasColumn('roles', 'permisos')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->text('permisos')->nullable();
            });
        }

        $allPermisos = [
            'dashboard',
            'comprobantes_crear',
            'comprobantes_consultar',
            'comprobantes_abono',
            'comprobantes_anular',
            'clientes',
            'servicios',
            'caja_apertura',
            'caja_cierre',
            'caja_egresos',
            'caja_historial',
            'reportes',
            'sistemas'
        ];

        $supervisorPermisos = [
            'dashboard',
            'comprobantes_crear',
            'comprobantes_consultar',
            'comprobantes_abono',
            'comprobantes_anular',
            'clientes',
            'servicios',
            'caja_apertura',
            'caja_cierre',
            'caja_egresos',
            'caja_historial',
            'reportes'
        ];

        $atencionPermisos = [
            'dashboard',
            'comprobantes_crear',
            'comprobantes_consultar',
            'comprobantes_abono',
            'clientes',
            'caja_apertura',
            'caja_egresos'
        ];

        $colName = Schema::hasColumn('roles', 'role_name') ? 'role_name' : 'nom_rol';

        // 3. Configure ADMINISTRADOR (ID = 1)
        DB::table('roles')->where('id', 1)->orWhere($colName, 'ADMINISTRADOR')->update([
            $colName => 'ADMINISTRADOR',
            'habilitado' => 1,
            'permisos' => json_encode($allPermisos),
        ]);

        // 4. Configure ATENCION AL CLIENTE (ID = 2)
        $roleAtencion = DB::table('roles')->where($colName, 'ATENCION AL CLIENTE')->first();
        if (!$roleAtencion) {
            $role2 = DB::table('roles')->where('id', 2)->first();
            if ($role2) {
                DB::table('roles')->where('id', 2)->update([
                    $colName => 'ATENCION AL CLIENTE',
                    'habilitado' => 1,
                    'permisos' => json_encode($atencionPermisos),
                ]);
            } else {
                DB::table('roles')->insert([
                    'id' => 2,
                    $colName => 'ATENCION AL CLIENTE',
                    'habilitado' => 1,
                    'permisos' => json_encode($atencionPermisos),
                ]);
            }
        } else {
            DB::table('roles')->where('id', $roleAtencion->id)->update([
                'permisos' => json_encode($atencionPermisos),
            ]);
        }

        // 5. Configure SUPERVISOR (ID = 3)
        $roleSupervisor = DB::table('roles')->where($colName, 'SUPERVISOR')->first();
        if (!$roleSupervisor) {
            DB::table('roles')->insert([
                'id' => 3,
                $colName => 'SUPERVISOR',
                'habilitado' => 1,
                'permisos' => json_encode($supervisorPermisos),
            ]);
        } else {
            DB::table('roles')->where('id', $roleSupervisor->id)->update([
                'permisos' => json_encode($supervisorPermisos),
            ]);
        }

        // 6. Ensure requested users exist
        $usersToCreate = [
            [
                'name' => 'Ana Rivas',
                'username' => 'ana.rivas',
                'email' => 'ana.rivas@sepriet.com',
                'role_id' => 2, // ATENCION AL CLIENTE
                'password' => Hash::make('sepriet123'),
                'habilitado' => 1,
            ],
            [
                'name' => 'Yuri Segovia',
                'username' => 'yuri.segovia',
                'email' => 'yuri.segovia@sepriet.com',
                'role_id' => 3, // SUPERVISOR
                'password' => Hash::make('sepriet123'),
                'habilitado' => 1,
            ],
            [
                'name' => 'Gino Tafur',
                'username' => 'gino.tafur',
                'email' => 'gino.tafur@sepriet.com',
                'role_id' => 3, // SUPERVISOR
                'password' => Hash::make('sepriet123'),
                'habilitado' => 1,
            ],
        ];

        foreach ($usersToCreate as $userData) {
            $existing = DB::table('users')->whereRaw('LOWER(username) = ?', [strtolower($userData['username'])])->first();
            if (!$existing) {
                $insertData = [
                    'username' => $userData['username'],
                    'password' => $userData['password'],
                    'role_id' => $userData['role_id'],
                    'habilitado' => $userData['habilitado'],
                ];
                if (Schema::hasColumn('users', 'name')) {
                    $insertData['name'] = $userData['name'];
                }
                if (Schema::hasColumn('users', 'email')) {
                    $insertData['email'] = $userData['email'];
                }
                if (Schema::hasColumn('users', 'created_at')) {
                    $insertData['created_at'] = now();
                    $insertData['updated_at'] = now();
                }
                DB::table('users')->insert($insertData);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('roles', 'permisos')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->dropColumn('permisos');
            });
        }
    }
};
