import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Users,
  Wallet,
  TrendingUp,
  PlusCircle,
  Shield,
  ShieldCheck,
  UserCheck,
  Shirt,
  Calendar,
  Lock,
  Unlock,
  ChevronRight,
  Search,
  DollarSign,
  FileText,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { WhatsAppModal } from '../components/WhatsAppModal';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onRegistrarComprobante?: () => void;
  onRegistrarCliente?: () => void;
  onConsultarComprobantes?: (preset: string, label: string) => void;
  onOpenAperturaModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onRegistrarComprobante,
  onRegistrarCliente,
  onConsultarComprobantes,
  onOpenAperturaModal,
}) => {
  const { user } = useAuth();

  // Print & WhatsApp Modals for viewing tickets directly from Dashboard
  const [selectedPrintTicket, setSelectedPrintTicket] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [whatsAppTicket, setWhatsAppTicket] = useState<any>(null);
  const [whatsAppActionType, setWhatsAppActionType] = useState<'ticket' | 'listo' | 'recogido'>('ticket');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Role detection
  const roleName = (user?.role || '').toUpperCase();
  const isAdmin = roleName.includes('ADMIN') || user?.role_id === 1;
  const isSupervisor = roleName.includes('SUPERVISOR');
  const isAtencion = !isAdmin && !isSupervisor;

  const [stats, setStats] = useState({
    totalTickets: 0,
    ventasHoy: 0,
    cajaSaldo: 0,
    clientesCount: 0,
    ingresosEfectivo: 0,
    ingresosDigitales: 0,
    totalEgresos: 0,
    montoTeoricoEfectivo: 0,
    montoApertura: 0,
    cajaAbierta: false,
    horaApertura: '',
    ticketsPendientes: 0,
    montoDeudaPendiente: 0,
  });

  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'todos' | 'debe' | 'cancelados'>('todos');
  const [loading, setLoading] = useState(true);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '¡Buenos días';
    if (hour >= 12 && hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const currentDateFormatted = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [comprobantesRes, cajaRes, clientesRes] = await Promise.all([
        api.get('/comprobantes', { params: { per_page: 25 } }),
        api.get('/caja/estado'),
        api.get('/clientes', { params: { per_page: 1 } }),
      ]);

      const compData = comprobantesRes.data;
      const totalTickets = compData.total || (compData.data ? compData.data.length : 0);
      const tickets: any[] = compData.data || [];
      const clientesCount = clientesRes.data?.total || (clientesRes.data?.data ? clientesRes.data.data.length : 0);

      const cajaData = cajaRes.data || {};
      const isCajaAbierta = cajaData.estado === 'abierta' || (!!cajaData.caja && !cajaData.caja.datetime_cierre);
      const ventasHoy = Number(cajaData.total_ingresos ?? cajaData.caja?.total_ventas ?? 0);
      const cajaSaldo = Number(cajaData.saldo_estimado || 0);
      const ingresosEfectivo = Number(cajaData.ingresos_efectivo || 0);
      const ingresosDigitales = Number(cajaData.ingresos_yape_plin || 0);
      const totalEgresos = Number(cajaData.total_egresos || 0);
      const montoTeoricoEfectivo = Number(cajaData.monto_teorico_efectivo || 0);
      const montoApertura = Number(cajaData.caja?.monto_apertura || cajaData.monto_apertura || 0);

      let horaApertura = cajaData.hora_apertura || '';
      if (!horaApertura && cajaData.caja?.datetime_apertura) {
        try {
          const dt = new Date(cajaData.caja.datetime_apertura);
          horaApertura = dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
          horaApertura = '';
        }
      }

      // Calculate pending debt tickets from recent
      const pendingTickets = tickets.filter(
        (t) => Number(t.monto_restante) > 0 && t.estado_comprobante?.nom_estado !== 'ANULADO'
      );
      const montoDeudaPendiente = pendingTickets.reduce(
        (acc, cur) => acc + Number(cur.monto_restante || 0),
        0
      );

      setStats({
        totalTickets,
        ventasHoy,
        cajaSaldo,
        clientesCount,
        ingresosEfectivo,
        ingresosDigitales,
        totalEgresos,
        montoTeoricoEfectivo,
        montoApertura,
        cajaAbierta: isCajaAbierta,
        horaApertura,
        ticketsPendientes: pendingTickets.length,
        montoDeudaPendiente,
      });

      setRecentTickets(tickets);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // 1. Instant event listener for caja changes anywhere in the app
    const handleCajaUpdated = () => {
      fetchData(true);
    };
    window.addEventListener('caja:updated', handleCajaUpdated);

    // 2. Refresh on window focus and tab visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleCajaUpdated);

    // 3. Fast background polling (every 15s)
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);

    return () => {
      window.removeEventListener('caja:updated', handleCajaUpdated);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleCajaUpdated);
      clearInterval(interval);
    };
  }, []);

  const getBadgeClassPago = (nombre: string) => {
    switch (nombre?.toUpperCase()) {
      case 'CANCELADO':
        return 'badge-listo';
      case 'ABONO':
        return 'badge-proceso';
      case 'DEBE':
        return 'badge-pendiente';
      case 'ANULADO':
        return 'badge-cancelado';
      default:
        return 'badge-pendiente';
    }
  };

  const filteredTickets = recentTickets.filter((t) => {
    const estado = (t.estado_comprobante?.nom_estado || '').toUpperCase();
    if (ticketFilter === 'debe') {
      return (estado === 'DEBE' || estado === 'ABONO' || Number(t.monto_restante) > 0) && estado !== 'ANULADO';
    }
    if (ticketFilter === 'cancelados') {
      return estado === 'CANCELADO';
    }
    return true;
  });

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. HERO GREETING BANNER */}
      <div className="dashboard-hero-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              flexShrink: 0,
            }}
          >
            {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 className="dashboard-hero-title">
                {getGreeting()}, {user?.name || user?.username}!
              </h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: isAdmin
                    ? 'rgba(168, 85, 247, 0.25)'
                    : isSupervisor
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'rgba(56, 189, 248, 0.25)',
                  color: isAdmin ? '#d8b4fe' : isSupervisor ? '#fde68a' : '#bae6fd',
                  border: isAdmin
                    ? '1px solid rgba(168, 85, 247, 0.4)'
                    : isSupervisor
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(56, 189, 248, 0.4)',
                }}
              >
                {isAdmin ? <Shield size={13} /> : isSupervisor ? <ShieldCheck size={13} /> : <UserCheck size={13} />}
                {user?.role || (isAdmin ? 'ADMINISTRADOR' : isSupervisor ? 'SUPERVISOR' : 'ATENCIÓN AL CLIENTE')}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '0.875rem' }}>
              {isAtencion && 'Panel de Mostrador • Emisión rápida de comprobantes, cobro de abonos y atención al cliente'}
              {isSupervisor && 'Panel de Supervisión • Control de caja, anulación de tickets, tarifas y reportes'}
              {isAdmin && 'Panel Ejecutivo • Control total del negocio, usuarios, finanzas y sistema'}
            </p>
          </div>
        </div>

        {/* Status Indicators Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              fontSize: '0.8rem',
              color: '#e2e8f0',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Calendar size={14} color="#94a3b8" />
            <span style={{ textTransform: 'capitalize' }}>{currentDateFormatted}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: stats.cajaAbierta ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              border: stats.cajaAbierta ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
              color: stats.cajaAbierta ? '#6ee7b7' : '#fde68a',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: stats.cajaAbierta ? '#10b981' : '#f59e0b',
                boxShadow: stats.cajaAbierta ? '0 0 8px #10b981' : 'none',
              }}
            />
            {stats.cajaAbierta ? (
              <span>Turno Activo {stats.horaApertura ? `(${stats.horaApertura})` : ''}</span>
            ) : (
              <span>Caja Sin Aperturar</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. ACCIONES RÁPIDAS SEGÚN PERFIL */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={16} color="#4f46e5" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Acciones Frecuentes
          </h3>
        </div>

        <div className="dashboard-quick-actions">
          {/* COMMON FOR ALL: NUEVO COMPROBANTE */}
          <button
            type="button"
            onClick={() => {
              if (onRegistrarComprobante) onRegistrarComprobante();
              else onNavigate('comprobantes');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              textAlign: 'left',
            }}
          >
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.2)' }}>
              <PlusCircle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Nuevo Comprobante</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9, marginTop: '2px' }}>Emitir ticket / boleta</div>
            </div>
          </button>

          {/* ATENCION AL CLIENTE QUICK ACTIONS */}
          {isAtencion && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onRegistrarCliente) onRegistrarCliente();
                  else onNavigate('clientes');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7' }}>
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Nuevo Cliente</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Registrar en directorio</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onConsultarComprobantes) {
                    onConsultarComprobantes('no_cancelados', 'Comprobantes No Cancelados');
                  } else {
                    onNavigate('comprobantes');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#fef3c7', color: '#d97706' }}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Cobrar Abono</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Tickets con saldo pendiente</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onConsultarComprobantes) {
                    onConsultarComprobantes('activos', 'Comprobantes Activos');
                  } else {
                    onNavigate('comprobantes');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#ede9fe', color: '#7c3aed' }}>
                  <Search size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Buscar Ticket</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Consultar o reimprimir</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('caja')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#ecfdf5', color: '#059669' }}>
                  <Wallet size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Caja Chica</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Registrar gastos / ver saldo</div>
                </div>
              </button>
            </>
          )}

          {/* SUPERVISOR QUICK ACTIONS */}
          {isSupervisor && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('caja')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#ecfdf5', color: '#059669' }}>
                  <Lock size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Arqueo / Cierre Caja</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Cuadre físico vs teórico</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('reportes')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Reportes de Turno</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Ingresos y producción</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('servicios')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#ecfdf5', color: '#10b981' }}>
                  <Shirt size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Tarifas de Servicios</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Precios por kilo / prenda</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('clientes')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7' }}>
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Clientes</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Base de datos activa</div>
                </div>
              </button>
            </>
          )}

          {/* ADMINISTRADOR QUICK ACTIONS */}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('usuarios')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#e0e7ff', color: '#3b82f6' }}>
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Gestión de Usuarios</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Cuentas del personal</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('roles')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#ede9fe', color: '#8b5cf6' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Perfiles y Permisos</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Matriz de accesos</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('reportes')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#ecfdf5', color: '#059669' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Balance Financiero</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Ganancias y reportes</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('caja')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#fef3c7', color: '#d97706' }}>
                  <Wallet size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Control de Cajas</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Turnos y auditoría</div>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. METRIC CARDS (GRID DE 4 TARJETAS PERSONALIZADAS) */}
      <div className="grid-responsive-4" style={{ marginBottom: '28px' }}>
        {/* CARD 1: INGRESOS / VENTAS */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            background: '#ffffff',
            borderTop: '3px solid #10b981',
            borderRadius: '14px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              {isAtencion ? 'Cobranzas del Turno' : 'Ventas / Ingresos Hoy'}
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '12px', color: '#0f172a', letterSpacing: '-0.5px' }}>
            S/ {stats.ventasHoy.toFixed(2)}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUpRight size={13} /> {stats.cajaAbierta ? 'Turno abierto' : 'Total acumulado'}
            </span>
          </div>
        </div>

        {/* CARD 2: EFECTIVO EN CAJA / GASTOS */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            background: '#ffffff',
            borderTop: '3px solid #0284c7',
            borderRadius: '14px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              {isAtencion ? 'Efectivo en Gaveta' : isSupervisor ? 'Gastos / Egresos Hoy' : 'Saldo Estimado en Caja'}
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
              <Wallet size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '12px', color: '#0f172a', letterSpacing: '-0.5px' }}>
            S/ {(isSupervisor ? stats.totalEgresos : stats.montoTeoricoEfectivo).toFixed(2)}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              {isAtencion
                ? `Apertura: S/ ${stats.montoApertura.toFixed(2)}`
                : isSupervisor
                ? 'Egresos registrados en caja'
                : `Teórico: S/ ${stats.montoTeoricoEfectivo.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* CARD 3: TICKETS / COMPROBANTES */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            background: '#ffffff',
            borderTop: '3px solid #6366f1',
            borderRadius: '14px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Comprobantes Registrados</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Receipt size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '12px', color: '#0f172a', letterSpacing: '-0.5px' }}>
            {stats.totalTickets}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>Tickets en base de datos</span>
          </div>
        </div>

        {/* CARD 4: ADAPTED BY ROLE */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            background: '#ffffff',
            borderTop: isAtencion ? '3px solid #f59e0b' : '3px solid #8b5cf6',
            borderRadius: '14px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              {isAtencion ? 'Saldos por Cobrar' : 'Clientes Registrados'}
            </span>
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: isAtencion ? 'rgba(245, 158, 11, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                color: isAtencion ? '#d97706' : '#8b5cf6',
              }}
            >
              {isAtencion ? <DollarSign size={20} /> : <Users size={20} />}
            </div>
          </div>
          <h3 style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '12px', color: '#0f172a', letterSpacing: '-0.5px' }}>
            {isAtencion ? `S/ ${stats.montoDeudaPendiente.toFixed(2)}` : stats.clientesCount}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                color: isAtencion ? '#d97706' : '#8b5cf6',
                fontWeight: 600,
              }}
            >
              {isAtencion ? `${stats.ticketsPendientes} tickets con saldo` : 'Directorio de clientes'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. TWO-COLUMN OPERATIONAL SECTION */}
      <div className="dashboard-content-grid">
        {/* LEFT COLUMN: COMPROBANTES RECIENTES */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Comprobantes Recientes
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '2px 0 0' }}>
                Últimos tickets emitidos en el sistema
              </p>
            </div>

            {/* Quick Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setTicketFilter('todos')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: ticketFilter === 'todos' ? '#ffffff' : 'transparent',
                  color: ticketFilter === 'todos' ? '#4f46e5' : '#64748b',
                  boxShadow: ticketFilter === 'todos' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTicketFilter('debe')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: ticketFilter === 'debe' ? '#ffffff' : 'transparent',
                  color: ticketFilter === 'debe' ? '#d97706' : '#64748b',
                  boxShadow: ticketFilter === 'debe' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Por Cobrar
              </button>
              <button
                type="button"
                onClick={() => setTicketFilter('cancelados')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: ticketFilter === 'cancelados' ? '#ffffff' : 'transparent',
                  color: ticketFilter === 'cancelados' ? '#16a34a' : '#64748b',
                  boxShadow: ticketFilter === 'cancelados' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Cancelados
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', borderRadius: '12px' }}>
            {loading ? (
              <div style={{ padding: '40px' }}>
                <LoadingSpinner text="Cargando información del dashboard..." />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No hay comprobantes para este filtro.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table" style={{ margin: 0 }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '12px 16px' }}>Código</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th style={{ textAlign: 'center' }}>Estado Pago</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Saldo</th>
                      <th style={{ textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.slice(0, 7).map((t) => {
                      const code = t.cod_comprobante || `N° ${t.id}`;
                      const clienteNombre = t.cliente?.nombres || 'Cliente';
                      const restante = Number(t.monto_restante || 0);

                      return (
                        <tr key={t.id} className="row-item">
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#4f46e5' }}>
                            {code}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  background: '#e0e7ff',
                                  color: '#4338ca',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                              >
                                {clienteNombre.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                                {clienteNombre}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {new Date(t.fecha).toLocaleDateString('es-PE')}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${getBadgeClassPago(t.estado_comprobante?.nom_estado)}`}>
                              {t.estado_comprobante?.nom_estado || 'DEBE'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                            S/ {Number(t.costo_total).toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.85rem' }}>
                            {restante > 0 ? (
                              <span style={{ color: '#dc2626' }}>S/ {restante.toFixed(2)}</span>
                            ) : (
                              <span style={{ color: '#16a34a' }}>S/ 0.00</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px' }}
                              onClick={() => {
                                setSelectedPrintTicket(t);
                                setShowPrintModal(true);
                              }}
                              title="Ver e imprimir comprobante"
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div
              style={{
                padding: '12px 16px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Mostrando {Math.min(filteredTickets.length, 7)} de {stats.totalTickets} comprobantes
              </span>
              <button
                type="button"
                onClick={() => onNavigate('comprobantes')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#4f46e5',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Ver todos los comprobantes <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CAJA WIDGET & ROLE TIPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* WIDGET 1: ESTADO DEL TURNO DE CAJA */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} color="#059669" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  Control de Caja Chica
                </h4>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: stats.cajaAbierta ? '#ecfdf5' : '#fef3c7',
                  color: stats.cajaAbierta ? '#059669' : '#d97706',
                }}
              >
                {stats.cajaAbierta ? 'Turno Abierto' : 'Sin Turno'}
              </span>
            </div>

            {stats.cajaAbierta ? (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                    <span style={{ color: '#64748b' }}>Monto Apertura (Base):</span>
                    <strong style={{ color: '#0f172a' }}>S/ {stats.montoApertura.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                    <span style={{ color: '#64748b' }}>Ingresos Efectivo:</span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>+ S/ {stats.ingresosEfectivo.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                    <span style={{ color: '#64748b' }}>Ingresos Digitales (Yape/Plin):</span>
                    <span style={{ color: '#0284c7', fontWeight: 600 }}>+ S/ {stats.ingresosDigitales.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                    <span style={{ color: '#64748b' }}>Egresos / Gastos Registrados:</span>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>- S/ {stats.totalEgresos.toFixed(2)}</span>
                  </div>
                </div>

                {/* Highlighted Drawer Balance */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Efectivo Teórico en Gaveta:</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      S/ {stats.montoTeoricoEfectivo.toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: '#bfdbfe', color: '#1d4ed8' }}
                    onClick={() => onNavigate('caja')}
                  >
                    Ver Caja
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <Lock size={32} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
                <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#64748b' }}>
                  No se ha iniciado el turno de caja de hoy.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    if (onOpenAperturaModal) onOpenAperturaModal();
                    else onNavigate('caja');
                  }}
                >
                  <Unlock size={16} /> Aperturar Turno de Caja
                </button>
              </div>
            )}
          </div>

          {/* WIDGET 2: RECOMENDACIONES SEGÚN EL PERFIL */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
            }}
          >
            <h4 style={{ margin: '0 0 10px', fontSize: '0.875rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="#6366f1" />
              {isAtencion && 'Recordatorios de Atención al Cliente'}
              {isSupervisor && 'Directrices de Supervisión'}
              {isAdmin && 'Guía de Administración'}
            </h4>

            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#475569', lineHeight: '1.6' }}>
              {isAtencion && (
                <>
                  <li>Confirma el número celular del cliente para el envío automático del ticket por WhatsApp.</li>
                  <li>Registra todo adelanto de dinero seleccionando el método de pago correcto (Efectivo o Yape).</li>
                  <li>Entrega el comprobante físico al cliente indicándole la fecha estimada de entrega.</li>
                </>
              )}
              {isSupervisor && (
                <>
                  <li>Realiza un arqueo preliminar a mitad de jornada para verificar que no haya diferencias en caja.</li>
                  <li>Revisa los motivos justificados antes de autorizar la anulación de cualquier comprobante.</li>
                  <li>Asegúrate de ejecutar el Cierre de Turno al finalizar el día para registrar el arqueo físico.</li>
                </>
              )}
              {isAdmin && (
                <>
                  <li>Monitorea las métricas financieras y el balance neto desde la opción Reportes.</li>
                  <li>Gestiona roles y credenciales del personal en la sección Sistemas.</li>
                  <li>Mantén los precios y tarifas actualizados en Servicios y Tarifas.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Vista Previa / Impresión de Comprobante */}
      <PrintPreviewModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        ticket={selectedPrintTicket}
        onOpenWhatsApp={(ticket, actionType) => {
          setWhatsAppTicket(ticket);
          setWhatsAppActionType(actionType || 'ticket');
          setShowWhatsAppModal(true);
        }}
      />

      {/* Modal Enviar por WhatsApp */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        ticket={whatsAppTicket}
        actionType={whatsAppActionType}
      />
    </div>
  );
};
