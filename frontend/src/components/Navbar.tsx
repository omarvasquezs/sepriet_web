import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, Wallet } from 'lucide-react';
import api from '../api/axios';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
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
      height: '70px',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#ffffff',
      position: 'sticky',
      top: 0,
      zIndex: 5,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
    }}>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{title}</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: cajaAbierta ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${cajaAbierta ? '#bbf7d0' : '#fecaca'}`,
          fontSize: '0.82rem',
          fontWeight: 700,
          color: cajaAbierta ? '#15803d' : '#b91c1c'
        }}>
          <Wallet size={15} />
          {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
          <Clock size={15} />
          {time}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#4338ca',
          background: '#e0e7ff',
          border: '1px solid #c7d2fe',
          padding: '6px 12px',
          borderRadius: '20px'
        }}>
          <ShieldCheck size={15} />
          Token Sanctum Activo
        </div>
      </div>
    </header>
  );
};
