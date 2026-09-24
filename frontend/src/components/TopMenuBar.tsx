import React, { useEffect, useState, useRef } from 'react';
import {
  ChevronDown,
  FileText,
  Users,
  Shirt,
  Shield,
  Wallet,
  TrendingUp,
  LogOut,
  Clock,
  Menu,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Archive,
  History,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface TopMenuBarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onRegistrarComprobante: () => void;
  onRegistrarCliente: () => void;
  onConsultarComprobantes: (preset: string, label: string) => void;
  onOpenAperturaModal: () => void;
  onToggleMobileDrawer: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  activeTab,
  onNavigate,
  onRegistrarComprobante,
  onRegistrarCliente,
  onConsultarComprobantes,
  onOpenAperturaModal,
  onToggleMobileDrawer,
}) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role?.toUpperCase().includes('ADMIN') || user?.role_id === 1;

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(false);
  const [saldoEfectivo, setSaldoEfectivo] = useState<number | null>(null);
  const [time, setTime] = useState<string>('');
  const menuBarRef = useRef<HTMLDivElement>(null);

  const fetchCajaStatus = () => {
    api.get('/caja/estado')
      .then((res) => {
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
    const interval = setInterval(fetchCajaStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuKey: string) => {
    setOpenDropdown(prev => prev === menuKey ? null : menuKey);
  };

  const handleAction = (callback: () => void) => {
    setOpenDropdown(null);
    callback();
  };

  return (
    <header ref={menuBarRef} className="top-menu-bar">
      <div className="top-menu-inner">
        {/* Left Side: Brand & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="navbar-hamburger-btn"
            onClick={onToggleMobileDrawer}
            title="Abrir menú"
            style={{
              display: 'none',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '7px 9px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <Menu size={20} color="#0f172a" />
          </button>

          {/* Logo / Brand clickable to dashboard */}
          <div
            onClick={() => onNavigate('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              marginRight: '8px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                flexShrink: 0,
              }}
            >
              S
            </div>
            <div className="top-menu-brand-text">
              <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
                LAVANDERIA SEPRIET
              </span>
              <span className="hide-on-mobile" style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '-2px' }}>
                Sistema 1.0
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Dropdown Menus (Java / VJS structure) */}
        <nav className="top-menu-nav hide-on-mobile">
          {/* 1. REGISTRAR */}
          <div
            className={`top-menu-item ${openDropdown === 'registrar' ? 'open' : ''}`}
            onMouseEnter={() => setOpenDropdown('registrar')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              className="top-menu-btn"
              onClick={() => handleMenuClick('registrar')}
            >
              <span>Registrar</span>
              <ChevronDown size={14} className="top-menu-arrow" />
            </button>
            <div className="top-menu-dropdown">
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(onRegistrarComprobante)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#4f46e5" />
                  <span>Comprobante</span>
                </div>
                <span className="top-menu-shortcut-badge">Ctrl+N</span>
              </button>
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(onRegistrarCliente)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#0284c7" />
                  <span>Cliente</span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. CONSULTAR */}
          <div
            className={`top-menu-item ${openDropdown === 'consultar' ? 'open' : ''}`}
            onMouseEnter={() => setOpenDropdown('consultar')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              className={`top-menu-btn ${activeTab === 'comprobantes' || activeTab === 'clientes' ? 'active' : ''}`}
              onClick={() => handleMenuClick('consultar')}
            >
              <span>Consultar</span>
              <ChevronDown size={14} className="top-menu-arrow" />
            </button>
            <div className="top-menu-dropdown" style={{ minWidth: '320px' }}>
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(() => onConsultarComprobantes('activos', 'Todos los Comprobantes (Activos)'))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="#4f46e5" />
                  <span>Todos los Comprobantes (Activos)</span>
                </div>
              </button>
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(() => onConsultarComprobantes('no_cancelados', 'Comprobantes NO Cancelados'))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} color="#ea580c" />
                  <span>Comprobantes NO Cancelados (Debe/Abono)</span>
                </div>
              </button>
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(() => onConsultarComprobantes('cancelados', 'Comprobantes YA Cancelados'))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span>Comprobantes YA Cancelados</span>
                </div>
              </button>
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(() => onConsultarComprobantes('recogidos_cancelados', 'Recogidos y Cancelados'))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Archive size={16} color="#64748b" />
                  <span>Recogidos y Cancelados</span>
                </div>
              </button>
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(() => onConsultarComprobantes('todos', 'Histórico Comprobantes'))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={16} color="#6366f1" />
                  <span>Histórico comprobantes (Todos)</span>
                </div>
              </button>
              <div className="top-menu-divider" />
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(() => onNavigate('clientes'))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#0284c7" />
                  <span>Directorio de Clientes</span>
                </div>
              </button>
            </div>
          </div>

          {/* 3. OPCIONES AVANZADAS (Admin only or authorized) */}
          {isAdmin && (
            <div
              className={`top-menu-item ${openDropdown === 'avanzadas' ? 'open' : ''}`}
              onMouseEnter={() => setOpenDropdown('avanzadas')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                type="button"
                className={`top-menu-btn ${activeTab === 'servicios' || activeTab === 'usuarios' ? 'active' : ''}`}
                onClick={() => handleMenuClick('avanzadas')}
              >
                <span>Opciones Avanzadas</span>
                <ChevronDown size={14} className="top-menu-arrow" />
              </button>
              <div className="top-menu-dropdown">
                <button
                  type="button"
                  className="top-menu-subitem"
                  onClick={() => handleAction(() => onNavigate('servicios'))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shirt size={16} color="#8b5cf6" />
                    <span>Servicios y Tarifas</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="top-menu-subitem"
                  onClick={() => handleAction(() => onNavigate('usuarios'))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} color="#3b82f6" />
                    <span>Usuarios y Permisos</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 4. CAJA */}
          <div
            className={`top-menu-item ${openDropdown === 'caja' ? 'open' : ''}`}
            onMouseEnter={() => setOpenDropdown('caja')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              className={`top-menu-btn ${activeTab === 'caja' ? 'active' : ''}`}
              onClick={() => handleMenuClick('caja')}
            >
              <span>Caja</span>
              <ChevronDown size={14} className="top-menu-arrow" />
            </button>
            <div className="top-menu-dropdown">
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(() => onNavigate('caja'))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={16} color="#059669" />
                  <span>Estado de Caja / Egresos</span>
                </div>
              </button>
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(() => {
                  if (!cajaAbierta) {
                    onOpenAperturaModal();
                  } else {
                    onNavigate('caja');
                  }
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {cajaAbierta ? <LockIcon size={16} color="#dc2626" /> : <Unlock size={16} color="#16a34a" />}
                  <span>{cajaAbierta ? 'Cerrar Turno de Caja' : 'Aperturar Caja del Día'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* 5. REPORTES */}
          <div
            className={`top-menu-item ${openDropdown === 'reportes' ? 'open' : ''}`}
            onMouseEnter={() => setOpenDropdown('reportes')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              className={`top-menu-btn ${activeTab === 'reportes' ? 'active' : ''}`}
              onClick={() => handleMenuClick('reportes')}
            >
              <span>Reportes</span>
              <ChevronDown size={14} className="top-menu-arrow" />
            </button>
            <div className="top-menu-dropdown">
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(() => onNavigate('reportes'))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} color="#4f46e5" />
                  <span>Financieros</span>
                </div>
              </button>
              <button
                type="button"
                className="top-menu-subitem"
                onClick={() => handleAction(() => onNavigate('reportes'))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#0284c7" />
                  <span>Carga de Trabajo</span>
                </div>
              </button>
            </div>
          </div>

          {/* 6. SALIR / CERRAR SESIÓN */}
          <button
            type="button"
            className="top-menu-btn"
            onClick={logout}
            style={{ color: '#ef4444' }}
            title="Cerrar sesión"
          >
            <span>Salir</span>
          </button>
        </nav>

        {/* Right Side: Status Badge, Live Clock, User Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Caja Status Pill */}
          {cajaAbierta ? (
            <div
              onClick={() => onNavigate('caja')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#dcfce7',
                border: '1px solid #bbf7d0',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#15803d',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Caja del día abierta. Clic para ver detalles."
            >
              <Wallet size={14} />
              <span>
                <span className="hide-on-mobile">Caja: </span>S/ {saldoEfectivo !== null ? saldoEfectivo.toFixed(2) : '0.00'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAperturaModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#b91c1c',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Caja no aperturada. Clic para aperturar."
            >
              <Unlock size={14} />
              <span><span className="hide-on-mobile">Caja Cerrada - </span>Abrir</span>
            </button>
          )}

          {/* Clock */}
          <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.8rem', fontWeight: 500, paddingLeft: '4px' }}>
            <Clock size={14} />
            <span>{time}</span>
          </div>

          {/* User & Logout Badge */}
          <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#1e293b',
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
              }} />
              <span>{user?.name || user?.username || 'Usuario'}</span>
              {isAdmin && (
                <span style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: 800, background: '#e0e7ff', padding: '1px 5px', borderRadius: '4px' }}>
                  ADMIN
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={logout}
              className="btn-secondary"
              style={{
                padding: '5px 8px',
                display: 'flex',
                alignItems: 'center',
                color: '#dc2626',
                borderColor: '#fecaca',
                background: '#fef2f2',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const LockIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
