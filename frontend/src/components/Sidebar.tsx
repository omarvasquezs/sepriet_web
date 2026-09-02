import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  Shirt, 
  Wallet, 
  TrendingUp, 
  LogOut,
  Shield 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role?.toUpperCase().includes('ADMIN') || user?.role_id === 1;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'comprobantes', label: 'Comprobantes', icon: Receipt },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'servicios', label: 'Servicios', icon: Shirt },
    { id: 'caja', label: 'Caja Chica', icon: Wallet },
    { id: 'reportes', label: 'Reportes', icon: TrendingUp },
    ...(isAdmin ? [{ id: 'usuarios', label: 'Usuarios y Roles', icon: Shield }] : []),
  ];

  return (
    <aside style={{
      width: '260px',
      background: '#ffffff',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      boxShadow: '2px 0 10px rgba(0, 0, 0, 0.02)',
      zIndex: 10
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.2rem',
            color: 'white',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
          }}>
            S
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>SEPRIET</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sistema de Lavandería</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#eef2ff' : 'transparent',
                  color: isActive ? '#4f46e5' : '#475569',
                  borderLeft: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={19} color={isActive ? '#4f46e5' : '#64748b'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', marginBottom: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#e0e7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#4f46e5'
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {user?.name}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', color: '#dc2626', borderColor: '#fecaca', background: '#fff1f2' }}
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};
