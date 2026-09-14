<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CajaAperturaCierre;
use App\Models\CajaEgreso;
use App\Models\ReporteIngreso;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class CajaController extends Controller
{
    /**
     * Get the consolidated status of Caja for today.
     * Auto-closes any past unclosed caja from previous dates.
     */
    public function estado(Request $request)
    {
        // 1. Auto-close unclosed cajas from previous dates (midnight automatic closure)
        $oldOpenCajas = CajaAperturaCierre::whereNull('datetime_cierre')
            ->whereDate('datetime_apertura', '<', now()->toDateString())
            ->get();

        foreach ($oldOpenCajas as $oldCaja) {
            $ingresosEfectivoOld = (float)ReporteIngreso::where('fecha', '>=', $oldCaja->datetime_apertura)
                ->where('fecha', '<=', Carbon::parse($oldCaja->datetime_apertura)->endOfDay())
                ->where(function ($q) {
                    $q->where('metodo_pago_id', 4)->orWhereNull('metodo_pago_id');
                })
                ->sum('monto_abonado');

            $egresosEfectivoOld = (float)CajaEgreso::where('id_caja', $oldCaja->id)
                ->where('id_metodo_pago', 4)
                ->sum('monto');

            $montoCierreAuto = (float)$oldCaja->monto_apertura + $ingresosEfectivoOld - $egresosEfectivoOld;

            $oldCaja->update([
                'datetime_cierre' => Carbon::parse($oldCaja->datetime_apertura)->endOfDay(),
                'monto_cierre' => max(0, $montoCierreAuto),
                'id_usuario_cierre' => $oldCaja->id_usuario_apertura,
            ]);
        }

        // 2. Query open caja for today
        $cajaAbierta = CajaAperturaCierre::with(['usuarioApertura'])
            ->whereDate('datetime_apertura', now()->toDateString())
            ->whereNull('datetime_cierre')
            ->latest('id')
            ->first();

        if (!$cajaAbierta) {
            return response()->json([
                'caja' => null,
                'requiere_apertura' => true,
                'mensaje' => 'No se ha aperturado la caja el día de hoy. Por favor ingrese el monto inicial:'
            ]);
        }

        // 3. Date filtering for consolidated summary and detailed egresos
        $fechaDesde = $request->filled('fecha_desde')
            ? Carbon::parse($request->fecha_desde)->startOfDay()
            : Carbon::parse($cajaAbierta->datetime_apertura);

        $fechaHasta = $request->filled('fecha_hasta')
            ? Carbon::parse($request->fecha_hasta)->endOfDay()
            : now();

        // 4. Calculate Sales Breakdown (ReporteIngreso)
        // Metodo 4 = EFECTIVO, Metodo 1 = YAPE / PLIN
        $ingresosEfectivo = (float)ReporteIngreso::whereBetween('fecha', [$fechaDesde, $fechaHasta])
            ->where(function ($q) {
                $q->where('metodo_pago_id', 4)->orWhereNull('metodo_pago_id');
            })
            ->sum('monto_abonado');

        $ingresosYapePlin = (float)ReporteIngreso::whereBetween('fecha', [$fechaDesde, $fechaHasta])
            ->where('metodo_pago_id', 1)
            ->sum('monto_abonado');

        $ingresosOtros = (float)ReporteIngreso::whereBetween('fecha', [$fechaDesde, $fechaHasta])
            ->whereNotIn('metodo_pago_id', [1, 4])
            ->whereNotNull('metodo_pago_id')
            ->sum('monto_abonado');

        $totalIngresos = $ingresosEfectivo + $ingresosYapePlin + $ingresosOtros;

        // 5. Query Egresos with Filtering
        $egresosQuery = CajaEgreso::with(['metodoPago', 'usuario'])
            ->where('id_caja', $cajaAbierta->id);

        if ($request->filled('fecha_desde') && $request->filled('fecha_hasta')) {
            $egresosQuery->whereBetween('fecha', [$fechaDesde, $fechaHasta]);
        }

        $egresos = $egresosQuery->orderBy('fecha', 'desc')->get();

        $egresosEfectivo = (float)$egresos->where('id_metodo_pago', 4)->sum('monto');
        $egresosYapePlin = (float)$egresos->where('id_metodo_pago', 1)->sum('monto');
        $totalEgresos = (float)$egresos->sum('monto');

        // 6. Calculate Balances
        $montoInicial = (float)$cajaAbierta->monto_apertura;
        $montoTeoricoEfectivo = $montoInicial + $ingresosEfectivo - $egresosEfectivo;
        $saldoEstimadoTotal = $montoInicial + $totalIngresos - $totalEgresos;

        return response()->json([
            'caja' => $cajaAbierta,
            'requiere_apertura' => false,
            'fecha_desde' => $fechaDesde->toDateTimeString(),
            'fecha_hasta' => $fechaHasta->toDateTimeString(),
            'monto_inicial' => $montoInicial,
            'ingresos_efectivo' => $ingresosEfectivo,
            'ingresos_yape_plin' => $ingresosYapePlin,
            'ingresos_otros' => $ingresosOtros,
            'total_ingresos' => $totalIngresos,
            'egresos_efectivo' => $egresosEfectivo,
            'egresos_yape_plin' => $egresosYapePlin,
            'total_egresos' => $totalEgresos,
            'monto_teorico_efectivo' => $montoTeoricoEfectivo,
            'saldo_estimado' => $saldoEstimadoTotal,
            'egresos' => $egresos,
        ]);
    }

    /**
     * Open Caja with physical cash amount for today.
     */
    public function apertura(Request $request)
    {
        $validated = $request->validate([
            'monto_apertura' => 'required|numeric|min:0',
        ]);

        $cajaExistenteHoy = CajaAperturaCierre::whereDate('datetime_apertura', now()->toDateString())
            ->whereNull('datetime_cierre')
            ->first();

        if ($cajaExistenteHoy) {
            return response()->json(['message' => 'Ya existe una caja abierta para el día de hoy'], 422);
        }

        $caja = CajaAperturaCierre::create([
            'datetime_apertura' => now(),
            'monto_apertura' => (float)$validated['monto_apertura'],
            'id_usuario_apertura' => $request->user()->id,
        ]);

        return response()->json($caja->load('usuarioApertura'), 201);
    }

    /**
     * Close Caja with physical counted cash amount.
     */
    public function cierre(Request $request)
    {
        $validated = $request->validate([
            'monto_cierre' => 'required|numeric|min:0',
        ]);

        $cajaAbierta = CajaAperturaCierre::whereNull('datetime_cierre')->latest('id')->first();
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

    /**
     * Register an expense (Egreso) in the active Caja with optional image receipt.
     */
    public function registrarEgreso(Request $request)
    {
        $validated = $request->validate([
            'descripcion' => 'required|string|max:255',
            'monto' => 'required|numeric|min:0.01',
            'id_metodo_pago' => 'nullable|exists:metodo_pago,id',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
        ]);

        $cajaAbierta = CajaAperturaCierre::whereNull('datetime_cierre')
            ->whereDate('datetime_apertura', now()->toDateString())
            ->first();

        if (!$cajaAbierta) {
            return response()->json([
                'message' => 'Debe aperturar la caja del día de hoy antes de registrar egresos',
                'requiere_apertura' => true
            ], 422);
        }

        $imagePath = null;
        if ($request->hasFile('imagen')) {
            $imagePath = $request->file('imagen')->store('egresos', 'public');
        }

        $egreso = CajaEgreso::create([
            'id_caja' => $cajaAbierta->id,
            'fecha' => now(),
            'descripcion' => $validated['descripcion'],
            'monto' => (float)$validated['monto'],
            'id_metodo_pago' => $validated['id_metodo_pago'] ?? 4, // 4 = Efectivo
            'id_usuario' => $request->user()->id,
            'imagen_path' => $imagePath,
        ]);

        return response()->json($egreso->load(['metodoPago', 'usuario']), 201);
    }
}
