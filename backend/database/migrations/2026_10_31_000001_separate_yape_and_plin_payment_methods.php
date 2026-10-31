<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('metodo_pago')) {
            // 1. Ensure column 'habilitado' exists
            if (!Schema::hasColumn('metodo_pago', 'habilitado')) {
                Schema::table('metodo_pago', function (Blueprint $table) {
                    $table->boolean('habilitado')->default(true)->after('nom_metodo_pago');
                });
            }

            // 2. Disable combined 'YAPE / PLIN' so it no longer appears in selection lists
            DB::table('metodo_pago')
                ->where('id', 1)
                ->orWhereRaw("UPPER(nom_metodo_pago) LIKE '%YAPE%/%PLIN%'")
                ->orWhereRaw("UPPER(nom_metodo_pago) LIKE '%YAPE / PLIN%'")
                ->update(['habilitado' => 0]);

            // 3. Ensure separate YAPE (id 5) is enabled
            $yape = DB::table('metodo_pago')->where('id', 5)->first();
            if ($yape) {
                DB::table('metodo_pago')->where('id', 5)->update([
                    'nom_metodo_pago' => 'YAPE',
                    'habilitado' => 1,
                ]);
            } else {
                $hasYape = DB::table('metodo_pago')->whereRaw("UPPER(nom_metodo_pago) = 'YAPE'")->first();
                if ($hasYape) {
                    DB::table('metodo_pago')->where('id', $hasYape->id)->update(['habilitado' => 1]);
                } else {
                    DB::table('metodo_pago')->insert([
                        'id' => 5,
                        'nom_metodo_pago' => 'YAPE',
                        'habilitado' => 1,
                    ]);
                }
            }

            // 4. Ensure separate PLIN (id 6) is enabled
            $plin = DB::table('metodo_pago')->where('id', 6)->first();
            if ($plin) {
                DB::table('metodo_pago')->where('id', 6)->update([
                    'nom_metodo_pago' => 'PLIN',
                    'habilitado' => 1,
                ]);
            } else {
                $hasPlin = DB::table('metodo_pago')->whereRaw("UPPER(nom_metodo_pago) = 'PLIN'")->first();
                if ($hasPlin) {
                    DB::table('metodo_pago')->where('id', $hasPlin->id)->update(['habilitado' => 1]);
                } else {
                    DB::table('metodo_pago')->insert([
                        'id' => 6,
                        'nom_metodo_pago' => 'PLIN',
                        'habilitado' => 1,
                    ]);
                }
            }

            // 5. Ensure EFECTIVO (id 4) is enabled
            DB::table('metodo_pago')
                ->where('id', 4)
                ->orWhereRaw("UPPER(nom_metodo_pago) = 'EFECTIVO'")
                ->update(['habilitado' => 1]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('metodo_pago')) {
            DB::table('metodo_pago')
                ->where('id', 1)
                ->update(['habilitado' => 1]);
        }
    }
};
