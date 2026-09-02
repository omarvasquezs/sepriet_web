<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('role');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%");
                if (Schema::hasColumn('users', 'name')) {
                    $q->orWhere('name', 'like', "%{$search}%");
                }
                if (Schema::hasColumn('users', 'email')) {
                    $q->orWhere('email', 'like', "%{$search}%");
                }
            });
        }

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        if ($request->has('habilitado') && $request->habilitado !== '') {
            $query->where('habilitado', filter_var($request->habilitado, FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = (int)$request->get('per_page', 20);
        return response()->json($query->orderBy('id', 'desc')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $rules = [
            'username' => 'required|string|max:100|unique:users,username',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
            'habilitado' => 'boolean',
        ];

        if (Schema::hasColumn('users', 'name')) {
            $rules['name'] = 'nullable|string|max:255';
        }

        if (Schema::hasColumn('users', 'email')) {
            $rules['email'] = 'nullable|email|max:255|unique:users,email';
        }

        $validated = $request->validate($rules);
        $validated['password'] = Hash::make($validated['password']);
        $validated['habilitado'] = $request->boolean('habilitado', true);

        if (array_key_exists('email', $validated) && empty($validated['email'])) {
            $validated['email'] = null;
        }

        if (Schema::hasColumn('users', 'name') && empty($validated['name'])) {
            $validated['name'] = $validated['username'];
        }

        $user = User::create($validated);

        return response()->json($user->load('role'), 201);
    }

    public function show($id)
    {
        $user = User::with('role')->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $rules = [
            'username' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'role_id' => 'sometimes|required|exists:roles,id',
            'habilitado' => 'boolean',
        ];

        if (Schema::hasColumn('users', 'name')) {
            $rules['name'] = 'sometimes|nullable|string|max:255';
        }

        if (Schema::hasColumn('users', 'email')) {
            $rules['email'] = ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users')->ignore($user->id)];
        }

        $validated = $request->validate($rules);

        if (array_key_exists('email', $validated) && empty($validated['email'])) {
            $validated['email'] = null;
        }

        // Evitar deshabilitarse a uno mismo si es el usuario autenticado
        if ($request->has('habilitado') && !$request->boolean('habilitado') && $request->user()->id === $user->id) {
            return response()->json(['message' => 'No puedes deshabilitar tu propia cuenta.'], 422);
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->load('role'));
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'No puedes eliminar tu propia cuenta.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }
}
