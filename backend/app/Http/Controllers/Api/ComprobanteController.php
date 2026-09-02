<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comprobante;
use App\Models\ComprobanteDetalle;
use App\Models\ComprobanteCounter;
use App\Models\ReporteIngreso;
use App\Models\EstadoComprobante;
use App\Models\EstadoRopa;
use App\Models\MetodoPago;
use App\Models\Local;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ComprobanteController extends Controller
{
    public function index(Request $request)
    {
        $query = Comprobante::with([
            'cliente',
            'estadoComprobante',
            'estadoRopa',
            'metodoPago',
            'usuario',
            'detalles.servicio'
        ]);

        if ($request->filled('estado_comprobante_id')) {
            $query->where('estado_comprobante_id', $request->estado_comprobante_id);
        }

        if ($request->filled('estado_ropa_id')) {
            $query->where('estado_ropa_id', $request->estado_ropa_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('cod_comprobante', 'like', "%{$search}%")
                  ->orWhereHas('cliente', function ($qc) use ($search) {
                      $qc->where('nombres', 'like', "%{$search}%")
                         ->orWhere('dni', 'like', "%{$search}%")
                         ->orWhere('telefono', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = (int)$request->get('per_page', 50);
        return response()->json($query->orderBy('id', 'desc')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo_comprobante' => 'required|in:B,F,N',
            'cliente_id' => 'required|exists:clientes,id',
            'metodo_pago_id' => 'required|exists:metodo_pago,id',
            'descuento' => 'nullable|numeric|min:0',
            'monto_abonado' => 'required|numeric|min:0',
            'observaciones' => 'nullable|string',
            'num_ruc' => 'nullable|numeric',
            'razon_social' => 'nullable|string|max:256',
            'fecha_operacion' => 'nullable|date',
            'detalles' => 'required|array|min:1',
            'detalles.*.servicio_id' => 'required|exists:servicios,id',
            'detalles.*.peso_kg' => 'required|numeric|min:0.01',
            'detalles.*.costo_kilo' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $tipo = $validated['tipo_comprobante'];
            $user = $request->user();
            $isAdmin = ($user->role_id === 1) || ($user->role && strcasecmp($user->role->nom_rol ?? $user->role->role_name ?? '', 'admin') === 0);
            $fechaOperacion = ($isAdmin && !empty($validated['fecha_operacion']))
                ? \Carbon\Carbon::parse($validated['fecha_operacion'])
                : now();

            // Generate code using comprobante_counter
            $counter = ComprobanteCounter::lockForUpdate()->find($tipo);
            if (!$counter) {
                $counter = ComprobanteCounter::create([
                    'tipo_comprobante' => $tipo,
                    'last_value' => 0
                ]);
            }

            $newValue = $counter->last_value + 1;
            $counter->last_value = $newValue;
            $counter->save();

            $prefix = match ($tipo) {
                'B' => 'BV001-',
                'F' => 'FV001-',
                default => 'NV001-',
            };
            $codComprobante = $prefix . $newValue;

            // Calculate totals
            $costoTotal = 0;
            foreach ($validated['detalles'] as $det) {
                $costoTotal += (float)$det['peso_kg'] * (float)$det['costo_kilo'];
            }

            $descuento = (float)($validated['descuento'] ?? 0);
            $totalFinal = max(0, $costoTotal - $descuento);
            $montoAbonado = min($totalFinal, (float)$validated['monto_abonado']);

            // Determine payment state: 1=DEBE, 2=ABONO, 4=CANCELADO
            if ($montoAbonado >= $totalFinal && $totalFinal > 0) {
                $estadoComprobanteId = 4; // CANCELADO
            } elseif ($montoAbonado > 0) {
                $estadoComprobanteId = 2; // ABONO
            } else {
                $estadoComprobanteId = 1; // DEBE
            }

            $defaultLocal = Local::first();

            $comprobante = Comprobante::create([
                'tipo_comprobante' => $tipo,
                'cliente_id' => $validated['cliente_id'],
                'user_id' => $request->user()->id,
                'fecha' => $fechaOperacion,
                'fecha_actualizacion' => now(),
                'metodo_pago_id' => $validated['metodo_pago_id'],
                'num_ruc' => $validated['num_ruc'] ?? null,
                'razon_social' => $validated['razon_social'] ?? null,
                'estado_comprobante_id' => $estadoComprobanteId,
                'estado_ropa_id' => 1, // RECIBIDO
                'local_id' => $defaultLocal ? $defaultLocal->id : 5,
                'observaciones' => $validated['observaciones'] ?? null,
                'monto_abonado' => $montoAbonado,
                'last_updated_by' => $request->user()->id,
                'cod_comprobante' => $codComprobante,
                'descuento' => $descuento,
                'costo_total' => $totalFinal,
                'activado' => 1,
                'fecha_actualizacion_estado_comprobante' => ($estadoComprobanteId === 4) ? $fechaOperacion : null,
                'fecha_actualizacion_estado_ropa' => null,
            ]);

            // Save details
            foreach ($validated['detalles'] as $det) {
                ComprobanteDetalle::create([
                    'comprobante_id' => $comprobante->id,
                    'servicio_id' => $det['servicio_id'],
                    'peso_kg' => $det['peso_kg'],
                    'costo_kilo' => $det['costo_kilo'],
                ]);
            }

            // Register deposit if initial payment > 0
            if ($montoAbonado > 0) {
                ReporteIngreso::create([
                    'cod_comprobante' => $codComprobante,
                    'cliente_id' => $validated['cliente_id'],
                    'metodo_pago_id' => $validated['metodo_pago_id'],
                    'fecha' => $fechaOperacion,
                    'monto_abonado' => $montoAbonado,
                    'descuento' => $descuento,
                    'costo_total' => $totalFinal,
                    'user_id' => $request->user()->id,
                ]);
            }

            return response()->json($comprobante->load([
                'cliente',
                'estadoComprobante',
                'estadoRopa',
                'metodoPago',
                'detalles.servicio',
                'ingresos.metodoPago'
            ]), 201);
        });
    }

    public function show($id)
    {
        $comprobante = Comprobante::with([
            'cliente',
            'estadoComprobante',
            'estadoRopa',
            'metodoPago',
            'usuario',
            'detalles.servicio',
            'ingresos.metodoPago'
        ])->findOrFail($id);

        return response()->json($comprobante);
    }

    public function abono(Request $request, $id)
    {
        $validated = $request->validate([
            'monto_abonado' => 'required|numeric|min:0.01',
            'metodo_pago_id' => 'required|exists:metodo_pago,id',
            'fecha_operacion' => 'nullable|date',
        ]);

        return DB::transaction(function () use ($request, $id, $validated) {
            $comprobante = Comprobante::findOrFail($id);
            $user = $request->user();
            $isAdmin = ($user->role_id === 1) || ($user->role && strcasecmp($user->role->nom_rol ?? $user->role->role_name ?? '', 'admin') === 0);
            $fechaOperacion = ($isAdmin && !empty($validated['fecha_operacion']))
                ? \Carbon\Carbon::parse($validated['fecha_operacion'])
                : now();

            $montoRestante = max(0, $comprobante->costo_total - $comprobante->monto_abonado);
            $nuevoAbono = min($montoRestante, (float)$validated['monto_abonado']);

            $comprobante->monto_abonado += $nuevoAbono;
            $comprobante->metodo_pago_id = $validated['metodo_pago_id'];
            $comprobante->last_updated_by = $request->user()->id;
            $comprobante->fecha_actualizacion = now();

            // Update payment state
            if ($comprobante->monto_abonado >= $comprobante->costo_total) {
                $comprobante->estado_comprobante_id = 4; // CANCELADO
                $comprobante->fecha_actualizacion_estado_comprobante = $fechaOperacion;
            } else {
                $comprobante->estado_comprobante_id = 2; // ABONO
            }
            $comprobante->save();

            ReporteIngreso::create([
                'cod_comprobante' => $comprobante->cod_comprobante,
                'cliente_id' => $comprobante->cliente_id,
                'metodo_pago_id' => $validated['metodo_pago_id'],
                'fecha' => $fechaOperacion,
                'monto_abonado' => $nuevoAbono,
                'descuento' => $comprobante->descuento ?? 0,
                'costo_total' => $comprobante->costo_total,
                'user_id' => $request->user()->id,
            ]);

            return response()->json($comprobante->load([
                'cliente',
                'estadoComprobante',
                'estadoRopa',
                'metodoPago',
                'ingresos.metodoPago'
            ]));
        });
    }

    public function cambiarEstado(Request $request, $id)
    {
        $validated = $request->validate([
            'estado_comprobante_id' => 'nullable|exists:estado_comprobantes,id',
            'estado_ropa_id' => 'nullable|exists:estado_ropa,id',
            'fecha_operacion' => 'nullable|date',
        ]);

        $comprobante = Comprobante::findOrFail($id);
        $user = $request->user();
        $isAdmin = ($user->role_id === 1) || ($user->role && strcasecmp($user->role->nom_rol ?? $user->role->role_name ?? '', 'admin') === 0);
        $fechaOperacion = ($isAdmin && !empty($validated['fecha_operacion']))
            ? \Carbon\Carbon::parse($validated['fecha_operacion'])
            : now();

        if (!empty($validated['estado_comprobante_id'])) {
            $nuevoEstadoComp = (int)$validated['estado_comprobante_id'];
            if ($nuevoEstadoComp !== (int)$comprobante->estado_comprobante_id && $nuevoEstadoComp === 4) {
                $comprobante->fecha_actualizacion_estado_comprobante = $fechaOperacion;
            }
            $comprobante->estado_comprobante_id = $nuevoEstadoComp;
        }

        if (!empty($validated['estado_ropa_id'])) {
            $nuevoEstadoRopa = (int)$validated['estado_ropa_id'];
            if ($nuevoEstadoRopa !== (int)$comprobante->estado_ropa_id && $nuevoEstadoRopa === 4) {
                $comprobante->fecha_actualizacion_estado_ropa = $fechaOperacion;
            }
            $comprobante->estado_ropa_id = $nuevoEstadoRopa;
        }

        $comprobante->last_updated_by = $request->user()->id;
        $comprobante->fecha_actualizacion = now();
        $comprobante->save();

        return response()->json($comprobante->load([
            'cliente',
            'estadoComprobante',
            'estadoRopa'
        ]));
    }

    public function catalogos()
    {
        return response()->json([
            'estados_pago' => EstadoComprobante::where('habilitado', 1)->get(),
            'estados_ropa' => EstadoRopa::all(),
            'metodos_pago' => MetodoPago::where('habilitado', 1)->get(),
            'locales' => Local::where('habilitado', 1)->get(),
        ]);
    }
}
