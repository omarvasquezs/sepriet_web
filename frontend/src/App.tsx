import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ResilienceBanner } from './components/ResilienceBanner';
import { DashboardPage } from './pages/DashboardPage';
import { ComprobantesPage } from './pages/ComprobantesPage';
import { ClientesPage } from './pages/ClientesPage';
import { ServiciosPage } from './pages/ServiciosPage';
import { CajaPage } from './pages/CajaPage';
import { ReportesPage } from './pages/ReportesPage';
import { UsuariosPage } from './pages/UsuariosPage';

import { LayoutDashboard, Receipt, Users, Wallet, Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading, isAuthTransitioning } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  const handleTabChange = (newTab: string) => {
    setIsSidebarOpen(false);
    if (newTab === activeTab) return;
    setIsTransitioning(true);
    setProgressWidth(30);

    setTimeout(() => {
      setProgressWidth(70);
    }, 60);

    setTimeout(() => {
      setActiveTab(newTab);
      setProgressWidth(100);

      setTimeout(() => {
        setIsTransitioning(false);
        setProgressWidth(0);
      }, 200);
    }, 120);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Cargando sistema Sepriet..." size="lg" />;
  }

  if (!user) {
    return (
      <div key="login-view" className="page-transition">
        <div className="top-progress-bar-container">
          <div
            className="top-progress-bar"
            style={{
              width: isAuthTransitioning ? '100%' : '0%',
              opacity: isAuthTransitioning ? 1 : 0,
            }}
          />
        </div>
        <LoginPage />
        <ResilienceBanner />
      </div>
    );
  }

  const titles: Record<string, string> = {
    dashboard: 'Dashboard Principal',
    comprobantes: 'Gestión de Comprobantes',
    clientes: 'Directorio de Clientes',
    servicios: 'Tarifario de Servicios',
    caja: 'Control de Caja Chica',
    reportes: 'Reportes Financieros',
    usuarios: 'Gestión de Usuarios y Roles',
  };

  const showBar = isTransitioning || isAuthTransitioning;
  const barWidth = isAuthTransitioning ? '100%' : `${progressWidth}%`;

  return (
    <div key="app-view" className="page-transition" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Top transition progress bar */}
      <div className="top-progress-bar-container">
        <div
          className="top-progress-bar"
          style={{
            width: barWidth,
            opacity: showBar ? 1 : 0,
          }}
        />
      </div>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: '20px' }}>
        <Navbar
          title={titles[activeTab] || 'Sepriet System'}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div key={activeTab} className="page-transition">
            {activeTab === 'dashboard' && <DashboardPage onNavigate={handleTabChange} />}
            {activeTab === 'comprobantes' && <ComprobantesPage />}
            {activeTab === 'clientes' && <ClientesPage />}
            {activeTab === 'servicios' && <ServiciosPage />}
            {activeTab === 'caja' && <CajaPage />}
            {activeTab === 'reportes' && <ReportesPage />}
            {activeTab === 'usuarios' && <UsuariosPage />}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="bottom-nav">
          <button
            type="button"
            className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Inicio</span>
          </button>
          <button
            type="button"
            className={`bottom-nav-item ${activeTab === 'comprobantes' ? 'active' : ''}`}
            onClick={() => handleTabChange('comprobantes')}
          >
            <Receipt size={20} />
            <span>Tickets</span>
          </button>
          <button
            type="button"
            className={`bottom-nav-item ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => handleTabChange('clientes')}
          >
            <Users size={20} />
            <span>Clientes</span>
          </button>
          <button
            type="button"
            className={`bottom-nav-item ${activeTab === 'caja' ? 'active' : ''}`}
            onClick={() => handleTabChange('caja')}
          >
            <Wallet size={20} />
            <span>Caja</span>
          </button>
          <button
            type="button"
            className="bottom-nav-item"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={20} />
            <span>Más</span>
          </button>
        </nav>
      </main>

      <ResilienceBanner />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
