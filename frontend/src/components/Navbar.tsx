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
      background: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(8px)'
    }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>{title}</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: cajaAbierta ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${cajaAbierta ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          fontSize: '0.82rem',
          fontWeight: 600,
          color: cajaAbierta ? '#34d399' : '#fca5a5'
        }}>
          <Wallet size={16} />
          {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          <Clock size={16} />
          {time}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#818cf8',
          background: 'rgba(99, 102, 241, 0.15)',
          padding: '6px 12px',
          borderRadius: '20px'
        }}>
          <ShieldCheck size={16} />
          Bearer Token Sanctum
        </div>
      </div>
    </header>
  );
};
