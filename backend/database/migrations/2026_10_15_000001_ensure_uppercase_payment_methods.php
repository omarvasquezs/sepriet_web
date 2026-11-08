<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ensure 'habilitado' on 'metodo_pago'
        if (Schema::hasTable('metodo_pago') && !Schema::hasColumn('metodo_pago', 'habilitado')) {
            Schema::table('metodo_pago', function (Blueprint $table) {
                $table->boolean('habilitado')->default(true)->after('nom_metodo_pago');
            });
        }

        // 2. Ensure 'habilitado' on 'estado_comprobantes'
        if (Schema::hasTable('estado_comprobantes') && !Schema::hasColumn('estado_comprobantes', 'habilitado')) {
            Schema::table('estado_comprobantes', function (Blueprint $table) {
                $table->boolean('habilitado')->default(true);
            });
        }

        // 3. Ensure all payment methods in metodo_pago are UPPERCASE
        if (Schema::hasTable('metodo_pago')) {
            DB::statement("UPDATE metodo_pago SET nom_metodo_pago = UPPER(nom_metodo_pago)");

            // Ensure standard payment methods exist and are properly labeled & enabled
            $methods = [
                1 => ['nom' => 'YAPE / PLIN', 'hab' => 1],
                4 => ['nom' => 'EFECTIVO', 'hab' => 1],
                5 => ['nom' => 'YAPE', 'hab' => 1],
                6 => ['nom' => 'PLIN', 'hab' => 1],
                7 => ['nom' => 'TARJETA', 'hab' => 1],
            ];

            foreach ($methods as $id => $data) {
                $existing = DB::table('metodo_pago')->where('id', $id)->first();
                if ($existing) {
                    DB::table('metodo_pago')->where('id', $id)->update([
                        'nom_metodo_pago' => $data['nom'],
                        'habilitado' => $data['hab'],
                    ]);
                } else {
                    $hasByName = DB::table('metodo_pago')->whereRaw('UPPER(nom_metodo_pago) = ?', [$data['nom']])->first();
                    if (!$hasByName) {
                        DB::table('metodo_pago')->insert([
                            'id' => $id,
                            'nom_metodo_pago' => $data['nom'],
                            'habilitado' => $data['hab'],
                        ]);
                    }
                }
            }
        }

        // 4. Ensure comprobantes table has all required columns if missing
        if (Schema::hasTable('comprobantes')) {
            Schema::table('comprobantes', function (Blueprint $table) {
                if (!Schema::hasColumn('comprobantes', 'tipo_comprobante')) {
                    $table->char('tipo_comprobante', 1)->default('N')->after('id');
                }
                if (!Schema::hasColumn('comprobantes', 'metodo_pago_id')) {
                    $table->integer('metodo_pago_id')->nullable()->after('fecha');
                }
                if (!Schema::hasColumn('comprobantes', 'num_ruc')) {
                    $table->bigInteger('num_ruc')->nullable();
                }
                if (!Schema::hasColumn('comprobantes', 'razon_social')) {
                    $table->string('razon_social', 256)->nullable();
                }
                if (!Schema::hasColumn('comprobantes', 'estado_comprobante_id')) {
                    $table->integer('estado_comprobante_id')->default(4);
                }
                if (!Schema::hasColumn('comprobantes', 'estado_ropa_id')) {
                    $table->integer('estado_ropa_id')->default(1);
                }
                if (!Schema::hasColumn('comprobantes', 'local_id')) {
                    $table->integer('local_id')->default(5);
                }
                if (!Schema::hasColumn('comprobantes', 'last_updated_by')) {
                    $table->integer('last_updated_by')->nullable();
                }
                if (!Schema::hasColumn('comprobantes', 'activado')) {
                    $table->boolean('activado')->default(true);
                }
                if (!Schema::hasColumn('comprobantes', 'fecha_actualizacion')) {
                    $table->dateTime('fecha_actualizacion')->nullable();
                }
                if (!Schema::hasColumn('comprobantes', 'fecha_actualizacion_estado_comprobante')) {
                    $table->dateTime('fecha_actualizacion_estado_comprobante')->nullable();
                }
                if (!Schema::hasColumn('comprobantes', 'fecha_actualizacion_estado_ropa')) {
                    $table->dateTime('fecha_actualizacion_estado_ropa')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        // No-op rollback to preserve data integrity
    }
};

