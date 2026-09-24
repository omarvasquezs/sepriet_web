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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
  const { user, logout } = useAuth();
  const isAdmin = user?.role?.toUpperCase().includes('ADMIN') || user?.role_id === 1;

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
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
          width: '280px',
          background: '#ffffff',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 16px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          boxShadow: '4px 0 25px rgba(0, 0, 0, 0.12)',
          zIndex: 1000,
          overflowY: 'auto',
        }}
      >
        <div>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                }}
              >
                S
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>SEPRIET</h2>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Sistema de Lavandería 1.0</p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Quick Home */}
          <button
            type="button"
            onClick={() => handleSelectTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'dashboard' ? '#eef2ff' : 'transparent',
              color: activeTab === 'dashboard' ? '#4f46e5' : '#334155',
              fontWeight: activeTab === 'dashboard' ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              marginBottom: '12px',
              textAlign: 'left',
            }}
          >
            <LayoutDashboard size={18} color={activeTab === 'dashboard' ? '#4f46e5' : '#64748b'} />
            <span>Dashboard Principal</span>
          </button>

          {/* Group 1: REGISTRAR */}
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 10px' }}>
              Registrar
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => handleAction(onRegistrarComprobante)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#4f46e5" />
                  <span>Comprobante</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#6366f1', background: '#e0e7ff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                  Ctrl+N
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onRegistrarCliente)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Users size={16} color="#0284c7" />
                <span>Cliente</span>
              </button>
            </div>
          </div>

          {/* Group 2: CONSULTAR */}
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 10px' }}>
              Consultar
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => handleAction(() => onConsultarComprobantes?.('activos', 'Todos los Comprobantes (Activos)'))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: '#334155',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Layers size={15} color="#4f46e5" />
                <span>Comprobantes Activos</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onConsultarComprobantes?.('no_cancelados', 'Comprobantes NO Cancelados'))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: '#334155',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <AlertCircle size={15} color="#ea580c" />
                <span>No Cancelados (Debe/Abono)</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onConsultarComprobantes?.('cancelados', 'Comprobantes YA Cancelados'))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: '#334155',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <CheckCircle2 size={15} color="#16a34a" />
                <span>Ya Cancelados</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onConsultarComprobantes?.('recogidos_cancelados', 'Recogidos y Cancelados'))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: '#334155',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Archive size={15} color="#64748b" />
                <span>Recogidos y Cancelados</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onConsultarComprobantes?.('todos', 'Histórico Comprobantes'))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: '#334155',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <History size={15} color="#6366f1" />
                <span>Histórico (Todos)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab('clientes')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'clientes' ? '#eef2ff' : 'transparent',
                  color: activeTab === 'clientes' ? '#4f46e5' : '#334155',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: activeTab === 'clientes' ? 700 : 500,
                }}
              >
                <Users size={15} color="#0284c7" />
                <span>Directorio de Clientes</span>
              </button>
            </div>
          </div>

          {/* Group 3: OPCIONES AVANZADAS */}
          {isAdmin && (
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 10px' }}>
                Opciones Avanzadas
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectTab('servicios')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === 'servicios' ? '#eef2ff' : 'transparent',
                    color: activeTab === 'servicios' ? '#4f46e5' : '#334155',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: activeTab === 'servicios' ? 700 : 500,
                  }}
                >
                  <Shirt size={15} color="#8b5cf6" />
                  <span>Servicios y Tarifas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('usuarios')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: activeTab === 'usuarios' ? '#eef2ff' : 'transparent',
                    color: activeTab === 'usuarios' ? '#4f46e5' : '#334155',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: activeTab === 'usuarios' ? 700 : 500,
                  }}
                >
                  <Shield size={15} color="#3b82f6" />
                  <span>Usuarios y Roles</span>
                </button>
              </div>
            </div>
          )}

          {/* Group 4: CAJA & REPORTES */}
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 10px' }}>
              Caja y Reportes
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => handleSelectTab('caja')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'caja' ? '#eef2ff' : 'transparent',
                  color: activeTab === 'caja' ? '#4f46e5' : '#334155',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: activeTab === 'caja' ? 700 : 500,
                }}
              >
                <Wallet size={15} color="#059669" />
                <span>Control de Caja Chica</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab('reportes')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'reportes' ? '#eef2ff' : 'transparent',
                  color: activeTab === 'reportes' ? '#4f46e5' : '#334155',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: activeTab === 'reportes' ? 700 : 500,
                }}
              >
                <TrendingUp size={15} color="#4f46e5" />
                <span>Reportes Financieros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer User & Logout */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                {user?.name || user?.username || 'Usuario'}
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
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
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
              title="Cerrar sesión"
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
