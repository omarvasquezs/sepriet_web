import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { TopMenuBar } from './components/TopMenuBar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ResilienceBanner } from './components/ResilienceBanner';
import { AperturaCajaModal } from './components/AperturaCajaModal';
import { DashboardPage } from './pages/DashboardPage';
import { ComprobantesPage } from './pages/ComprobantesPage';
import { ClientesPage } from './pages/ClientesPage';
import { ServiciosPage } from './pages/ServiciosPage';
import { CajaPage } from './pages/CajaPage';
import { ReportesPage } from './pages/ReportesPage';
import { UsuariosPage } from './pages/UsuariosPage';
import api from './api/axios';

import { LayoutDashboard, Receipt, Users, Wallet, Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading, isAuthTransitioning } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  // Triggers & Presets from Top Menu (Java / VJS Navigation)
  const [triggerCreateTicket, setTriggerCreateTicket] = useState(0);
  const [triggerCreateCliente, setTriggerCreateCliente] = useState(0);
  const [comprobanteFilterPreset, setComprobanteFilterPreset] = useState<{
    id: string;
    label: string;
    timestamp: number;
  } | null>(null);

  // Global Caja Check & Modal State
  const [showGlobalAperturaModal, setShowGlobalAperturaModal] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/caja/estado')
        .then((res) => {
          if (res.data?.requiere_apertura) {
            setShowGlobalAperturaModal(true);
          }
        })
        .catch((err) => {
          console.error('Error checking global caja status:', err);
        });
    }
  }, [user]);

  // Global keyboard shortcut Ctrl+N / Cmd+N for New Comprobante
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleTabChange('comprobantes');
        setTriggerCreateTicket(prev => prev + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleRegistrarComprobante = () => {
    handleTabChange('comprobantes');
    setTriggerCreateTicket(prev => prev + 1);
  };

  const handleRegistrarCliente = () => {
    handleTabChange('clientes');
    setTriggerCreateCliente(prev => prev + 1);
  };

  const handleConsultarComprobantes = (presetId: string, label: string) => {
    setComprobanteFilterPreset({
      id: presetId,
      label,
      timestamp: Date.now()
    });
    handleTabChange('comprobantes');
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

      {/* Mobile Off-canvas Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onRegistrarComprobante={handleRegistrarComprobante}
        onRegistrarCliente={handleRegistrarCliente}
        onConsultarComprobantes={handleConsultarComprobantes}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: '20px' }}>
        {/* Desktop Top Menu Bar (Java / VJS Style) */}
        <TopMenuBar
          activeTab={activeTab}
          onNavigate={handleTabChange}
          onRegistrarComprobante={handleRegistrarComprobante}
          onRegistrarCliente={handleRegistrarCliente}
          onConsultarComprobantes={handleConsultarComprobantes}
          onOpenAperturaModal={() => setShowGlobalAperturaModal(true)}
          onToggleMobileDrawer={() => setIsSidebarOpen(prev => !prev)}
        />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div key={activeTab} className="page-transition">
            {activeTab === 'dashboard' && <DashboardPage onNavigate={handleTabChange} />}
            {activeTab === 'comprobantes' && (
              <ComprobantesPage
                filterPreset={comprobanteFilterPreset}
                triggerCreateTicket={triggerCreateTicket}
                onClearFilterPreset={() => setComprobanteFilterPreset(null)}
              />
            )}
            {activeTab === 'clientes' && (
              <ClientesPage triggerCreateCliente={triggerCreateCliente} />
            )}
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
            onClick={() => {
              setComprobanteFilterPreset(null);
              handleTabChange('comprobantes');
            }}
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

      {/* Global Apertura de Caja Modal */}
      <AperturaCajaModal
        isOpen={showGlobalAperturaModal}
        onClose={() => setShowGlobalAperturaModal(false)}
        onSuccess={() => {
          setShowGlobalAperturaModal(false);
        }}
      />

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
