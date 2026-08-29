<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::with('role')
            ->where('username', $request->username)
            ->first();

        if (!$user) {
            // Case-insensitive username check fallback
            $user = User::with('role')
                ->whereRaw('LOWER(username) = ?', [strtolower($request->username)])
                ->first();
        }

        if (!$user) {
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        $passwordValid = false;

        if (str_starts_with($user->password, '$2y$') || str_starts_with($user->password, '$2a$') || str_starts_with($user->password, '$argon')) {
            try {
                if (Hash::check($request->password, $user->password)) {
                    $passwordValid = true;
                }
            } catch (\Throwable $e) {}
        }

        if (!$passwordValid) {
            $legacyHash = md5(sha1($request->password));
            if ($legacyHash === $user->password) {
                $passwordValid = true;
                // Transparently upgrade password to modern bcrypt
                $user->password = Hash::make($request->password);
                $user->save();
            }
        }

        if (!$passwordValid) {
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        if (!$user->habilitado) {
            return response()->json([
                'message' => 'El usuario se encuentra inhabilitado'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->username,
                'username' => $user->username,
                'role' => $user->role ? $user->role->role_name : 'Usuario',
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('role');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->username,
                'username' => $user->username,
                'role' => $user->role ? $user->role->role_name : 'Usuario',
            ]
        ]);
    }
}
