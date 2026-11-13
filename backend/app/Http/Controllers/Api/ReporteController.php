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

    /**
     * Reporte de Clientes Frecuentes
     */
    public function clientesFrecuentes(Request $request)
    {
        $fechaInicio = $request->get('fecha_inicio');
        $fechaFin = $request->get('fecha_fin');
        $ordenPor = $request->get('orden_por', 'visitas'); // 'visitas', 'gastado', 'deuda', 'reciente'
        $search = $request->get('search');
        $limit = (int)$request->get('limit', 50);

        $query = DB::table('clientes as cl')
            ->join('comprobantes as c', function ($join) use ($fechaInicio, $fechaFin) {
                $join->on('cl.id', '=', 'c.cliente_id')
                     ->where('c.activado', 1)
                     ->where('c.estado_comprobante_id', '!=', 3);

                if ($fechaInicio && $fechaFin) {
                    $join->whereBetween(DB::raw('DATE(c.fecha)'), [$fechaInicio, $fechaFin]);
                } elseif ($fechaInicio) {
                    $join->where(DB::raw('DATE(c.fecha)'), '>=', $fechaInicio);
                } elseif ($fechaFin) {
                    $join->where(DB::raw('DATE(c.fecha)'), '<=', $fechaFin);
                }
            });

        if (!empty($search)) {
            $searchLower = '%' . mb_strtolower(trim($search)) . '%';
            $query->where(function ($q) use ($searchLower) {
                $q->where(DB::raw('LOWER(cl.nombres)'), 'LIKE', $searchLower)
                  ->orWhere('cl.dni', 'LIKE', $searchLower)
                  ->orWhere('cl.telefono', 'LIKE', $searchLower);
            });
        }

        $query->select(
            'cl.id',
            'cl.nombres',
            'cl.dni',
            'cl.telefono',
            DB::raw('COUNT(c.id) as total_visitas'),
            DB::raw('COALESCE(SUM(c.costo_total), 0) as total_gastado'),
            DB::raw('COALESCE(SUM(c.monto_abonado), 0) as total_abonado'),
            DB::raw('COALESCE(SUM(CASE WHEN c.estado_comprobante_id IN (1, 2) THEN (c.costo_total - IFNULL(c.monto_abonado, 0)) ELSE 0 END), 0) as deuda_actual'),
            DB::raw('MAX(c.fecha) as ultima_visita'),
            DB::raw('ROUND(AVG(c.costo_total), 2) as ticket_promedio')
        )
        ->groupBy('cl.id', 'cl.nombres', 'cl.dni', 'cl.telefono');

        switch ($ordenPor) {
            case 'gastado':
                $query->orderByDesc('total_gastado')->orderByDesc('total_visitas');
                break;
            case 'deuda':
                $query->orderByDesc('deuda_actual')->orderByDesc('total_gastado');
                break;
            case 'reciente':
                $query->orderByDesc('ultima_visita');
                break;
            case 'visitas':
            default:
                $query->orderByDesc('total_visitas')->orderByDesc('total_gastado');
                break;
        }

        $rawClientes = $query->limit($limit)->get();

        $ranking = 1;
        $clientes = $rawClientes->map(function ($c) use (&$ranking) {
            return [
                'ranking' => $ranking++,
                'id' => $c->id,
                'nombres' => $c->nombres,
                'dni' => $c->dni,
                'telefono' => $c->telefono,
                'total_visitas' => (int)$c->total_visitas,
                'total_gastado' => round((float)$c->total_gastado, 2),
                'total_abonado' => round((float)$c->total_abonado, 2),
                'deuda_actual' => round((float)$c->deuda_actual, 2),
                'ultima_visita' => $c->ultima_visita,
                'ticket_promedio' => round((float)$c->ticket_promedio, 2),
            ];
        });

        // Calculate summary KPI cards
        $totalClientes = $clientes->count();
        $totalVisitasSum = (int)$clientes->sum('total_visitas');
        $totalGastadoSum = round((float)$clientes->sum('total_gastado'), 2);
        $ticketPromedioGeneral = $totalVisitasSum > 0 ? round($totalGastadoSum / $totalVisitasSum, 2) : 0;
        $topCliente = $clientes->first();

        return response()->json([
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'orden_por' => $ordenPor,
            'kpis' => [
                'total_clientes' => $totalClientes,
                'total_visitas' => $totalVisitasSum,
                'total_facturado' => $totalGastadoSum,
                'ticket_promedio' => $ticketPromedioGeneral,
                'top_cliente' => $topCliente,
            ],
            'clientes' => $clientes,
        ]);
    }

    /**
     * Reporte de Ranking de Servicios (Más Vendidos y Todos los Servicios)
     */
    public function rankingServicios(Request $request)
    {
        $fechaInicio = $request->get('fecha_inicio');
        $fechaFin = $request->get('fecha_fin');
        $ordenPor = $request->get('orden_por', 'recaudado'); // 'recaudado', 'solicitado', 'cantidad', 'nombre'
        $tipoServicio = $request->get('tipo_servicio'); // 'k', 'p', 's', or null for all
        $search = $request->get('search');

        $query = DB::table('servicios as s')
            ->leftJoin('comprobantes_detalles as cd', 's.id', '=', 'cd.servicio_id')
            ->leftJoin('comprobantes as c', function ($join) use ($fechaInicio, $fechaFin) {
                $join->on('cd.comprobante_id', '=', 'c.id')
                     ->where('c.activado', 1)
                     ->where('c.estado_comprobante_id', '!=', 3);

                if ($fechaInicio && $fechaFin) {
                    $join->whereBetween(DB::raw('DATE(c.fecha)'), [$fechaInicio, $fechaFin]);
                } elseif ($fechaInicio) {
                    $join->where(DB::raw('DATE(c.fecha)'), '>=', $fechaInicio);
                } elseif ($fechaFin) {
                    $join->where(DB::raw('DATE(c.fecha)'), '<=', $fechaFin);
                }
            });

        if ($tipoServicio && $tipoServicio !== 'all') {
            $query->where('s.tipo_servicio', $tipoServicio);
        }

        if (!empty($search)) {
            $searchLower = '%' . mb_strtolower(trim($search)) . '%';
            $query->where(DB::raw('LOWER(s.nom_servicio)'), 'LIKE', $searchLower);
        }

        $query->select(
            's.id',
            's.nom_servicio',
            's.tipo_servicio',
            's.precio_kilo',
            's.habilitado',
            DB::raw('COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN cd.id ELSE NULL END) as veces_solicitado'),
            DB::raw('COALESCE(SUM(CASE WHEN c.id IS NOT NULL THEN cd.peso_kg ELSE 0 END), 0) as total_cantidad'),
            DB::raw('COALESCE(SUM(CASE WHEN c.id IS NOT NULL THEN (cd.peso_kg * cd.costo_kilo) ELSE 0 END), 0) as total_recaudado')
        )
        ->groupBy('s.id', 's.nom_servicio', 's.tipo_servicio', 's.precio_kilo', 's.habilitado');

        switch ($ordenPor) {
            case 'solicitado':
                $query->orderByDesc('veces_solicitado')->orderByDesc('total_recaudado');
                break;
            case 'cantidad':
                $query->orderByDesc('total_cantidad')->orderByDesc('total_recaudado');
                break;
            case 'nombre':
                $query->orderBy('s.nom_servicio', 'asc');
                break;
            case 'recaudado':
            default:
                $query->orderByDesc('total_recaudado')->orderByDesc('veces_solicitado');
                break;
        }

        $servicios = $query->get();

        $totalRecaudadoGeneral = (float)$servicios->sum('total_recaudado');
        $totalVecesSolicitado = (int)$servicios->sum('veces_solicitado');
        $totalCantidadGeneral = (float)$servicios->sum('total_cantidad');

        $ranking = 1;
        $serviciosFormateados = $servicios->map(function ($s) use ($totalRecaudadoGeneral, &$ranking) {
            $recaudado = (float)$s->total_recaudado;
            $porcentaje = $totalRecaudadoGeneral > 0 ? round(($recaudado / $totalRecaudadoGeneral) * 100, 2) : 0;
            return [
                'ranking' => $ranking++,
                'id' => $s->id,
                'nom_servicio' => $s->nom_servicio,
                'tipo_servicio' => $s->tipo_servicio,
                'precio_kilo' => (float)$s->precio_kilo,
                'habilitado' => (bool)$s->habilitado,
                'veces_solicitado' => (int)$s->veces_solicitado,
                'total_cantidad' => round((float)$s->total_cantidad, 2),
                'total_recaudado' => round($recaudado, 2),
                'porcentaje' => $porcentaje,
            ];
        });

        $servicioMasVendido = $serviciosFormateados->first();

        return response()->json([
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'orden_por' => $ordenPor,
            'tipo_servicio' => $tipoServicio,
            'kpis' => [
                'total_servicios' => $servicios->count(),
                'servicios_activos' => $servicios->where('veces_solicitado', '>', 0)->count(),
                'total_recaudado' => round($totalRecaudadoGeneral, 2),
                'total_pedidos' => $totalVecesSolicitado,
                'total_volumen' => round($totalCantidadGeneral, 2),
                'mas_vendido' => $servicioMasVendido,
            ],
            'servicios' => $serviciosFormateados,
        ]);
    }
}
