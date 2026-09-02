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

const MainLayout: React.FC = () => {
  const { user, isLoading, isAuthTransitioning } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  const handleTabChange = (newTab: string) => {
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
    comprobantes: 'Gestión de Comprobantes y Tickets',
    clientes: 'Directorio de Clientes',
    servicios: 'Tarifario de Servicios',
    caja: 'Control de Caja Chica',
    reportes: 'Reportes Financieros y Métricas',
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

      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title={titles[activeTab] || 'Sepriet System'} />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div key={activeTab} className="page-transition">
            {activeTab === 'dashboard' && <DashboardPage onNavigate={handleTabChange} />}
            {activeTab === 'comprobantes' && <ComprobantesPage />}
            {activeTab === 'clientes' && <ClientesPage />}
            {activeTab === 'servicios' && <ServiciosPage />}
            {activeTab === 'caja' && <CajaPage />}
            {activeTab === 'reportes' && <ReportesPage />}
          </div>
        </div>
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
