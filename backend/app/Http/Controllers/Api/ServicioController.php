<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Servicio;
use Illuminate\Http\Request;

class ServicioController extends Controller
{
    public function index()
    {
        return response()->json(Servicio::orderBy('nom_servicio')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_servicio' => 'required|string|max:255',
            'tipo_servicio' => 'required|string',
            'precio_kilo' => 'nullable|numeric|min:0',
            'precio_unidad' => 'nullable|numeric|min:0',
            'habilitado' => 'boolean',
        ]);

        $servicio = Servicio::create($validated);

        return response()->json($servicio, 201);
    }

    public function show($id)
    {
        $servicio = Servicio::findOrFail($id);
        return response()->json($servicio);
    }

    public function update(Request $request, $id)
    {
        $servicio = Servicio::findOrFail($id);

        $validated = $request->validate([
            'nom_servicio' => 'sometimes|required|string|max:255',
            'tipo_servicio' => 'sometimes|required|string',
            'precio_kilo' => 'nullable|numeric|min:0',
            'precio_unidad' => 'nullable|numeric|min:0',
            'habilitado' => 'boolean',
        ]);

        $servicio->update($validated);

        return response()->json($servicio);
    }

    public function destroy($id)
    {
        $servicio = Servicio::findOrFail($id);
        $servicio->delete();

        return response()->json(['message' => 'Servicio eliminado correctamente']);
    }
}
