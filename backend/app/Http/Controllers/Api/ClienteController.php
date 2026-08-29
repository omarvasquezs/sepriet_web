<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $query = Cliente::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                  ->orWhere('dni', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        if ($request->has('all') && $request->all == 'true') {
            return response()->json($query->orderBy('nombres')->get());
        }

        $perPage = (int)$request->get('per_page', 50);
        return response()->json($query->orderBy('nombres')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombres' => 'required|string|max:255',
            'dni' => 'nullable|string|max:100',
            'codigo_pais' => 'nullable|string|max:10',
            'telefono' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'direccion' => 'nullable|string',
        ]);

        $cliente = Cliente::create($validated);

        return response()->json($cliente, 201);
    }

    public function show($id)
    {
        $cliente = Cliente::findOrFail($id);
        return response()->json($cliente);
    }

    public function update(Request $request, $id)
    {
        $cliente = Cliente::findOrFail($id);

        $validated = $request->validate([
            'nombres' => 'sometimes|required|string|max:255',
            'dni' => 'nullable|string|max:100',
            'codigo_pais' => 'nullable|string|max:10',
            'telefono' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'direccion' => 'nullable|string',
        ]);

        $cliente->update($validated);

        return response()->json($cliente);
    }

    public function destroy($id)
    {
        $cliente = Cliente::findOrFail($id);
        $cliente->delete();

        return response()->json(['message' => 'Cliente eliminado correctamente']);
    }
}
