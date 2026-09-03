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

        $name = trim($validated['nombre'] ?? $validated['nom_rol'] ?? $validated['role_name'] ?? 'Nuevo Rol');

        // Check if role with same name already exists
        $existing = null;
        if (Schema::hasColumn('roles', 'nom_rol')) {
            $existing = Role::whereRaw('LOWER(nom_rol) = ?', [strtolower($name)])->first();
        } elseif (Schema::hasColumn('roles', 'role_name')) {
            $existing = Role::whereRaw('LOWER(role_name) = ?', [strtolower($name)])->first();
        }

        if ($existing) {
            return response()->json([
                'message' => 'Ya existe un rol con ese nombre.'
            ], 422);
        }

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

        $name = isset($validated['nombre']) || isset($validated['nom_rol']) || isset($validated['role_name'])
            ? trim($validated['nombre'] ?? $validated['nom_rol'] ?? $validated['role_name'])
            : null;

        if ($name) {
            // Check uniqueness except current role
            $existing = null;
            if (Schema::hasColumn('roles', 'nom_rol')) {
                $existing = Role::where('id', '!=', $id)->whereRaw('LOWER(nom_rol) = ?', [strtolower($name)])->first();
            } elseif (Schema::hasColumn('roles', 'role_name')) {
                $existing = Role::where('id', '!=', $id)->whereRaw('LOWER(role_name) = ?', [strtolower($name)])->first();
            }

            if ($existing) {
                return response()->json([
                    'message' => 'Ya existe otro rol con ese nombre.'
                ], 422);
            }

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
