<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Servicio;
use Illuminate\Http\Request;

class ServicioController extends Controller
{
    public function index(Request $request)
    {
        $query = Servicio::query();

        if ($request->has('tipo') && $request->tipo != '') {
            $query->where('tipo_servicio', $request->tipo);
        }

        if ($request->has('habilitado')) {
            $query->where('habilitado', $request->habilitado == 'true' || $request->habilitado == '1');
        }

        return response()->json($query->orderBy('nom_servicio')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_servicio' => 'required|string|max:255',
            'tipo_servicio' => 'required|in:k,s,p',
            'precio_kilo' => 'nullable|numeric|min:0',
            'habilitado' => 'boolean',
            'activado' => 'boolean',
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
            'tipo_servicio' => 'sometimes|required|in:k,s,p',
            'precio_kilo' => 'nullable|numeric|min:0',
            'habilitado' => 'boolean',
            'activado' => 'boolean',
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
