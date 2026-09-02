<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Models\Cliente;
use App\Models\Servicio;
use App\Models\EstadoComprobante;
use App\Models\EstadoRopa;
use App\Models\MetodoPago;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Roles
        $adminRole = Role::create(['nom_rol' => 'Admin']);
        $cajeroRole = Role::create(['nom_rol' => 'Cajero']);

        // Users
        User::create([
            'name' => 'Administrador',
            'username' => 'admin',
            'email' => 'admin@sepriet.com',
            'password' => Hash::make('admin123'),
            'role_id' => $adminRole->id,
            'habilitado' => true,
        ]);

        User::create([
            'name' => 'Cajero 1',
            'username' => 'cajero',
            'email' => 'cajero@sepriet.com',
            'password' => Hash::make('cajero123'),
            'role_id' => $cajeroRole->id,
            'habilitado' => true,
        ]);

        // Payment methods
        MetodoPago::create(['nom_metodo_pago' => 'Efectivo']);
        MetodoPago::create(['nom_metodo_pago' => 'Yape']);
        MetodoPago::create(['nom_metodo_pago' => 'Plin']);
        MetodoPago::create(['nom_metodo_pago' => 'Tarjeta']);

        // Ticket Statuses
        EstadoComprobante::create(['nombre' => 'Pendiente']);
        EstadoComprobante::create(['nombre' => 'En Proceso']);
        EstadoComprobante::create(['nombre' => 'Listo']);
        EstadoComprobante::create(['nombre' => 'Entregado']);
        EstadoComprobante::create(['nombre' => 'Cancelado']);

        // Clothing Statuses
        EstadoRopa::create(['nombre' => 'Excelente']);
        EstadoRopa::create(['nombre' => 'Regular']);
        EstadoRopa::create(['nombre' => 'Desgastado']);
        EstadoRopa::create(['nombre' => 'Manchado']);

        // Default Services
        Servicio::create([
            'nom_servicio' => 'Lavado por Kilo',
            'tipo_servicio' => 'Kilo',
            'precio_kilo' => 5.00,
            'precio_unidad' => 0.00,
            'habilitado' => true,
        ]);

        Servicio::create([
            'nom_servicio' => 'Lavado de Edredón 2 Plazas',
            'tipo_servicio' => 'Unidad',
            'precio_kilo' => 0.00,
            'precio_unidad' => 25.00,
            'habilitado' => true,
        ]);

        Servicio::create([
            'nom_servicio' => 'Lavado de Terno Completo',
            'tipo_servicio' => 'Unidad',
            'precio_kilo' => 0.00,
            'precio_unidad' => 20.00,
            'habilitado' => true,
        ]);

        Servicio::create([
            'nom_servicio' => 'Planchado por Prenda',
            'tipo_servicio' => 'Unidad',
            'precio_kilo' => 0.00,
            'precio_unidad' => 3.50,
            'habilitado' => true,
        ]);

        Servicio::create([
            'nom_servicio' => 'Lavado de Zapatillas',
            'tipo_servicio' => 'Unidad',
            'precio_kilo' => 0.00,
            'precio_unidad' => 15.00,
            'habilitado' => true,
        ]);

        // Default Clients
        Cliente::create([
            'nombres' => 'Juan Pérez',
            'dni' => '12345678',
            'codigo_pais' => '+51',
            'telefono' => '987654321',
            'email' => 'juan@gmail.com',
            'direccion' => 'Av. Larco 123, Lima',
        ]);

        Cliente::create([
            'nombres' => 'María López',
            'dni' => '87654321',
            'codigo_pais' => '+51',
            'telefono' => '912345678',
            'email' => 'maria@gmail.com',
            'direccion' => 'Calle Los Olivos 456',
        ]);

        // Default Local
        if (\App\Models\Local::count() === 0) {
            \App\Models\Local::create([
                'nombre' => 'Oficina Principal',
                'direccion' => 'Av Agustín de la Rosa Toro 318 SAN LUIS',
                'telefono' => '913027176',
                'observaciones' => 'vjslaundry@mypefact.com',
                'habilitado' => 1,
            ]);
        }
    }
}
