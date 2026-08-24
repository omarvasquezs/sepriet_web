import React, { useEffect, useState } from 'react';
import { Receipt, Users, Wallet, TrendingUp, PlusCircle } from 'lucide-react';
import api from '../api/axios';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalTickets: 0,
    montoMes: 0,
    cajaSaldo: 0,
    clientesCount: 0
  });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [comprobantesRes, cajaRes, clientesRes] = await Promise.all([
          api.get('/comprobantes'),
          api.get('/caja/estado'),
          api.get('/clientes')
        ]);

        const comprobantes = comprobantesRes.data || [];
        const totalTickets = comprobantes.length;
        const montoMes = comprobantes.reduce((sum: number, c: any) => sum + Number(c.costo_total || 0), 0);
        const cajaSaldo = cajaRes.data?.saldo_estimado || 0;
        const clientesCount = clientesRes.data?.length || 0;

        setStats({ totalTickets, montoMes, cajaSaldo, clientesCount });
        setRecentTickets(comprobantes.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Comprobantes</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
              <Receipt size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '12px', color: 'white' }}>
            {stats.totalTickets}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)' }}>Activos en sistema</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Facturación Total</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '12px', color: 'white' }}>
            S/ {stats.montoMes.toFixed(2)}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto total acumulado</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Caja Chica</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee' }}>
              <Wallet size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '12px', color: 'white' }}>
            S/ {stats.cajaSaldo.toFixed(2)}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo estimado turno</span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Clientes</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
              <Users size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '12px', color: 'white' }}>
            {stats.clientesCount}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registrados</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Comprobantes Recientes</h3>
        <button onClick={() => onNavigate('comprobantes')} className="btn-primary">
          <PlusCircle size={18} />
          Nuevo Comprobante
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Cargando datos...</p>
        ) : recentTickets.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No hay comprobantes registrados aún.</p>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Restante</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((t) => (
                <tr key={t.id} className="row-item">
                  <td style={{ fontWeight: 700, color: '#818cf8' }}>{t.cod_comprobante}</td>
                  <td>{t.cliente?.nombres}</td>
                  <td>{new Date(t.fecha).toLocaleDateString('es-PE')}</td>
                  <td>
                    <span className={`badge badge-${t.estado?.nombre?.toLowerCase().replace(' ', '') || 'pendiente'}`}>
                      {t.estado?.nombre}
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
