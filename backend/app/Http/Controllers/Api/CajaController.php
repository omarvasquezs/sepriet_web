<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CajaAperturaCierre;
use App\Models\CajaEgreso;
use App\Models\ReporteIngreso;
use Illuminate\Http\Request;

class CajaController extends Controller
{
    public function estado()
    {
        $cajaAbierta = CajaAperturaCierre::with(['usuarioApertura', 'egresos.metodoPago', 'egresos.usuario'])
            ->whereNull('datetime_cierre')
            ->latest('id')
            ->first();

        if (!$cajaAbierta) {
            return response()->json([
                'caja' => null,
                'mensaje' => 'No hay ninguna caja abierta actualmente'
            ]);
        }

        // Calculate sales income logged since datetime_apertura
        $totalVentas = (float)ReporteIngreso::where('fecha', '>=', $cajaAbierta->datetime_apertura)
            ->sum('monto_abonado');

        $totalEgresos = (float)$cajaAbierta->egresos()->sum('monto');
        $saldoEstimado = (float)$cajaAbierta->monto_apertura + $totalVentas - $totalEgresos;

        return response()->json([
            'caja' => $cajaAbierta,
            'total_ventas' => $totalVentas,
            'total_egresos' => $totalEgresos,
            'saldo_estimado' => $saldoEstimado,
        ]);
    }

    public function apertura(Request $request)
    {
        $validated = $request->validate([
            'monto_apertura' => 'required|numeric|min:0',
        ]);

        $cajaAbierta = CajaAperturaCierre::whereNull('datetime_cierre')->first();
        if ($cajaAbierta) {
            return response()->json(['message' => 'Ya existe una caja abierta'], 422);
        }

        $caja = CajaAperturaCierre::create([
            'datetime_apertura' => now(),
            'monto_apertura' => (float)$validated['monto_apertura'],
            'id_usuario_apertura' => $request->user()->id,
        ]);

        return response()->json($caja->load('usuarioApertura'), 201);
    }

    public function cierre(Request $request)
    {
        $validated = $request->validate([
            'monto_cierre' => 'required|numeric|min:0',
        ]);

        $cajaAbierta = CajaAperturaCierre::whereNull('datetime_cierre')->first();
        if (!$cajaAbierta) {
            return response()->json(['message' => 'No hay una caja abierta para cerrar'], 422);
        }

        $cajaAbierta->update([
            'datetime_cierre' => now(),
            'monto_cierre' => (float)$validated['monto_cierre'],
            'id_usuario_cierre' => $request->user()->id,
        ]);

        return response()->json($cajaAbierta->load(['usuarioApertura', 'usuarioCierre']));
    }

    public function registrarEgreso(Request $request)
    {
        $validated = $request->validate([
            'descripcion' => 'required|string|max:255',
            'monto' => 'required|numeric|min:0.01',
            'id_metodo_pago' => 'nullable|exists:metodo_pago,id',
        ]);

        $cajaAbierta = CajaAperturaCierre::whereNull('datetime_cierre')->first();
        if (!$cajaAbierta) {
            return response()->json(['message' => 'Debe abrir caja antes de registrar egresos'], 422);
        }

        $egreso = CajaEgreso::create([
            'id_caja' => $cajaAbierta->id,
            'fecha' => now(),
            'descripcion' => $validated['descripcion'],
            'monto' => (float)$validated['monto'],
            'id_metodo_pago' => $validated['id_metodo_pago'] ?? 4, // 4 = Efectivo default
            'id_usuario' => $request->user()->id,
        ]);

        return response()->json($egreso->load(['metodoPago', 'usuario']), 201);
    }
}
