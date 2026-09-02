import React, { useEffect, useState } from 'react';
import { Receipt, Users, Wallet, TrendingUp, PlusCircle } from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalTickets: 0,
    montoTotal: 0,
    cajaSaldo: 0,
    clientesCount: 0
  });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [comprobantesRes, cajaRes, clientesRes] = await Promise.all([
          api.get('/comprobantes', { params: { per_page: 10 } }),
          api.get('/caja/estado'),
          api.get('/clientes', { params: { per_page: 1 } })
        ]);

        const compData = comprobantesRes.data;
        const totalTickets = compData.total || (compData.data ? compData.data.length : 0);
        const cajaSaldo = cajaRes.data?.saldo_estimado || 0;
        const clientesCount = clientesRes.data?.total || (clientesRes.data?.data ? clientesRes.data.data.length : 0);
        const tickets = compData.data || [];

        // Total sum of visible or sample tickets
        const montoTotal = tickets.reduce((sum: number, c: any) => sum + Number(c.costo_total || 0), 0);

        setStats({ totalTickets, montoTotal, cajaSaldo, clientesCount });
        setRecentTickets(tickets.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBadgeClassPago = (nombre: string) => {
    switch (nombre?.toUpperCase()) {
      case 'CANCELADO': return 'badge-listo';
      case 'ABONO': return 'badge-proceso';
      case 'DEBE': return 'badge-pendiente';
      case 'ANULADO': return 'badge-cancelado';
      default: return 'badge-pendiente';
    }
  };

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Comprobantes Registrados</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
              <Receipt size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '12px', color: '#0f172a' }}>
            {stats.totalTickets}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)' }}>Historial completo</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Clientes Registrados</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
              <Users size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '12px', color: '#0f172a' }}>
            {stats.clientesCount}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Base de datos activa</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Caja Chica</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
              <Wallet size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '12px', color: '#0f172a' }}>
            S/ {stats.cajaSaldo.toFixed(2)}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo estimado turno</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Total Muestra</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '12px', color: '#0f172a' }}>
            S/ {stats.montoTotal.toFixed(2)}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Últimos tickets</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Comprobantes Recientes</h3>
        <button onClick={() => onNavigate('comprobantes')} className="btn-primary">
          <PlusCircle size={18} />
          Nuevo Comprobante
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <LoadingSpinner text="Cargando estadísticas y tickets..." />
        ) : recentTickets.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No hay comprobantes registrados aún.</p>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado Pago</th>
                <th>Total</th>
                <th>Restante</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((t) => (
                <tr key={t.id} className="row-item">
                  <td style={{ fontWeight: 700, color: '#818cf8' }}>{t.cod_comprobante || `N° ${t.id}`}</td>
                  <td>{t.cliente?.nombres || 'Cliente'}</td>
                  <td>{new Date(t.fecha).toLocaleDateString('es-PE')}</td>
                  <td>
                    <span className={`badge ${getBadgeClassPago(t.estado_comprobante?.nom_estado)}`}>
                      {t.estado_comprobante?.nom_estado || 'DEBE'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>S/ {Number(t.costo_total).toFixed(2)}</td>
                  <td style={{ color: Number(t.monto_restante) > 0 ? '#fca5a5' : '#34d399', fontWeight: 600 }}>
                    S/ {Number(t.monto_restante).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
