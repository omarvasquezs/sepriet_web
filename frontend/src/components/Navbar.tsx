import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, Wallet, Menu } from 'lucide-react';
import api from '../api/axios';

interface NavbarProps {
  title: string;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onToggleSidebar }) => {
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(false);
  const [time, setTime] = useState<string>('');

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
    api.get('/caja/estado')
      .then(res => setCajaAbierta(!!res.data.caja))
      .catch(() => setCajaAbierta(false));
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
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: 0 }}>
          {title}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '20px',
          background: cajaAbierta ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${cajaAbierta ? '#bbf7d0' : '#fecaca'}`,
          fontSize: '0.78rem',
          fontWeight: 700,
          color: cajaAbierta ? '#15803d' : '#b91c1c'
        }}>
          <Wallet size={14} />
          <span>{cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}</span>
        </div>

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
