import React, { useEffect, useState } from 'react';
import { Calendar, Filter, TrendingUp, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ReportesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'financiero' | 'trabajo'>('financiero');

  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const [reporteFinanciero, setReporteFinanciero] = useState<any>(null);
  const [reporteTrabajo, setReporteTrabajo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReporte = async () => {
    setLoading(true);
    try {
      if (activeTab === 'financiero') {
        const res = await api.get('/reportes/financiero', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        setReporteFinanciero(res.data);
      } else {
        const res = await api.get('/reportes/trabajo', {
          params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        });
        setReporteTrabajo(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
  }, [activeTab]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReporte();
  };

  return (
    <div className="page-container">
      {/* Header & Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
          Reportes y Estadísticas
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Análisis financiero de ingresos y egresos, rendimiento y carga operativa de trabajo.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('financiero')}
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
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
          <TrendingUp size={18} />
          Reporte Financiero
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trabajo')}
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
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
          <Sparkles size={18} />
          Carga de Trabajo
        </button>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilterSubmit} className="glass-panel" style={{ padding: '16px', marginBottom: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--primary-color)" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>Desde:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '0.9rem' }}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}>Hasta:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '0.9rem' }}
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} /> Filtrar Reporte
          </button>
        </div>
      </form>

      {loading ? (
        <LoadingSpinner text={activeTab === 'financiero' ? 'Generando reporte financiero...' : 'Consultando carga de trabajo...'} />
      ) : activeTab === 'financiero' ? (
        /* ================= VISTA REPORTE FINANCIERO ================= */
        !reporteFinanciero ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay información para mostrar.</p>
        ) : (
          <div>
            {/* KPI Cards */}
            <div className="grid-responsive-3" style={{ marginBottom: '28px' }}>
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Ingresos</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '8px' }}>
                  S/ {Number(reporteFinanciero.total_ingresos || 0).toFixed(2)}
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Egresos</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', marginTop: '8px' }}>
                  S/ {Number(reporteFinanciero.total_egresos || 0).toFixed(2)}
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '20px', borderColor: '#c7d2fe' }}>
                <span style={{ color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700 }}>Ganancia Neta</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5', marginTop: '8px' }}>
                  S/ {Number(reporteFinanciero.ganancia_neta || 0).toFixed(2)}
                </h3>
              </div>
            </div>

            {/* Methods Breakdown */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              Ingresos por Método de Pago
            </h3>
            <div className="grid-responsive-4" style={{ marginBottom: '32px' }}>
              {reporteFinanciero.por_metodo_pago?.map((mp: any) => (
                <div key={mp.metodo_pago_id} className="glass-card" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {String(mp.metodo_pago?.nom_metodo_pago || 'OTROS').toUpperCase()}
                  </span>
                  <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                    S/ {Number(mp.total).toFixed(2)}
                  </h4>
                </div>
              ))}
            </div>

            {/* Transactions Detail */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
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
      ) : (
        /* ================= VISTA CARGA DE TRABAJO ================= */
        !reporteTrabajo ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos de carga de trabajo.</p>
        ) : (
          <div>
            <div className="grid-responsive-3" style={{ marginBottom: '28px' }}>
              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Comprobantes / Tickets</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7', marginTop: '8px' }}>
                  {reporteTrabajo.total_tickets || 0}
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Monto Total Facturado</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '8px' }}>
                  S/ {Number(reporteTrabajo.total_monto || 0).toFixed(2)}
                </h3>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Promedio por Ticket</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5', marginTop: '8px' }}>
                  S/ {reporteTrabajo.total_tickets > 0 ? (reporteTrabajo.total_monto / reporteTrabajo.total_tickets).toFixed(2) : '0.00'}
                </h3>
              </div>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
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
      )}
    </div>
  );
};
