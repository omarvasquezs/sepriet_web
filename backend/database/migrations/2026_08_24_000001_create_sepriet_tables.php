<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Roles
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('nom_rol');
            $table->timestamps();
        });

        // 2. Modify or update users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete()->after('email');
            $table->boolean('habilitado')->default(true)->after('password');
        });

        // 3. Clientes
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('nombres');
            $table->string('dni')->nullable();
            $table->string('codigo_pais')->default('+51');
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->text('direccion')->nullable();
            $table->timestamps();
        });

        // 4. Servicios
        Schema::create('servicios', function (Blueprint $table) {
            $table->id();
            $table->string('nom_servicio');
            $table->string('tipo_servicio')->default('Kilo'); // Kilo, Unidad, Prenda
            $table->decimal('precio_kilo', 10, 2)->default(0.00);
            $table->decimal('precio_unidad', 10, 2)->default(0.00);
            $table->boolean('habilitado')->default(true);
            $table->timestamps();
        });

        // 5. Estado Comprobantes
        Schema::create('estado_comprobantes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->timestamps();
        });

        // 6. Estado Ropa
        Schema::create('estado_ropa', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->timestamps();
        });

        // 7. Metodo Pago
        Schema::create('metodo_pago', function (Blueprint $table) {
            $table->id();
            $table->string('nom_metodo_pago');
            $table->timestamps();
        });

        // 8. Comprobantes
        Schema::create('comprobantes', function (Blueprint $table) {
            $table->id();
            $table->string('cod_comprobante')->unique();
            $table->foreignId('cliente_id')->constrained('clientes')->onDelete('cascade');
            $table->dateTime('fecha');
            $table->dateTime('fecha_entrega')->nullable();
            $table->decimal('costo_total', 10, 2)->default(0.00);
            $table->decimal('monto_abonado', 10, 2)->default(0.00);
            $table->decimal('monto_restante', 10, 2)->default(0.00);
            $table->decimal('descuento', 10, 2)->default(0.00);
            $table->foreignId('estado_id')->constrained('estado_comprobantes');
            $table->text('observaciones')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->timestamps();
        });

        // 9. Comprobantes Detalles
        Schema::create('comprobantes_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comprobante_id')->constrained('comprobantes')->onDelete('cascade');
            $table->foreignId('servicio_id')->constrained('servicios');
            $table->decimal('peso_kg', 8, 2)->nullable();
            $table->decimal('costo_kilo', 10, 2)->nullable();
            $table->integer('cantidad')->default(1);
            $table->decimal('precio_unitario', 10, 2)->default(0.00);
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->foreignId('estado_ropa_id')->nullable()->constrained('estado_ropa');
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });

        // 10. Reporte Ingresos
        Schema::create('reporte_ingresos', function (Blueprint $table) {
            $table->id();
            $table->string('cod_comprobante');
            $table->foreignId('cliente_id')->constrained('clientes');
            $table->foreignId('metodo_pago_id')->constrained('metodo_pago');
            $table->dateTime('fecha');
            $table->decimal('monto_abonado', 10, 2);
            $table->decimal('costo_total', 10, 2);
            $table->decimal('descuento', 10, 2)->default(0.00);
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->timestamps();
        });

        // 11. Caja Apertura / Cierre
        Schema::create('caja_apertura_cierre', function (Blueprint $table) {
            $table->id();
            $table->dateTime('datetime_apertura');
            $table->dateTime('datetime_cierre')->nullable();
            $table->decimal('monto_apertura', 10, 2);
            $table->decimal('monto_cierre', 10, 2)->nullable();
            $table->foreignId('id_usuario_apertura')->constrained('users');
            $table->foreignId('id_usuario_cierre')->nullable()->constrained('users');
            $table->decimal('total_ventas', 10, 2)->default(0.00);
            $table->decimal('total_egresos', 10, 2)->default(0.00);
            $table->decimal('saldo_final', 10, 2)->nullable();
            $table->enum('estado', ['Abierta', 'Cerrada'])->default('Abierta');
            $table->timestamps();
        });

        // 12. Caja Egresos
        Schema::create('caja_egresos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_caja')->constrained('caja_apertura_cierre')->onDelete('cascade');
            $table->dateTime('fecha');
            $table->string('descripcion');
            $table->decimal('monto', 10, 2);
            $table->foreignId('id_metodo_pago')->nullable()->constrained('metodo_pago');
            $table->foreignId('id_usuario')->constrained('users');
            $table->string('imagen_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('caja_egresos');
        Schema::dropIfExists('caja_apertura_cierre');
        Schema::dropIfExists('reporte_ingresos');
        Schema::dropIfExists('comprobantes_detalles');
        Schema::dropIfExists('comprobantes');
        Schema::dropIfExists('metodo_pago');
        Schema::dropIfExists('estado_ropa');
        Schema::dropIfExists('estado_comprobantes');
        Schema::dropIfExists('servicios');
        Schema::dropIfExists('clientes');

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn(['username', 'role_id', 'habilitado']);
        });

        Schema::dropIfExists('roles');
    }
};
