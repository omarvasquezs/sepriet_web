import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, Wallet, Menu, Unlock } from 'lucide-react';
import api from '../api/axios';

interface NavbarProps {
  title: string;
  onToggleSidebar?: () => void;
  onOpenAperturaModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onToggleSidebar, onOpenAperturaModal }) => {
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(false);
  const [saldoEfectivo, setSaldoEfectivo] = useState<number | null>(null);
  const [time, setTime] = useState<string>('');

  const fetchCajaStatus = () => {
    api.get('/caja/estado')
      .then(res => {
        const isAbierta = !!res.data.caja && !res.data.caja.datetime_cierre;
        setCajaAbierta(isAbierta);
        if (isAbierta && res.data.monto_teorico_efectivo !== undefined) {
          setSaldoEfectivo(Number(res.data.monto_teorico_efectivo));
        } else {
          setSaldoEfectivo(null);
        }
      })
      .catch(() => {
        setCajaAbierta(false);
        setSaldoEfectivo(null);
      });
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCajaStatus();
    // Poll caja status every 60s
    const interval = setInterval(fetchCajaStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#ffffff',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleSidebar && (
          <button
            type="button"
            className="btn-secondary navbar-hamburger-btn"
            onClick={onToggleSidebar}
            style={{
              display: 'none',
              padding: '8px',
              borderRadius: '8px',
              background: '#f8fafc',
              borderColor: '#e2e8f0',
              cursor: 'pointer'
            }}
            title="Abrir menú"
          >
            <Menu size={20} color="#0f172a" />
          </button>
        )}
        <h2 style={{ fontSize: 'clamp(0.92rem, 3.8vw, 1.15rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: 0 }}>
          {title}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {cajaAbierta ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '20px',
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#15803d',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              whiteSpace: 'nowrap',
            }}
          >
            <Wallet size={14} />
            <span><span className="hide-on-mobile">Caja Abierta: </span>S/ {saldoEfectivo !== null ? saldoEfectivo.toFixed(2) : '0.00'}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAperturaModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '20px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#b91c1c',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            title="Haga clic para aperturar caja física"
          >
            <Unlock size={14} />
            <span><span className="hide-on-mobile">Caja Cerrada - </span>Abrir Caja</span>
          </button>
        )}

        <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
          <Clock size={14} />
          {time}
        </div>

        <div className="hide-on-mobile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#4338ca',
          background: '#e0e7ff',
          border: '1px solid #c7d2fe',
          padding: '5px 10px',
          borderRadius: '20px'
        }}>
          <ShieldCheck size={14} />
          Sanctum
        </div>
      </div>
    </header>
  );
};
