<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CajaAperturaCierre;
use App\Models\CajaEgreso;
use App\Models\ReporteIngreso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CajaController extends Controller
{
    public function estado()
    {
        $cajaAbierta = CajaAperturaCierre::with(['usuarioApertura', 'egresos.metodoPago', 'egresos.usuario'])
            ->where('estado', 'Abierta')
            ->latest()
            ->first();

        if (!$cajaAbierta) {
            return response()->json([
                'caja' => null,
                'mensaje' => 'No hay ninguna caja abierta actualmente'
            ]);
        }

        // Calculate sales income logged since apertura
        $totalVentas = ReporteIngreso::where('fecha', '>=', $cajaAbierta->datetime_apertura)
            ->sum('monto_abonado');

        $totalEgresos = $cajaAbierta->egresos()->sum('monto');
        $saldoEstimado = $cajaAbierta->monto_apertura + $totalVentas - $totalEgresos;

        $cajaAbierta->total_ventas = $totalVentas;
        $cajaAbierta->total_egresos = $totalEgresos;
        $cajaAbierta->saldo_final = $saldoEstimado;

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

        $cajaAbierta = CajaAperturaCierre::where('estado', 'Abierta')->first();
        if ($cajaAbierta) {
            return response()->json(['message' => 'Ya existe una caja abierta'], 422);
        }

        $caja = CajaAperturaCierre::create([
            'datetime_apertura' => now(),
            'monto_apertura' => $validated['monto_apertura'],
            'id_usuario_apertura' => $request->user()->id,
            'estado' => 'Abierta',
        ]);

        return response()->json($caja->load('usuarioApertura'), 201);
    }

    public function cierre(Request $request)
    {
        $validated = $request->validate([
            'monto_cierre' => 'required|numeric|min:0',
        ]);

        $cajaAbierta = CajaAperturaCierre::where('estado', 'Abierta')->first();
        if (!$cajaAbierta) {
            return response()->json(['message' => 'No hay una caja abierta para cerrar'], 422);
        }

        $totalVentas = ReporteIngreso::where('fecha', '>=', $cajaAbierta->datetime_apertura)
            ->sum('monto_abonado');

        $totalEgresos = $cajaAbierta->egresos()->sum('monto');
        $saldoFinal = $validated['monto_cierre'];

        $cajaAbierta->update([
            'datetime_cierre' => now(),
            'monto_cierre' => $validated['monto_cierre'],
            'id_usuario_cierre' => $request->user()->id,
            'total_ventas' => $totalVentas,
            'total_egresos' => $totalEgresos,
            'saldo_final' => $saldoFinal,
            'estado' => 'Cerrada',
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

        $cajaAbierta = CajaAperturaCierre::where('estado', 'Abierta')->first();
        if (!$cajaAbierta) {
            return response()->json(['message' => 'Debe abrir caja antes de registrar egresos'], 422);
        }

        $egreso = CajaEgreso::create([
            'id_caja' => $cajaAbierta->id,
            'fecha' => now(),
            'descripcion' => $validated['descripcion'],
            'monto' => $validated['monto'],
            'id_metodo_pago' => $validated['id_metodo_pago'] ?? null,
            'id_usuario' => $request->user()->id,
        ]);

        return response()->json($egreso->load(['metodoPago', 'usuario']), 201);
    }
}
