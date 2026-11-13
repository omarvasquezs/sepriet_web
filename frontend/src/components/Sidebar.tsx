import React from 'react';
import {
  FileText,
  Users,
  Shirt,
  Shield,
  Wallet,
  TrendingUp,
  LogOut,
  X,
  Layers,
  AlertCircle,
  CheckCircle2,
  Archive,
  History,
  LayoutDashboard,
  Award,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string, subtab?: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onRegistrarComprobante?: () => void;
  onRegistrarCliente?: () => void;
  onConsultarComprobantes?: (preset: string, label: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen = false,
  onClose,
  onRegistrarComprobante,
  onRegistrarCliente,
  onConsultarComprobantes,
}) => {
  const { user, logout, hasPermission } = useAuth();
  const isAdmin = user?.role?.toUpperCase().includes('ADMIN') || user?.role_id === 1;
  const canAccessServicios = isAdmin || hasPermission('servicios');
  const canAccessSistemas = isAdmin || hasPermission('sistemas');
  const canAccessCaja = isAdmin || hasPermission('caja_apertura') || hasPermission('caja_cierre') || hasPermission('caja_egresos') || hasPermission('caja_historial');
  const canAccessReportes = isAdmin || hasPermission('reportes');

  const handleSelectTab = (tabId: string, subtab?: string) => {
    setActiveTab(tabId, subtab);
    if (onClose) onClose();
  };

  const handleAction = (callback?: () => void) => {
    if (callback) callback();
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside
        className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`}
        style={{
          width: 'min(340px, 86vw)',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          boxShadow: '4px 0 30px rgba(15, 23, 42, 0.18)',
          zIndex: 1000,
          overflow: 'hidden',
        }}
      >
        {/* Header - Fixed at Top */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px',
            borderBottom: '1px solid #f1f5f9',
            flexShrink: 0,
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/images/logo_sepriet.png"
              alt="Sepriet"
              style={{
                height: '38px',
                width: 'auto',
                maxWidth: '90px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
                SEPRIET
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                Sistema de Lavandería 1.0
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                border: 'none',
                background: '#f1f5f9',
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease',
              }}
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            padding: '16px 14px 20px 14px',
          }}
        >
          {/* Dashboard Principal */}
          <button
            type="button"
            onClick={() => handleSelectTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 14px',
              minHeight: '48px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'dashboard' ? '#eef2ff' : 'transparent',
              color: activeTab === 'dashboard' ? '#4f46e5' : '#1e293b',
              fontWeight: activeTab === 'dashboard' ? 700 : 600,
              fontSize: '0.94rem',
              cursor: 'pointer',
              marginBottom: '16px',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
          >
            <LayoutDashboard size={20} color={activeTab === 'dashboard' ? '#4f46e5' : '#64748b'} />
            <span>Inicio (Dashboard)</span>
          </button>

          {/* Group 1: REGISTRAR */}
          <div style={{ marginBottom: '18px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '0 8px',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Registrar
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleAction(onRegistrarComprobante)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  minHeight: '48px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '0.94rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <FileText size={20} color="#4f46e5" />
                <span>Comprobante</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onRegistrarCliente)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  minHeight: '48px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '0.94rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Users size={20} color="#0284c7" />
                <span>Cliente</span>
              </button>
            </div>
          </div>

          {/* Group 2: CONSULTAR */}
          <div style={{ marginBottom: '18px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '0 8px',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Consultar
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                type="button"
                onClick={() => handleAction(() => onConsultarComprobantes?.('activos', 'Todos los Comprobantes (Activos)'))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '11px 14px',
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#1e293b',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Layers size={19} color="#4f46e5" />
                <span>Comprobantes Activos</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onConsultarComprobantes?.('no_cancelados', 'Comprobantes NO Cancelados'))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '11px 14px',
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#1e293b',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <AlertCircle size={19} color="#ea580c" />
                <span>No Cancelados (Debe/Abono)</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onConsultarComprobantes?.('cancelados', 'Comprobantes YA Cancelados'))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '11px 14px',
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#1e293b',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <CheckCircle2 size={19} color="#16a34a" />
                <span>Ya Cancelados</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onConsultarComprobantes?.('recogidos_cancelados', 'Recogidos y Cancelados'))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '11px 14px',
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#1e293b',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Archive size={19} color="#64748b" />
                <span>Recogidos y Cancelados</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onConsultarComprobantes?.('todos', 'Histórico Comprobantes'))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '11px 14px',
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#1e293b',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <History size={19} color="#6366f1" />
                <span>Histórico (Todos)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab('clientes')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '11px 14px',
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'clientes' ? '#eef2ff' : 'transparent',
                  color: activeTab === 'clientes' ? '#4f46e5' : '#1e293b',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: activeTab === 'clientes' ? 700 : 600,
                }}
              >
                <Users size={19} color="#0284c7" />
                <span>Directorio de Clientes</span>
              </button>
            </div>
          </div>

          {/* Group 3: SISTEMAS */}
          {canAccessSistemas && (
            <div style={{ marginBottom: '18px' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '0 8px',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Sistemas
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectTab('usuarios')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '11px 14px',
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'usuarios' ? '#eef2ff' : 'transparent',
                    color: activeTab === 'usuarios' ? '#4f46e5' : '#1e293b',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: activeTab === 'usuarios' ? 700 : 600,
                  }}
                >
                  <Users size={19} color="#3b82f6" />
                  <span>Gestión de Usuarios</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('roles')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '11px 14px',
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'roles' ? '#eef2ff' : 'transparent',
                    color: activeTab === 'roles' ? '#4f46e5' : '#1e293b',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: activeTab === 'roles' ? 700 : 600,
                  }}
                >
                  <Shield size={19} color="#8b5cf6" />
                  <span>Perfiles y Permisos</span>
                </button>
              </div>
            </div>
          )}

          {/* Group: SERVICIOS Y TARIFAS */}
          {canAccessServicios && (
            <div style={{ marginBottom: '18px' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '0 8px',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Servicios
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectTab('servicios')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '11px 14px',
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'servicios' ? '#eef2ff' : 'transparent',
                    color: activeTab === 'servicios' ? '#4f46e5' : '#1e293b',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: activeTab === 'servicios' ? 700 : 600,
                  }}
                >
                  <Shirt size={19} color="#10b981" />
                  <span>Servicios y Tarifas</span>
                </button>
              </div>
            </div>
          )}

          {/* Group 4: CAJA & REPORTES */}
          {(canAccessCaja || canAccessReportes) && (
            <div style={{ marginBottom: '18px' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '0 8px',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Caja y Reportes
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {canAccessCaja && (
                  <button
                    type="button"
                    onClick={() => handleSelectTab('caja')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '11px 14px',
                      minHeight: '44px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'caja' ? '#eef2ff' : 'transparent',
                      color: activeTab === 'caja' ? '#4f46e5' : '#1e293b',
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: activeTab === 'caja' ? 700 : 600,
                    }}
                  >
                    <Wallet size={19} color="#059669" />
                    <span>Control de Caja Chica</span>
                  </button>
                )}

                {canAccessReportes && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('reportes', 'financiero')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '11px 14px',
                        minHeight: '44px',
                        borderRadius: '8px',
                        border: 'none',
                        background: activeTab === 'reportes' ? '#eef2ff' : 'transparent',
                        color: activeTab === 'reportes' ? '#4f46e5' : '#1e293b',
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: activeTab === 'reportes' ? 700 : 600,
                      }}
                    >
                      <TrendingUp size={19} color="#4f46e5" />
                      <span>Reportes Financieros</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('reportes', 'clientes')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '11px 14px',
                        minHeight: '44px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: '#1e293b',
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                      }}
                    >
                      <Award size={19} color="#7c3aed" />
                      <span>Clientes Frecuentes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('reportes', 'servicios')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '11px 14px',
                        minHeight: '44px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: '#1e293b',
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                      }}
                    >
                      <Flame size={19} color="#ea580c" />
                      <span>Servicios Más Vendidos</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer User & Logout - Fixed at Bottom */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            padding: '14px 18px',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                {user?.name || user?.username || 'Usuario'}
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {isAdmin ? 'Administrador' : 'Operador'}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.88rem',
                fontWeight: 700,
                minHeight: '40px',
                transition: 'background 0.15s ease',
              }}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
