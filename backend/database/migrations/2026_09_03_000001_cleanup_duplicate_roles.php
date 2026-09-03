<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Role;
use App\Models\User;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('roles')) {
            return;
        }

        $column = Schema::hasColumn('roles', 'nom_rol') ? 'nom_rol' : (Schema::hasColumn('roles', 'role_name') ? 'role_name' : null);

        if (!$column) {
            return;
        }

        // 1. Group roles by lowercase name
        $allRoles = DB::table('roles')->orderBy('id')->get();
        $seen = [];

        foreach ($allRoles as $r) {
            $name = strtolower(trim($r->$column ?? ''));
            if ($name === '') {
                continue;
            }

            if (!isset($seen[$name])) {
                $seen[$name] = $r->id; // Primary ID for this role name
            } else {
                $primaryId = $seen[$name];
                $duplicateId = $r->id;

                // Reassign all users from duplicate role to primary role
                DB::table('users')->where('role_id', $duplicateId)->update(['role_id' => $primaryId]);

                // Delete duplicate role
                DB::table('roles')->where('id', $duplicateId)->delete();
            }
        }
    }

    public function down(): void
    {
        // No down needed for deduplication cleanup
    }
};
