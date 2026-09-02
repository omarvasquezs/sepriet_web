<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('locales')) {
            Schema::create('locales', function (Blueprint $table) {
                $table->id();
                $table->string('nombre');
                $table->text('direccion')->nullable();
                $table->string('telefono', 20)->nullable();
                $table->text('observaciones')->nullable();
                $table->boolean('habilitado')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('comprobante_counter')) {
            Schema::create('comprobante_counter', function (Blueprint $table) {
                $table->char('tipo_comprobante', 1)->primary();
                $table->integer('last_value')->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('comprobante_counter');
        Schema::dropIfExists('locales');
    }
};
