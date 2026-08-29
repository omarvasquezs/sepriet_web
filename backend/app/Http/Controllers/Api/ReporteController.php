<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comprobante;
use App\Models\ReporteIngreso;
use App\Models\CajaEgreso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    public function financiero(Request $request)
    {
        $fechaInicio = $request->get('fecha_inicio', now()->startOfMonth()->toDateString());
        $fechaFin = $request->get('fecha_fin', now()->endOfMonth()->toDateString());

        $ingresosQuery = ReporteIngreso::with(['cliente', 'metodoPago'])
            ->whereBetween('fecha', [$fechaInicio . ' 00:00:00', $fechaFin . ' 23:59:59']);

        $totalIngresos = (float)$ingresosQuery->sum('monto_abonado');

        $porMetodoPago = ReporteIngreso::select('metodo_pago_id', DB::raw('SUM(monto_abonado) as total'))
            ->whereBetween('fecha', [$fechaInicio . ' 00:00:00', $fechaFin . ' 23:59:59'])
            ->groupBy('metodo_pago_id')
            ->with('metodoPago')
            ->get();

        $egresosTotal = (float)CajaEgreso::whereBetween('fecha', [$fechaInicio . ' 00:00:00', $fechaFin . ' 23:59:59'])
            ->sum('monto');

        return response()->json([
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'total_ingresos' => $totalIngresos,
            'total_egresos' => $egresosTotal,
            'ganancia_neta' => $totalIngresos - $egresosTotal,
            'por_metodo_pago' => $porMetodoPago,
            'listado_ingresos' => $ingresosQuery->orderBy('fecha', 'desc')->limit(100)->get(),
        ]);
    }

    public function trabajo(Request $request)
    {
        $fechaInicio = $request->get('fecha_inicio', now()->startOfMonth()->toDateString());
        $fechaFin = $request->get('fecha_fin', now()->endOfMonth()->toDateString());

        $comprobantes = Comprobante::with(['cliente', 'estadoComprobante', 'estadoRopa', 'detalles.servicio'])
            ->whereBetween('fecha', [$fechaInicio . ' 00:00:00', $fechaFin . ' 23:59:59'])
            ->orderBy('id', 'desc')
            ->get();

        $totalTickets = $comprobantes->count();
        $totalMonto = (float)$comprobantes->sum('costo_total');

        return response()->json([
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'total_tickets' => $totalTickets,
            'total_monto' => $totalMonto,
            'tickets' => $comprobantes,
        ]);
    }
}
