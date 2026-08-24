import React, { useEffect, useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import api from '../api/axios';

export const ReportesPage: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReporte = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reportes/financiero', {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
      });
      setReporte(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReporte();
  }, []);

  return (
    <div style={{ padding: '28px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Desde:</span>
          <input
            type="date"
            className="form-input"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Hasta:</span>
          <input
            type="date"
            className="form-input"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={fetchReporte}>
          <Filter size={18} /> Filtrar Reporte
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Generando reporte financiero...</p>
      ) : !reporte ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay información para mostrar.</p>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Ingresos</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '8px' }}>
                S/ {Number(reporte.total_ingresos).toFixed(2)}
              </h3>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Egresos</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fca5a5', marginTop: '8px' }}>
                S/ {Number(reporte.total_egresos).toFixed(2)}
              </h3>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderColor: 'var(--accent-primary)' }}>
              <span style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>Ganancia Neta</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#818cf8', marginTop: '8px' }}>
                S/ {Number(reporte.ganancia_neta).toFixed(2)}
              </h3>
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Ingresos por Método de Pago</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {reporte.por_metodo_pago.map((mp: any) => (
              <div key={mp.metodo_pago_id} className="glass-card" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {mp.metodo_pago?.nom_metodo_pago || 'Otros'}
                </span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginTop: '6px' }}>
                  S/ {Number(mp.total).toFixed(2)}
                </h4>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Detalle de Transacciones</h3>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Comprobante</th>
                  <th>Cliente</th>
                  <th>Método Pago</th>
                  <th>Fecha</th>
                  <th>Monto Abonado</th>
                </tr>
              </thead>
              <tbody>
                {reporte.listado_ingresos.map((ing: any) => (
                  <tr key={ing.id} className="row-item">
                    <td style={{ fontWeight: 700, color: '#818cf8' }}>{ing.cod_comprobante}</td>
                    <td>{ing.cliente?.nombres}</td>
                    <td>{ing.metodo_pago?.nom_metodo_pago}</td>
                    <td>{new Date(ing.fecha).toLocaleString('es-PE')}</td>
                    <td style={{ color: '#34d399', fontWeight: 700 }}>+ S/ {Number(ing.monto_abonado).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
