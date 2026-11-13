import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Filter,
  TrendingUp,
  Sparkles,
  Award,
  Flame,
  Search,
  Phone,
  ArrowUpDown,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';

export interface ReportesPageProps {
  initialTab?: 'financiero' | 'trabajo' | 'clientes' | 'servicios';
  onNavigateToComprobantesCliente?: (clienteName: string) => void;
}

export const ReportesPage: React.FC<ReportesPageProps> = ({
  initialTab = 'financiero',
  onNavigateToComprobantesCliente,
}) => {
  const [activeTab, setActiveTab] = useState<'financiero' | 'trabajo' | 'clientes' | 'servicios'>(initialTab);

  // Sync initialTab when navigated from menu
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Date filters
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [datePreset, setDatePreset] = useState<'mes_actual' | 'mes_anterior' | 'hoy' | '30_dias' | 'todo' | 'custom'>('mes_actual');

  // Clientes Frecuentes filters
  const [ordenClientes, setOrdenClientes] = useState<'visitas' | 'gastado' | 'deuda' | 'reciente'>('visitas');
  const [searchClientes, setSearchClientes] = useState('');

  // Ranking de Servicios filters
  const [ordenServicios, setOrdenServicios] = useState<'recaudado' | 'solicitado' | 'cantidad' | 'nombre'>('recaudado');
  const [tipoServicio, setTipoServicio] = useState<'all' | 'k' | 'p' | 's'>('all');
  const [searchServicios, setSearchServicios] = useState('');

  // Data states
  const [reporteFinanciero, setReporteFinanciero] = useState<any>(null);
  const [reporteTrabajo, setReporteTrabajo] = useState<any>(null);
  const [reporteClientes, setReporteClientes] = useState<any>(null);
  const [reporteServicios, setReporteServicios] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quick Date Presets Handler
  const handleApplyPreset = (preset: 'mes_actual' | 'mes_anterior' | 'hoy' | '30_dias' | 'todo') => {
    setDatePreset(preset);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'mes_actual') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setFechaInicio(toYMD(first));
      setFechaFin(toYMD(now));
    } else if (preset === 'mes_anterior') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setFechaInicio(toYMD(first));
      setFechaFin(toYMD(last));
    } else if (preset === 'hoy') {
      setFechaInicio(toYMD(now));
      setFechaFin(toYMD(now));
    } else if (preset === '30_dias') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setFechaInicio(toYMD(past));
      setFechaFin(toYMD(now));
    } else if (preset === 'todo') {
      setFechaInicio('');
      setFechaFin('');
    }
  };

  const fetchReporte = async () => {
    setLoading(true);
    try {
      if (activeTab === 'financiero') {
        const res = await api.get('/reportes/financiero', {
          params: { fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined }
        });
        setReporteFinanciero(res.data);
      } else if (activeTab === 'trabajo') {
        const res = await api.get('/reportes/trabajo', {
          params: { fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined }
        });
        setReporteTrabajo(res.data);
      } else if (activeTab === 'clientes') {
        const res = await api.get('/reportes/clientes-frecuentes', {
          params: {
            fecha_inicio: fechaInicio || undefined,
            fecha_fin: fechaFin || undefined,
            orden_por: ordenClientes,
            search: searchClientes || undefined,
            limit: 100
          }
        });
        setReporteClientes(res.data);
      } else if (activeTab === 'servicios') {
        const res = await api.get('/reportes/ranking-servicios', {
          params: {
            fecha_inicio: fechaInicio || undefined,
            fecha_fin: fechaFin || undefined,
            orden_por: ordenServicios,
            tipo_servicio: tipoServicio,
            search: searchServicios || undefined,
          }
        });
        setReporteServicios(res.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
  }, [activeTab, ordenClientes, ordenServicios, tipoServicio]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReporte();
  };

  return (
    <div className="page-container">
      {/* Header & Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
          Reportes y Estadísticas de Negocio
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Control financiero, carga operativa, ranking de clientes frecuentes y análisis de los servicios más vendidos.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('financiero')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 700,
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'financiero' ? '3px solid var(--primary-color)' : '3px solid transparent',
            color: activeTab === 'financiero' ? 'var(--primary-color)' : '#64748b',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <TrendingUp size={17} />
          Reporte Financiero
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trabajo')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 700,
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'trabajo' ? '3px solid var(--primary-color)' : '3px solid transparent',
            color: activeTab === 'trabajo' ? 'var(--primary-color)' : '#64748b',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={17} />
          Carga de Trabajo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('clientes')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 700,
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'clientes' ? '3px solid #8b5cf6' : '3px solid transparent',
            color: activeTab === 'clientes' ? '#7c3aed' : '#64748b',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Award size={17} color={activeTab === 'clientes' ? '#7c3aed' : '#64748b'} />
          Clientes Frecuentes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('servicios')}
          style={{
            padding: '10px 18px',
            fontSize: '0.92rem',
            fontWeight: 700,
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'servicios' ? '3px solid #f97316' : '3px solid transparent',
            color: activeTab === 'servicios' ? '#ea580c' : '#64748b',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Flame size={17} color={activeTab === 'servicios' ? '#ea580c' : '#64748b'} />
          Ranking de Servicios (Más Vendidos)
        </button>
      </div>

      {/* Date Filter Bar & Presets */}
      <form onSubmit={handleFilterSubmit} className="glass-panel" style={{ padding: '14px 18px', marginBottom: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="var(--primary-color)" />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>Desde:</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.84rem', width: 'auto' }}
                value={fechaInicio}
                onChange={(e) => { setFechaInicio(e.target.value); setDatePreset('custom'); }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#475569' }}>Hasta:</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.84rem', width: 'auto' }}
                value={fechaFin}
                onChange={(e) => { setFechaFin(e.target.value); setDatePreset('custom'); }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.84rem' }}>
              <Filter size={15} /> Filtrar
            </button>
          </div>

          {/* Quick Presets Pills */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>Período:</span>
            {[
              { id: 'mes_actual', label: 'Este Mes' },
              { id: 'mes_anterior', label: 'Mes Pasado' },
              { id: 'hoy', label: 'Hoy' },
              { id: '30_dias', label: 'Últimos 30 días' },
              { id: 'todo', label: 'Todo el tiempo' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  handleApplyPreset(p.id as any);
                  setTimeout(fetchReporte, 50);
                }}
                style={{
                  padding: '3px 9px',
                  borderRadius: '16px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  background: datePreset === p.id ? '#4f46e5' : '#f8fafc',
                  color: datePreset === p.id ? '#ffffff' : '#475569',
                  borderColor: datePreset === p.id ? '#4f46e5' : '#cbd5e1',
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Loading indicator */}
      {loading ? (
        <LoadingSpinner text={
          activeTab === 'financiero'
            ? 'Generando balance financiero...'
            : activeTab === 'trabajo'
            ? 'Consultando carga de trabajo...'
            : activeTab === 'clientes'
            ? 'Analizando clientes frecuentes...'
            : 'Calculando ranking de servicios más vendidos...'
        } />
      ) : activeTab === 'financiero' ? (
        /* ================= VISTA 1: REPORTE FINANCIERO ================= */
        !reporteFinanciero ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay información para mostrar.</p>
        ) : (
          <div>
            {/* KPI Cards */}
            <div className="grid-responsive-3" style={{ marginBottom: '24px' }}>
              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Ingresos</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                  S/ {Number(reporteFinanciero.total_ingresos || 0).toFixed(2)}
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Egresos</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
                  S/ {Number(reporteFinanciero.total_egresos || 0).toFixed(2)}
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '18px', borderColor: '#c7d2fe' }}>
                <span style={{ color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700 }}>Ganancia Neta</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5', marginTop: '6px' }}>
                  S/ {Number(reporteFinanciero.ganancia_neta || 0).toFixed(2)}
                </h3>
              </div>
            </div>

            {/* Methods Breakdown */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
              Ingresos por Método de Pago
            </h3>
            <div className="grid-responsive-4" style={{ marginBottom: '28px' }}>
              {reporteFinanciero.por_metodo_pago?.map((mp: any) => (
                <div key={mp.metodo_pago_id} className="glass-card" style={{ padding: '14px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {String(mp.metodo_pago?.nom_metodo_pago || 'OTROS').toUpperCase()}
                  </span>
                  <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    S/ {Number(mp.total).toFixed(2)}
                  </h4>
                </div>
              ))}
            </div>

            {/* Transactions Detail */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
              Detalle de Ingresos del Período
            </h3>
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Comprobante</th>
                      <th>Cliente</th>
                      <th>Método Pago</th>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th>Abonado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteFinanciero.listado_ingresos?.map((t: any) => (
                      <tr key={t.id} className="row-item">
                        <td style={{ fontWeight: 700, color: '#4f46e5' }}>{t.cod_comprobante}</td>
                        <td>{t.cliente?.nombres || 'Cliente'}</td>
                        <td>{String(t.metodo_pago?.nom_metodo_pago || 'EFECTIVO').toUpperCase()}</td>
                        <td>{new Date(t.fecha).toLocaleDateString('es-PE')}</td>
                        <td style={{ fontWeight: 700 }}>S/ {Number(t.costo_total || 0).toFixed(2)}</td>
                        <td style={{ color: '#059669', fontWeight: 700 }}>S/ {Number(t.monto_abonado).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : activeTab === 'trabajo' ? (
        /* ================= VISTA 2: CARGA DE TRABAJO ================= */
        !reporteTrabajo ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos de carga de trabajo.</p>
        ) : (
          <div>
            <div className="grid-responsive-3" style={{ marginBottom: '24px' }}>
              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Comprobantes / Tickets</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
                  {reporteTrabajo.total_tickets || 0}
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Monto Total Facturado</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                  S/ {Number(reporteTrabajo.total_monto || 0).toFixed(2)}
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Promedio por Ticket</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5', marginTop: '6px' }}>
                  S/ {reporteTrabajo.total_tickets > 0 ? (reporteTrabajo.total_monto / reporteTrabajo.total_tickets).toFixed(2) : '0.00'}
                </h3>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
              Listado de Comprobantes del Período
            </h3>
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Estado Ropa</th>
                      <th>Estado Pago</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Abonado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteTrabajo.tickets?.map((t: any) => (
                      <tr key={t.id} className="row-item">
                        <td style={{ fontWeight: 700, color: '#4f46e5' }}>{t.cod_comprobante}</td>
                        <td style={{ fontWeight: 600 }}>{t.cliente?.nombres || 'Cliente'}</td>
                        <td>{new Date(t.fecha).toLocaleDateString('es-PE')}</td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: t.estado_ropa_id === 4 ? '#dcfce7' : (t.estado_ropa_id === 3 ? '#e0f2fe' : '#fef3c7'),
                            color: t.estado_ropa_id === 4 ? '#15803d' : (t.estado_ropa_id === 3 ? '#0369a1' : '#b45309'),
                          }}>
                            {t.estado_ropa?.nom_estado || 'Pendiente'}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: t.estado_comprobante_id === 4 ? '#dcfce7' : '#fee2e2',
                            color: t.estado_comprobante_id === 4 ? '#15803d' : '#b91c1c',
                          }}>
                            {t.estado_comprobante?.nom_estado || 'DEBE'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>S/ {Number(t.costo_total || 0).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', color: '#059669', fontWeight: 700 }}>S/ {Number(t.monto_abonado || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : activeTab === 'clientes' ? (
        /* ================= VISTA 3: CLIENTES FRECUENTES ================= */
        !reporteClientes ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos de clientes frecuentes.</p>
        ) : (
          <div>
            {/* KPI Cards */}
            <div className="grid-responsive-4" style={{ marginBottom: '24px' }}>
              <div className="glass-card" style={{ padding: '18px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)', borderColor: '#ddd6fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="#7c3aed" />
                  <span style={{ color: '#6d28d9', fontSize: '0.82rem', fontWeight: 700 }}>Cliente Más Frecuente</span>
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e1b4b', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={reporteClientes.kpis?.top_cliente?.nombres || 'N/A'}>
                  {reporteClientes.kpis?.top_cliente?.nombres || 'Ninguno'}
                </h4>
                <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600, marginTop: '4px' }}>
                  {reporteClientes.kpis?.top_cliente?.total_visitas || 0} visitas • S/ {Number(reporteClientes.kpis?.top_cliente?.total_gastado || 0).toFixed(2)}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Total Clientes en Período</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
                  {reporteClientes.kpis?.total_clientes || 0}
                </h3>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Con al menos un comprobante activo</div>
              </div>

              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Total Visitas / Tickets</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                  {reporteClientes.kpis?.total_visitas || 0}
                </h3>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Servicios registrados</div>
              </div>

              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Ticket Promedio General</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed', marginTop: '6px' }}>
                  S/ {Number(reporteClientes.kpis?.ticket_promedio || 0).toFixed(2)}
                </h3>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Gasto medio por visita</div>
              </div>
            </div>

            {/* Sub-Filters: Sort & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUpDown size={15} /> Ordenar por:
                </span>
                <select
                  className="form-input"
                  style={{ padding: '5px 10px', fontSize: '0.84rem', width: 'auto' }}
                  value={ordenClientes}
                  onChange={(e) => setOrdenClientes(e.target.value as any)}
                >
                  <option value="visitas">Más Frecuentes (Mayor número de visitas)</option>
                  <option value="gastado">Mayor Facturación / Gasto (S/.)</option>
                  <option value="deuda">Mayor Deuda Pendiente (S/.)</option>
                  <option value="reciente">Última Visita Más Reciente</option>
                </select>
              </div>

              <div style={{ position: 'relative', minWidth: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px', paddingRight: '10px', fontSize: '0.84rem', width: '100%' }}
                  placeholder="Buscar por cliente, DNI o celular..."
                  value={searchClientes}
                  onChange={(e) => setSearchClientes(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchReporte(); }}
                />
              </div>
            </div>

            {/* Clientes Table */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                      <th>Cliente</th>
                      <th>Contacto</th>
                      <th style={{ textAlign: 'center' }}>Visitas / Tickets</th>
                      <th style={{ textAlign: 'right' }}>Total Facturado</th>
                      <th style={{ textAlign: 'right' }}>Total Abonado</th>
                      <th style={{ textAlign: 'right' }}>Deuda Pendiente</th>
                      <th style={{ textAlign: 'right' }}>Promedio / Visita</th>
                      <th>Última Visita</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteClientes.clientes?.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          No se encontraron clientes con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      reporteClientes.clientes?.map((c: any) => {
                        const isTop3 = c.ranking <= 3;
                        const medal = c.ranking === 1 ? '🥇' : c.ranking === 2 ? '🥈' : c.ranking === 3 ? '🥉' : null;
                        const tieneDeuda = Number(c.deuda_actual || 0) > 0;

                        return (
                          <tr key={c.id} className="row-item">
                            <td style={{ textAlign: 'center', fontWeight: 800, fontSize: isTop3 ? '1.05rem' : '0.85rem' }}>
                              {medal ? <span>{medal}</span> : <span style={{ color: '#64748b' }}>#{c.ranking}</span>}
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.nombres}</div>
                              {c.dni && <div style={{ fontSize: '0.74rem', color: '#64748b' }}>DNI: {c.dni}</div>}
                            </td>
                            <td>
                              {c.telefono ? (
                                <a
                                  href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: '#15803d',
                                    textDecoration: 'none'
                                  }}
                                  title="Enviar mensaje por WhatsApp"
                                >
                                  <Phone size={13} /> {c.telefono}
                                </a>
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sin teléfono</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                background: '#ede9fe',
                                color: '#6d28d9',
                                fontWeight: 800,
                                fontSize: '0.84rem'
                              }}>
                                {c.total_visitas}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              S/ {Number(c.total_gastado || 0).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                              S/ {Number(c.total_abonado || 0).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {tieneDeuda ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  fontWeight: 800,
                                  fontSize: '0.8rem'
                                }}>
                                  <AlertCircle size={13} /> S/ {Number(c.deuda_actual).toFixed(2)}
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  fontWeight: 700,
                                  fontSize: '0.78rem'
                                }}>
                                  <CheckCircle size={13} /> Al Día
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                              S/ {Number(c.ticket_promedio || 0).toFixed(2)}
                            </td>
                            <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                              {c.ultima_visita ? new Date(c.ultima_visita).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {onNavigateToComprobantesCliente && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ padding: '3px 8px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => onNavigateToComprobantesCliente(c.nombres)}
                                  title="Ver tickets de este cliente"
                                >
                                  <ExternalLink size={12} /> Tickets
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ================= VISTA 4: RANKING DE SERVICIOS (MÁS VENDIDOS) ================= */
        !reporteServicios ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos de ranking de servicios.</p>
        ) : (
          <div>
            {/* KPI Cards */}
            <div className="grid-responsive-4" style={{ marginBottom: '24px' }}>
              <div className="glass-card" style={{ padding: '18px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)', borderColor: '#fed7aa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={18} color="#ea580c" />
                  <span style={{ color: '#c2410c', fontSize: '0.82rem', fontWeight: 700 }}>Servicio Más Vendido</span>
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c2d12', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={reporteServicios.kpis?.mas_vendido?.nom_servicio || 'N/A'}>
                  {reporteServicios.kpis?.mas_vendido?.nom_servicio || 'Ninguno'}
                </h4>
                <div style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 600, marginTop: '4px' }}>
                  {reporteServicios.kpis?.mas_vendido?.veces_solicitado || 0} pedidos • S/ {Number(reporteServicios.kpis?.mas_vendido?.total_recaudado || 0).toFixed(2)} ({reporteServicios.kpis?.mas_vendido?.porcentaje || 0}%)
                </div>
              </div>

              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Total Recaudado por Servicios</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                  S/ {Number(reporteServicios.kpis?.total_recaudado || 0).toFixed(2)}
                </h3>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>En el período seleccionado</div>
              </div>

              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Total Pedidos / Tickets</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
                  {reporteServicios.kpis?.total_pedidos || 0}
                </h3>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Veces que se incluyeron en comprobantes</div>
              </div>

              <div className="glass-card" style={{ padding: '18px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>Volumen Total Procesado</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed', marginTop: '6px' }}>
                  {Number(reporteServicios.kpis?.total_volumen || 0).toFixed(1)}
                </h3>
                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Kilos o prendas procesadas</div>
              </div>
            </div>

            {/* Sub-Filters: Tipo, Sort & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Tipo filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Tipo:</span>
                  <select
                    className="form-input"
                    style={{ padding: '5px 10px', fontSize: '0.84rem', width: 'auto' }}
                    value={tipoServicio}
                    onChange={(e) => setTipoServicio(e.target.value as any)}
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="k">Por Kilo (k)</option>
                    <option value="p">Por Prenda (p)</option>
                    <option value="s">Servicios Especiales (s)</option>
                  </select>
                </div>

                {/* Sort order */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowUpDown size={14} /> Ordenar:
                  </span>
                  <select
                    className="form-input"
                    style={{ padding: '5px 10px', fontSize: '0.84rem', width: 'auto' }}
                    value={ordenServicios}
                    onChange={(e) => setOrdenServicios(e.target.value as any)}
                  >
                    <option value="recaudado">Mayor Recaudación (S/.)</option>
                    <option value="solicitado">Más Solicitados (Veces)</option>
                    <option value="cantidad">Mayor Volumen (Kilos / Unid)</option>
                    <option value="nombre">Alfabético (A - Z)</option>
                  </select>
                </div>
              </div>

              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px', paddingRight: '10px', fontSize: '0.84rem', width: '100%' }}
                  placeholder="Buscar servicio..."
                  value={searchServicios}
                  onChange={(e) => setSearchServicios(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchReporte(); }}
                />
              </div>
            </div>

            {/* Servicios Ranking Table */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                      <th>Servicio</th>
                      <th>Tipo</th>
                      <th style={{ textAlign: 'right' }}>Tarifa Base</th>
                      <th style={{ textAlign: 'center' }}>Veces Solicitado</th>
                      <th style={{ textAlign: 'right' }}>Volumen (Kg / Unid)</th>
                      <th style={{ textAlign: 'right' }}>Total Recaudado</th>
                      <th style={{ width: '220px' }}>% Participación de Ventas</th>
                      <th style={{ textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteServicios.servicios?.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          No se encontraron servicios con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      reporteServicios.servicios?.map((s: any) => {
                        const isTop3 = s.ranking <= 3 && s.total_recaudado > 0;
                        const medal = s.ranking === 1 ? '🥇' : s.ranking === 2 ? '🥈' : s.ranking === 3 ? '🥉' : null;
                        const tipoLabel = s.tipo_servicio === 'k' ? 'Kilo' : s.tipo_servicio === 'p' ? 'Prenda' : 'Especial';
                        const tipoBadgeBg = s.tipo_servicio === 'k' ? '#dbeafe' : s.tipo_servicio === 'p' ? '#fef3c7' : '#f3e8ff';
                        const tipoBadgeColor = s.tipo_servicio === 'k' ? '#1e40af' : s.tipo_servicio === 'p' ? '#b45309' : '#6b21a8';

                        return (
                          <tr key={s.id} className="row-item">
                            <td style={{ textAlign: 'center', fontWeight: 800, fontSize: isTop3 ? '1.05rem' : '0.85rem' }}>
                              {isTop3 && medal ? <span>{medal}</span> : <span style={{ color: '#64748b' }}>#{s.ranking}</span>}
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>{s.nom_servicio}</span>
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: tipoBadgeBg,
                                color: tipoBadgeColor
                              }}>
                                {tipoLabel}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                              S/ {Number(s.precio_kilo || 0).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                background: s.veces_solicitado > 0 ? '#ffedd5' : '#f1f5f9',
                                color: s.veces_solicitado > 0 ? '#c2410c' : '#94a3b8',
                                fontWeight: 800,
                                fontSize: '0.84rem'
                              }}>
                                {s.veces_solicitado}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                              {s.total_cantidad > 0 ? Number(s.total_cantidad).toFixed(2) : '-'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '0.92rem' }}>
                              S/ {Number(s.total_recaudado || 0).toFixed(2)}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  flex: 1,
                                  height: '8px',
                                  background: '#f1f5f9',
                                  borderRadius: '9999px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(s.porcentaje || 0, 100)}%`,
                                    background: isTop3
                                      ? 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)'
                                      : 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
                                    borderRadius: '9999px',
                                    transition: 'width 0.4s ease'
                                  }} />
                                </div>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: '42px', color: '#334155' }}>
                                  {s.porcentaje}%
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: s.habilitado ? '#dcfce7' : '#fee2e2',
                                color: s.habilitado ? '#15803d' : '#b91c1c'
                              }}>
                                {s.habilitado ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
