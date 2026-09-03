<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Cliente;
use App\Models\Servicio;
use App\Models\EstadoComprobante;
use App\Models\EstadoRopa;
use App\Models\MetodoPago;
use App\Models\Local;
use App\Models\ComprobanteCounter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles (Support both nom_rol and role_name schemas dynamically)
        $adminRole = null;
        $cajeroRole = null;

        if (Schema::hasColumn('roles', 'nom_rol')) {
            $adminRole = Role::whereRaw('LOWER(nom_rol) = ?', ['admin'])->first();
            if (!$adminRole) {
                $adminRole = Role::create(['nom_rol' => 'Admin']);
            }
            $cajeroRole = Role::whereRaw('LOWER(nom_rol) = ?', ['cajero'])->first();
            if (!$cajeroRole) {
                $cajeroRole = Role::create(['nom_rol' => 'Cajero']);
            }
        } elseif (Schema::hasColumn('roles', 'role_name')) {
            $adminRole = Role::whereRaw('LOWER(role_name) = ?', ['admin'])
                ->orWhereRaw('LOWER(role_name) = ?', ['administrador'])
                ->first();
            if (!$adminRole) {
                $adminRole = Role::create(['role_name' => 'ADMINISTRADOR', 'habilitado' => 1]);
            }
            $cajeroRole = Role::whereRaw('LOWER(role_name) = ?', ['cajero'])
                ->orWhereRaw('LOWER(role_name) = ?', ['asistente'])
                ->first();
            if (!$cajeroRole) {
                $cajeroRole = Role::create(['role_name' => 'CAJERO', 'habilitado' => 1]);
            }
        }

        // 2. Users (Idempotent updateOrCreate)
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrador',
                'email' => 'admin@sepriet.com',
                'password' => Hash::make('admin123'),
                'role_id' => $adminRole ? $adminRole->id : 1,
                'habilitado' => true,
            ]
        );

        User::updateOrCreate(
            ['username' => 'cajero'],
            [
                'name' => 'Cajero 1',
                'email' => 'cajero@sepriet.com',
                'password' => Hash::make('cajero123'),
                'role_id' => $cajeroRole ? $cajeroRole->id : 2,
                'habilitado' => true,
            ]
        );

        // 3. Payment methods
        $mpHab = Schema::hasColumn('metodo_pago', 'habilitado') ? ['habilitado' => 1] : [];
        MetodoPago::firstOrCreate(['nom_metodo_pago' => 'Efectivo'], $mpHab);
        MetodoPago::firstOrCreate(['nom_metodo_pago' => 'Yape'], $mpHab);
        MetodoPago::firstOrCreate(['nom_metodo_pago' => 'Plin'], $mpHab);
        MetodoPago::firstOrCreate(['nom_metodo_pago' => 'Tarjeta'], $mpHab);

        // 4. Ticket Statuses
        if (Schema::hasTable('estado_comprobantes')) {
            $colEC = Schema::hasColumn('estado_comprobantes', 'nom_estado') ? 'nom_estado' : 'nombre';
            $ecHab = Schema::hasColumn('estado_comprobantes', 'habilitado') ? ['habilitado' => 1] : [];
            EstadoComprobante::firstOrCreate([$colEC => 'Pendiente'], $ecHab);
            EstadoComprobante::firstOrCreate([$colEC => 'En Proceso'], $ecHab);
            EstadoComprobante::firstOrCreate([$colEC => 'Listo'], $ecHab);
            EstadoComprobante::firstOrCreate([$colEC => 'Entregado'], $ecHab);
            EstadoComprobante::firstOrCreate([$colEC => 'Cancelado'], $ecHab);
        }

        // 5. Clothing Statuses
        if (Schema::hasTable('estado_ropa')) {
            $colER = Schema::hasColumn('estado_ropa', 'nom_estado_ropa') ? 'nom_estado_ropa' : 'nombre';
            $erHab = Schema::hasColumn('estado_ropa', 'habilitado') ? ['habilitado' => 1] : [];
            EstadoRopa::firstOrCreate([$colER => 'Excelente'], $erHab);
            EstadoRopa::firstOrCreate([$colER => 'Regular'], $erHab);
            EstadoRopa::firstOrCreate([$colER => 'Desgastado'], $erHab);
            EstadoRopa::firstOrCreate([$colER => 'Manchado'], $erHab);
        }

        // 6. Default Services
        if (Schema::hasTable('servicios')) {
            $hasPrecioUnidad = Schema::hasColumn('servicios', 'precio_unidad');
            $tipoKilo = $hasPrecioUnidad ? 'Kilo' : 'k';
            $tipoUnidad = $hasPrecioUnidad ? 'Unidad' : 's';

            $createService = function ($name, $tipo, $precioKilo, $precioUnidad = 0.00) use ($hasPrecioUnidad) {
                $payload = [
                    'tipo_servicio' => $tipo,
                    'precio_kilo' => $precioKilo,
                    'habilitado' => true,
                ];
                if ($hasPrecioUnidad) {
                    $payload['precio_unidad'] = $precioUnidad;
                }
                Servicio::firstOrCreate(['nom_servicio' => $name], $payload);
            };

            $createService('Lavado por Kilo', $tipoKilo, 5.00, 0.00);
            $createService('Lavado de Edredón 2 Plazas', $tipoUnidad, 25.00, 25.00);
            $createService('Lavado de Terno Completo', $tipoUnidad, 20.00, 20.00);
            $createService('Planchado por Prenda', $tipoUnidad, 3.50, 3.50);
            $createService('Lavado de Zapatillas', $tipoUnidad, 15.00, 15.00);
        }

        // 7. Default Clients
        Cliente::firstOrCreate(
            ['dni' => '12345678'],
            [
                'nombres' => 'Juan Pérez',
                'codigo_pais' => '+51',
                'telefono' => '987654321',
                'email' => 'juan@gmail.com',
                'direccion' => 'Av. Larco 123, Lima',
            ]
        );

        Cliente::firstOrCreate(
            ['dni' => '87654321'],
            [
                'nombres' => 'María López',
                'codigo_pais' => '+51',
                'telefono' => '912345678',
                'email' => 'maria@gmail.com',
                'direccion' => 'Calle Los Olivos 456',
            ]
        );

        // 8. Default Local
        if (Schema::hasTable('locales')) {
            Local::firstOrCreate(
                ['nombre' => 'Oficina Principal'],
                [
                    'direccion' => 'Av Agustín de la Rosa Toro 318 SAN LUIS',
                    'telefono' => '913027176',
                    'observaciones' => 'vjslaundry@mypefact.com',
                    'habilitado' => 1,
                ]
            );
        }

        // 9. Default Counters
        if (Schema::hasTable('comprobante_counter')) {
            ComprobanteCounter::firstOrCreate(['tipo_comprobante' => 'N'], ['last_value' => 0]);
            ComprobanteCounter::firstOrCreate(['tipo_comprobante' => 'B'], ['last_value' => 0]);
            ComprobanteCounter::firstOrCreate(['tipo_comprobante' => 'F'], ['last_value' => 0]);
        }
    }
}
