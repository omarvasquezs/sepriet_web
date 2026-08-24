<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comprobante;
use App\Models\ComprobanteDetalle;
use App\Models\ReporteIngreso;
use App\Models\EstadoComprobante;
use App\Models\EstadoRopa;
use App\Models\MetodoPago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ComprobanteController extends Controller
{
    public function index(Request $request)
    {
        $query = Comprobante::with(['cliente', 'estado', 'usuario', 'detalles.servicio']);

        if ($request->has('estado_id') && $request->estado_id != '') {
            $query->where('estado_id', $request->estado_id);
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('cod_comprobante', 'like', "%{$search}%")
                  ->orWhereHas('cliente', function ($qc) use ($search) {
                      $qc->where('nombres', 'like', "%{$search}%")
                         ->orWhere('dni', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('recogido')) {
            if ($request->recogido == 'true') {
                $query->whereHas('estado', fn($q) => $q->where('nombre', 'Entregado'));
            } else {
                $query->whereHas('estado', fn($q) => $q->where('nombre', '!=', 'Entregado'));
            }
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => 'required|exists:clientes,id',
            'fecha_entrega' => 'nullable|date',
            'descuento' => 'nullable|numeric|min:0',
            'monto_abonado' => 'required|numeric|min:0',
            'metodo_pago_id' => 'required|exists:metodo_pago,id',
            'observaciones' => 'nullable|string',
            'detalles' => 'required|array|min:1',
            'detalles.*.servicio_id' => 'required|exists:servicios,id',
            'detalles.*.peso_kg' => 'nullable|numeric|min:0',
            'detalles.*.costo_kilo' => 'nullable|numeric|min:0',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
            'detalles.*.estado_ropa_id' => 'nullable|exists:estado_ropa,id',
            'detalles.*.observaciones' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            // Generate ticket code: TICK-000001
            $lastId = Comprobante::max('id') ?? 0;
            $codComprobante = 'TICK-' . str_pad($lastId + 1, 6, '0', STR_PAD_LEFT);

            // Calculate totals
            $costoTotal = 0;
            foreach ($validated['detalles'] as $det) {
                if (($det['peso_kg'] ?? 0) > 0 && ($det['costo_kilo'] ?? 0) > 0) {
                    $costoTotal += $det['peso_kg'] * $det['costo_kilo'];
                } else {
                    $costoTotal += $det['cantidad'] * $det['precio_unitario'];
                }
            }

            $descuento = $validated['descuento'] ?? 0;
            $totalFinal = max(0, $costoTotal - $descuento);
            $montoAbonado = min($totalFinal, $validated['monto_abonado']);
            $montoRestante = max(0, $totalFinal - $montoAbonado);

            // Default initial state: Pendiente (or En Proceso if paid)
            $estadoPendiente = EstadoComprobante::where('nombre', 'Pendiente')->first();

            $comprobante = Comprobante::create([
                'cod_comprobante' => $codComprobante,
                'cliente_id' => $validated['cliente_id'],
                'fecha' => now(),
                'fecha_entrega' => $validated['fecha_entrega'] ?? null,
                'costo_total' => $totalFinal,
                'monto_abonado' => $montoAbonado,
                'monto_restante' => $montoRestante,
                'descuento' => $descuento,
                'estado_id' => $estadoPendiente->id,
                'observaciones' => $validated['observaciones'] ?? null,
                'user_id' => $request->user()->id,
            ]);

            // Save details
            foreach ($validated['detalles'] as $det) {
                $subtotal = (($det['peso_kg'] ?? 0) > 0 && ($det['costo_kilo'] ?? 0) > 0)
                    ? ($det['peso_kg'] * $det['costo_kilo'])
                    : ($det['cantidad'] * $det['precio_unitario']);

                ComprobanteDetalle::create([
                    'comprobante_id' => $comprobante->id,
                    'servicio_id' => $det['servicio_id'],
                    'peso_kg' => $det['peso_kg'] ?? null,
                    'costo_kilo' => $det['costo_kilo'] ?? null,
                    'cantidad' => $det['cantidad'],
                    'precio_unitario' => $det['precio_unitario'],
                    'subtotal' => $subtotal,
                    'estado_ropa_id' => $det['estado_ropa_id'] ?? null,
                    'observaciones' => $det['observaciones'] ?? null,
                ]);
            }

            // Register deposit if initial payment > 0
            if ($montoAbonado > 0) {
                ReporteIngreso::create([
                    'cod_comprobante' => $codComprobante,
                    'cliente_id' => $validated['cliente_id'],
                    'metodo_pago_id' => $validated['metodo_pago_id'],
                    'fecha' => now(),
                    'monto_abonado' => $montoAbonado,
                    'costo_total' => $totalFinal,
                    'descuento' => $descuento,
                    'user_id' => $request->user()->id,
                ]);
            }

            return response()->json($comprobante->load(['cliente', 'estado', 'detalles.servicio', 'ingresos.metodoPago']), 201);
        });
    }

    public function show($id)
    {
        $comprobante = Comprobante::with(['cliente', 'estado', 'usuario', 'detalles.servicio', 'detalles.estadoRopa', 'ingresos.metodoPago'])
            ->findOrFail($id);

        return response()->json($comprobante);
    }

    public function abono(Request $request, $id)
    {
        $validated = $request->validate([
            'monto_abonado' => 'required|numeric|min:0.01',
            'metodo_pago_id' => 'required|exists:metodo_pago,id',
        ]);

        return DB::transaction(function () use ($request, $id, $validated) {
            $comprobante = Comprobante::findOrFail($id);

            $nuevoAbono = min($comprobante->monto_restante, $validated['monto_abonado']);
            $comprobante->monto_abonado += $nuevoAbono;
            $comprobante->monto_restante = max(0, $comprobante->costo_total - $comprobante->monto_abonado);
            $comprobante->save();

            ReporteIngreso::create([
                'cod_comprobante' => $comprobante->cod_comprobante,
                'cliente_id' => $comprobante->cliente_id,
                'metodo_pago_id' => $validated['metodo_pago_id'],
                'fecha' => now(),
                'monto_abonado' => $nuevoAbono,
                'costo_total' => $comprobante->costo_total,
                'descuento' => $comprobante->descuento,
                'user_id' => $request->user()->id,
            ]);

            return response()->json($comprobante->load(['cliente', 'estado', 'ingresos.metodoPago']));
        });
    }

    public function cambiarEstado(Request $request, $id)
    {
        $validated = $request->validate([
            'estado_id' => 'required|exists:estado_comprobantes,id',
        ]);

        $comprobante = Comprobante::findOrFail($id);
        $comprobante->estado_id = $validated['estado_id'];
        $comprobante->save();

        return response()->json($comprobante->load(['cliente', 'estado']));
    }

    public function catalogos()
    {
        return response()->json([
            'estados' => EstadoComprobante::all(),
            'estados_ropa' => EstadoRopa::all(),
            'metodos_pago' => MetodoPago::all(),
        ]);
    }
}
