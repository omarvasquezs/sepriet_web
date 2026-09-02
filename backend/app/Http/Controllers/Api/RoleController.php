<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::withCount('users')->get();
        return response()->json($roles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:100',
            'nom_rol' => 'sometimes|string|max:100',
            'role_name' => 'sometimes|string|max:100',
            'habilitado' => 'boolean',
        ]);

        $name = $validated['nombre'] ?? $validated['nom_rol'] ?? $validated['role_name'] ?? 'Nuevo Rol';

        $data = [
            'habilitado' => $request->boolean('habilitado', true),
        ];

        if (Schema::hasColumn('roles', 'nom_rol')) {
            $data['nom_rol'] = $name;
        }
        if (Schema::hasColumn('roles', 'role_name')) {
            $data['role_name'] = $name;
        }

        $role = Role::create($data);
        return response()->json($role->loadCount('users'), 201);
    }

    public function show($id)
    {
        $role = Role::withCount('users')->findOrFail($id);
        return response()->json($role);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:100',
            'nom_rol' => 'sometimes|string|max:100',
            'role_name' => 'sometimes|string|max:100',
            'habilitado' => 'boolean',
        ]);

        $data = [];
        if ($request->has('habilitado')) {
            $data['habilitado'] = $request->boolean('habilitado');
        }

        $name = $validated['nombre'] ?? $validated['nom_rol'] ?? $validated['role_name'] ?? null;
        if ($name) {
            if (Schema::hasColumn('roles', 'nom_rol')) {
                $data['nom_rol'] = $name;
            }
            if (Schema::hasColumn('roles', 'role_name')) {
                $data['role_name'] = $name;
            }
        }

        $role->update($data);
        return response()->json($role->loadCount('users'));
    }

    public function destroy($id)
    {
        $role = Role::withCount('users')->findOrFail($id);

        if ($role->users_count > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el rol porque tiene usuarios asignados.'
            ], 422);
        }

        $role->delete();
        return response()->json(['message' => 'Rol eliminado correctamente.']);
    }
}
