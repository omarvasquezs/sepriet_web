import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ComprobantesPage } from './pages/ComprobantesPage';
import { ClientesPage } from './pages/ClientesPage';
import { ServiciosPage } from './pages/ServiciosPage';
import { CajaPage } from './pages/CajaPage';
import { ReportesPage } from './pages/ReportesPage';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'var(--text-muted)' }}>
        Cargando sistema Sepriet...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const titles: Record<string, string> = {
    dashboard: 'Dashboard Principal',
    comprobantes: 'Gestión de Comprobantes y Tickets',
    clientes: 'Directorio de Clientes',
    servicios: 'Tarifario de Servicios',
    caja: 'Control de Caja Chica',
    reportes: 'Reportes Financieros y Métricas',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title={titles[activeTab] || 'Sepriet System'} />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
          {activeTab === 'comprobantes' && <ComprobantesPage />}
          {activeTab === 'clientes' && <ClientesPage />}
          {activeTab === 'servicios' && <ServiciosPage />}
          {activeTab === 'caja' && <CajaPage />}
          {activeTab === 'reportes' && <ReportesPage />}
        </div>
      </main>
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
