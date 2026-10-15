<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('roles', 'permisos')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->text('permisos')->nullable()->after('habilitado');
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

        // 1. Update ADMINISTRADOR (role_id = 1 or matching name)
        $colName = Schema::hasColumn('roles', 'role_name') ? 'role_name' : 'nom_rol';
        
        DB::table('roles')->where('id', 1)->orWhere($colName, 'ADMINISTRADOR')->update([
            $colName => 'ADMINISTRADOR',
            'habilitado' => 1,
            'permisos' => json_encode($allPermisos),
        ]);

        // 2. Configure ATENCION AL CLIENTE (update role 2 ASISTENTE or create)
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

        // 3. Configure SUPERVISOR
        $roleSupervisor = DB::table('roles')->where($colName, 'SUPERVISOR')->first();
        if (!$roleSupervisor) {
            DB::table('roles')->insert([
                $colName => 'SUPERVISOR',
                'habilitado' => 1,
                'permisos' => json_encode($supervisorPermisos),
            ]);
        } else {
            DB::table('roles')->where('id', $roleSupervisor->id)->update([
                'permisos' => json_encode($supervisorPermisos),
            ]);
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

