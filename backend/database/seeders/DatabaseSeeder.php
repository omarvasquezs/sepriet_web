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
        // 1. Roles
        $adminRole = Role::firstOrCreate(['nom_rol' => 'Admin']);
        $cajeroRole = Role::firstOrCreate(['nom_rol' => 'Cajero']);

        // 2. Users
        User::updateOrCreate(
            ['email' => 'admin@sepriet.com'],
            [
                'name' => 'Administrador',
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'role_id' => $adminRole->id,
                'habilitado' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'cajero@sepriet.com'],
            [
                'name' => 'Cajero 1',
                'username' => 'cajero',
                'password' => Hash::make('cajero123'),
                'role_id' => $cajeroRole->id,
                'habilitado' => true,
            ]
        );

        // 3. Payment methods
        MetodoPago::firstOrCreate(['nom_metodo_pago' => 'Efectivo']);
        MetodoPago::firstOrCreate(['nom_metodo_pago' => 'Yape']);
        MetodoPago::firstOrCreate(['nom_metodo_pago' => 'Plin']);
        MetodoPago::firstOrCreate(['nom_metodo_pago' => 'Tarjeta']);

        // 4. Ticket Statuses
        EstadoComprobante::firstOrCreate(['nombre' => 'Pendiente']);
        EstadoComprobante::firstOrCreate(['nombre' => 'En Proceso']);
        EstadoComprobante::firstOrCreate(['nombre' => 'Listo']);
        EstadoComprobante::firstOrCreate(['nombre' => 'Entregado']);
        EstadoComprobante::firstOrCreate(['nombre' => 'Cancelado']);

        // 5. Clothing Statuses
        EstadoRopa::firstOrCreate(['nombre' => 'Excelente']);
        EstadoRopa::firstOrCreate(['nombre' => 'Regular']);
        EstadoRopa::firstOrCreate(['nombre' => 'Desgastado']);
        EstadoRopa::firstOrCreate(['nombre' => 'Manchado']);

        // 6. Default Services
        Servicio::firstOrCreate(
            ['nom_servicio' => 'Lavado por Kilo'],
            [
                'tipo_servicio' => 'Kilo',
                'precio_kilo' => 5.00,
                'precio_unidad' => 0.00,
                'habilitado' => true,
            ]
        );

        Servicio::firstOrCreate(
            ['nom_servicio' => 'Lavado de Edredón 2 Plazas'],
            [
                'tipo_servicio' => 'Unidad',
                'precio_kilo' => 0.00,
                'precio_unidad' => 25.00,
                'habilitado' => true,
            ]
        );

        Servicio::firstOrCreate(
            ['nom_servicio' => 'Lavado de Terno Completo'],
            [
                'tipo_servicio' => 'Unidad',
                'precio_kilo' => 0.00,
                'precio_unidad' => 20.00,
                'habilitado' => true,
            ]
        );

        Servicio::firstOrCreate(
            ['nom_servicio' => 'Planchado por Prenda'],
            [
                'tipo_servicio' => 'Unidad',
                'precio_kilo' => 0.00,
                'precio_unidad' => 3.50,
                'habilitado' => true,
            ]
        );

        Servicio::firstOrCreate(
            ['nom_servicio' => 'Lavado de Zapatillas'],
            [
                'tipo_servicio' => 'Unidad',
                'precio_kilo' => 0.00,
                'precio_unidad' => 15.00,
                'habilitado' => true,
            ]
        );

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
