import React, { useEffect, useState } from 'react';
import {
  Lock,
  Unlock,
  MinusCircle,
  Filter,
  Image as ImageIcon,
  DollarSign,
  Smartphone,
  FileText,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  History,
  PlusCircle,
} from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AperturaCajaModal } from '../components/AperturaCajaModal';

export const CajaPage: React.FC = () => {
  const [activeViewTab, setActiveViewTab] = useState<'actual' | 'historial'>('actual');
  const [cajaInfo, setCajaInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [showEgresoModal, setShowEgresoModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [cierreResumen, setCierreResumen] = useState<any | null>(null);
  const [showCierreSuccessModal, setShowCierreSuccessModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Date filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [fechaDesde, setFechaDesde] = useState(todayStr);
  const [fechaHasta, setFechaHasta] = useState(todayStr);

  // Egreso form
  const [egresoForm, setEgresoForm] = useState({
    descripcion: '',
    monto: '',
    id_metodo_pago: '4', // Default to 4 = Efectivo
  });
  const [egresoImageFile, setEgresoImageFile] = useState<File | null>(null);
  const [egresoImagePreview, setEgresoImagePreview] = useState<string | null>(null);
  const [submittingEgreso, setSubmittingEgreso] = useState(false);

  // Cierre form
  const [montoCierre, setMontoCierre] = useState('');
  const [submittingCierre, setSubmittingCierre] = useState(false);

  const [metodosPago, setMetodosPago] = useState<any[]>([]);

  // Historial state
  const [historialCajas, setHistorialCajas] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialPage, setHistorialPage] = useState(1);
  const [historialLastPage, setHistorialLastPage] = useState(1);

  const fetchCaja = async (desde = fechaDesde, hasta = fechaHasta) => {
    try {
      setLoading(true);
      const [cajaRes, catRes] = await Promise.all([
        api.get('/caja/estado', {
          params: { fecha_desde: desde, fecha_hasta: hasta },
        }),
        api.get('/catalogos'),
      ]);
      setCajaInfo(cajaRes.data);
      setMetodosPago(catRes.data.metodos_pago || []);

      // Only prompt for apertura automatically if NO caja has been opened at all today
      if (cajaRes.data.estado === 'sin_apertura' && cajaRes.data.requiere_apertura) {
        setShowAperturaModal(true);
      }
    } catch (err) {
      console.error('Error fetching caja:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorial = async (page = 1) => {
    try {
      setLoadingHistorial(true);
      const res = await api.get('/caja/historial', {
        params: { page },
      });
      setHistorialCajas(res.data.data || []);
      setHistorialPage(res.data.current_page || 1);
      setHistorialLastPage(res.data.last_page || 1);
    } catch (err) {
      console.error('Error fetching historial:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    fetchCaja();

    const handleCajaUpdated = () => {
      fetchCaja();
    };
    window.addEventListener('caja:updated', handleCajaUpdated);
    return () => window.removeEventListener('caja:updated', handleCajaUpdated);
  }, []);

  useEffect(() => {
    if (activeViewTab === 'historial') {
      fetchHistorial();
    }
  }, [activeViewTab]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCaja(fechaDesde, fechaHasta);
  };

  const handleResetFilter = () => {
    setFechaDesde(todayStr);
    setFechaHasta(todayStr);
    fetchCaja(todayStr, todayStr);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEgresoImageFile(file);
      setEgresoImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEgresoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!egresoForm.descripcion || !egresoForm.monto) return;

    setSubmittingEgreso(true);
    try {
      const formData = new FormData();
      formData.append('descripcion', egresoForm.descripcion);
      formData.append('monto', egresoForm.monto);
      formData.append('id_metodo_pago', egresoForm.id_metodo_pago || '4');
      if (egresoImageFile) {
        formData.append('imagen', egresoImageFile);
      }

      await api.post('/caja/egreso', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      window.dispatchEvent(new CustomEvent('caja:updated'));
      setShowEgresoModal(false);
      setEgresoForm({ descripcion: '', monto: '', id_metodo_pago: '4' });
      setEgresoImageFile(null);
      setEgresoImagePreview(null);
      fetchCaja();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar egreso');
    } finally {
      setSubmittingEgreso(false);
    }
  };

  const handleCierreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCierre(true);
    try {
      const res = await api.post('/caja/cierre', { monto_cierre: Number(montoCierre) });
      window.dispatchEvent(new CustomEvent('caja:updated'));
      setShowCierreModal(false);
      setMontoCierre('');
      setCierreResumen(res.data.resumen);
      setShowCierreSuccessModal(true);
      fetchCaja();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cerrar caja');
    } finally {
      setSubmittingCierre(false);
    }
  };

  const caja = cajaInfo?.caja;
  const isCajaAbierta = cajaInfo?.estado === 'abierta' && !caja?.datetime_cierre;
  const isCajaCerradaHoy = cajaInfo?.estado === 'cerrada_hoy';

  // Live difference in Cierre Modal
  const montoTeorico = Number(cajaInfo?.monto_teorico_efectivo || 0);
  const parsedMontoCierre = parseFloat(montoCierre);
  const liveDiff = !isNaN(parsedMontoCierre) ? Math.round((parsedMontoCierre - montoTeorico) * 100) / 100 : null;

  return (
    <div className="page-container">
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Control de Caja y Egresos
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Gestión de turnos de caja, ingresos en efectivo/digitales, egresos y arqueo de cierre.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isCajaAbierta && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowEgresoModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <MinusCircle size={18} color="#dc2626" />
                Registrar Nuevo Egreso
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setMontoCierre(montoTeorico.toFixed(2));
                  setShowCierreModal(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              >
                <Lock size={18} />
                Cerrar Caja
              </button>
            </>
          )}

          {isCajaCerradaHoy && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowAperturaModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            >
              <PlusCircle size={18} />
              Aperturar Nuevo Turno
            </button>
          )}

          {!isCajaAbierta && !isCajaCerradaHoy && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowAperturaModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <Unlock size={18} />
              Aperturar Caja del Día
            </button>
          )}
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveViewTab('actual')}
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            background: 'transparent',
            border: 'none',
            borderBottom: activeViewTab === 'actual' ? '3px solid var(--primary-color)' : '3px solid transparent',
            color: activeViewTab === 'actual' ? 'var(--primary-color)' : '#64748b',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <DollarSign size={18} />
          Turno Actual / Hoy
        </button>
        <button
          type="button"
          onClick={() => setActiveViewTab('historial')}
          style={{
            padding: '10px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            background: 'transparent',
            border: 'none',
            borderBottom: activeViewTab === 'historial' ? '3px solid var(--primary-color)' : '3px solid transparent',
            color: activeViewTab === 'historial' ? 'var(--primary-color)' : '#64748b',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <History size={18} />
          Historial de Cajas Anteriores
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner text="Consultando balance y estado de caja..." />
      ) : activeViewTab === 'historial' ? (
        /* ================= VISTA HISTORIAL ================= */
        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} color="var(--primary-color)" />
            Historial de Cierres de Caja
          </h3>

          {loadingHistorial ? (
            <LoadingSpinner text="Cargando historial de cajas..." />
          ) : historialCajas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              No se encontraron cierres de caja anteriores.
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha / Hora Apertura</th>
                      <th>Fecha / Hora Cierre</th>
                      <th>Usuario Apertura</th>
                      <th>Usuario Cierre</th>
                      <th style={{ textAlign: 'right' }}>Monto Inicial</th>
                      <th style={{ textAlign: 'right' }}>Monto Cierre Real</th>
                      <th style={{ textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialCajas.map((c: any) => (
                      <tr key={c.id} className="row-item">
                        <td style={{ fontWeight: 700 }}>#{c.id}</td>
                        <td style={{ fontSize: '0.88rem' }}>{new Date(c.datetime_apertura).toLocaleString('es-PE')}</td>
                        <td style={{ fontSize: '0.88rem' }}>
                          {c.datetime_cierre ? new Date(c.datetime_cierre).toLocaleString('es-PE') : 'En curso'}
                        </td>
                        <td>{c.usuario_apertura?.username || 'Sistema'}</td>
                        <td>{c.usuario_cierre?.username || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>S/. {Number(c.monto_apertura).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          {c.monto_cierre !== null ? `S/. ${Number(c.monto_cierre).toFixed(2)}` : '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              background: c.datetime_cierre ? '#dcfce7' : '#fee2e2',
                              color: c.datetime_cierre ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {c.datetime_cierre ? 'Cerrada' : 'Abierta'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historialLastPage > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={historialPage <= 1}
                    onClick={() => fetchHistorial(historialPage - 1)}
                  >
                    Anterior
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9rem', fontWeight: 600 }}>
                    Página {historialPage} de {historialLastPage}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={historialPage >= historialLastPage}
                    onClick={() => fetchHistorial(historialPage + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : isCajaCerradaHoy ? (
        /* ================= VISTA: CAJA CERRADA HOY ================= */
        <div>
          {/* Closed Banner */}
          <div
            style={{
              background: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Caja del Día Cerrada Conforme
                  </h3>
                  <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '2px' }}>
                    Aperturada: <b>{new Date(caja.datetime_apertura).toLocaleTimeString('es-PE')}</b> ({caja.usuario_apertura?.username}) &nbsp;|&nbsp;
                    Cerrada: <b>{new Date(caja.datetime_cierre).toLocaleTimeString('es-PE')}</b> ({caja.usuario_cierre?.username || 'ADMIN'})
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    padding: '8px 16px',
                    borderRadius: '30px',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    background: cajaInfo.cuadre === 'CONFORME' ? '#dcfce7' : (cajaInfo.cuadre === 'SOBRANTE' ? '#e0f2fe' : '#fee2e2'),
                    color: cajaInfo.cuadre === 'CONFORME' ? '#15803d' : (cajaInfo.cuadre === 'SOBRANTE' ? '#0369a1' : '#b91c1c'),
                  }}
                >
                  {cajaInfo.cuadre === 'CONFORME' && '✓ ARQUEO CUADRADO'}
                  {cajaInfo.cuadre === 'SOBRANTE' && `ℹ SOBRANTE (+S/. ${Number(cajaInfo.diferencia).toFixed(2)})`}
                  {cajaInfo.cuadre === 'FALTANTE' && `⚠ FALTANTE (-S/. ${Math.abs(Number(cajaInfo.diferencia)).toFixed(2)})`}
                </span>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowAperturaModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <PlusCircle size={16} /> Aperturar Nuevo Turno
                </button>
              </div>
            </div>

            {/* Quick Metrics of Closed Caja */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>Monto Inicial:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  S/. {Number(cajaInfo.monto_inicial || 0).toFixed(2)}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#047857', fontSize: '0.82rem', fontWeight: 600 }}>Ingresos en Efectivo:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  + S/. {Number(cajaInfo.ingresos_efectivo || 0).toFixed(2)}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#b91c1c', fontSize: '0.82rem', fontWeight: 600 }}>Gastos en Efectivo:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                  - S/. {Number(cajaInfo.egresos_efectivo || 0).toFixed(2)}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#6d28d9', fontSize: '0.82rem', fontWeight: 600 }}>Ingresos YAPE / PLIN:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
                  + S/. {Number(cajaInfo.ingresos_yape_plin || 0).toFixed(2)}
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1.5px solid #86efac' }}>
                <div style={{ color: '#166534', fontSize: '0.82rem', fontWeight: 700 }}>Conteo Físico Real de Cierre:</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
                  S/. {Number(cajaInfo.monto_cierre_real || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 700, color: '#334155' }}>
                <span>Monto Teórico Esperado en Efectivo:</span>
                <span style={{ color: '#0f172a' }}>S/. {Number(cajaInfo.monto_teorico_efectivo || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 700, color: '#334155' }}>
                <span>Monto Físico Real Contado y Entregado:</span>
                <span style={{ color: '#15803d' }}>S/. {Number(cajaInfo.monto_cierre_real || 0).toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800 }}>
                <span>Diferencia de Arqueo (Cuadre):</span>
                <span style={{ color: cajaInfo.diferencia === 0 ? '#15803d' : (cajaInfo.diferencia > 0 ? '#0284c7' : '#dc2626') }}>
                  {cajaInfo.diferencia >= 0 ? `+ S/. ${Number(cajaInfo.diferencia).toFixed(2)}` : `- S/. ${Math.abs(Number(cajaInfo.diferencia)).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : !isCajaAbierta ? (
        /* ================= VISTA: SIN APERTURA ================= */
        <div
          className="glass-panel"
          style={{
            maxWidth: '560px',
            margin: '40px auto',
            padding: 'clamp(24px, 5vw, 40px)',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              background: 'rgba(220, 38, 38, 0.1)',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <Lock size={36} />
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            No se ha aperturado la caja el día de hoy
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: 1.5 }}>
            Para registrar comprobantes, abonos de clientes o gastos de caja chica, debe aperturar la caja indicando el monto inicial en efectivo físico.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAperturaModal(true)}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              fontSize: '1.05rem',
              fontWeight: 700,
            }}
          >
            <Unlock size={20} /> Aperturar Caja de Hoy
          </button>
        </div>
      ) : (
        /* ================= VISTA: CAJA ABIERTA (EN CURSO) ================= */
        <div>
          {/* Box 1: Resumen Consolidado */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              marginBottom: '28px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #f1f5f9',
                paddingBottom: '12px',
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <DollarSign size={22} color="#059669" />
                Resumen Consolidado (Efectivo y YAPE/PLIN)
              </h3>
              <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
                Caja Abierta desde:{' '}
                <strong style={{ color: '#0f172a' }}>
                  {new Date(caja.datetime_apertura).toLocaleString('es-PE')}
                </strong>{' '}
                por{' '}
                <span style={{ color: 'var(--primary-color)' }}>
                  {caja.usuario_apertura?.username || caja.usuario_apertura?.name || 'Usuario'}
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              {/* Monto Inicial */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                  Monto Inicial (Apertura de Hoy):
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  S/. {Number(cajaInfo.monto_inicial || 0).toFixed(2)}
                </div>
              </div>

              {/* 1. Ingresos Efectivo */}
              <div
                style={{
                  background: 'rgba(5, 150, 105, 0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(5, 150, 105, 0.2)',
                }}
              >
                <div style={{ color: '#047857', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={14} /> 1. Total Ingresos Efectivo (Filtrados):
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  + S/. {Number(cajaInfo.ingresos_efectivo || 0).toFixed(2)}
                </div>
              </div>

              {/* 3. Gastos / Egresos Efectivo */}
              <div
                style={{
                  background: 'rgba(220, 38, 38, 0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                }}
              >
                <div style={{ color: '#b91c1c', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MinusCircle size={14} /> 3. Total Gastos / Egresos en Efectivo:
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                  - S/. {Number(cajaInfo.egresos_efectivo || 0).toFixed(2)}
                </div>
              </div>

              {/* 2. Ingresos YAPE / PLIN */}
              <div
                style={{
                  background: 'rgba(124, 58, 237, 0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                }}
              >
                <div style={{ color: '#6d28d9', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Smartphone size={14} /> 2. Total Ingresos YAPE / PLIN:
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
                  + S/. {Number(cajaInfo.ingresos_yape_plin || 0).toFixed(2)}
                </div>
              </div>

              {/* 4. Gastos / Egresos YAPE / PLIN */}
              <div
                style={{
                  background: 'rgba(234, 88, 12, 0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(234, 88, 12, 0.2)',
                }}
              >
                <div style={{ color: '#c2410c', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MinusCircle size={14} /> 4. Total Gastos YAPE / PLIN:
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
                  - S/. {Number(cajaInfo.egresos_yape_plin || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Totals & Grand Summary Line */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '18px 20px',
                border: '1px solid #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                <span>&gt;&gt; TOTAL INGRESOS (Día(s) Filtrado(s)):</span>
                <span style={{ color: '#059669' }}>S/. {Number(cajaInfo.total_ingresos || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                <span>&gt;&gt; TOTAL EGRESOS (Día(s) Filtrado(s)):</span>
                <span style={{ color: '#dc2626' }}>S/. {Number(cajaInfo.total_egresos || 0).toFixed(2)}</span>
              </div>
              <div
                style={{
                  borderTop: '2px dashed #94a3b8',
                  paddingTop: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <span>Monto Teórico Actual en Caja (Solo Efectivo):</span>
                <span
                  style={{
                    background: '#047857',
                    color: '#ffffff',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    fontSize: '1.3rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  S/. {Number(cajaInfo.monto_teorico_efectivo || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Box 2: Detalle de Gastos / Egresos */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Filter Bar */}
            <form
              onSubmit={handleFilter}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '20px',
                background: '#f8fafc',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                Detalle de Gastos / Egresos:
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Desde:</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.85rem', width: 'auto' }}
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Hasta:</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.85rem', width: 'auto' }}
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '6px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Filter size={14} /> Filtrar
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleResetFilter}
                style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Hoy
              </button>

              <div style={{ marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEgresoModal(true)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#dc2626',
                    borderColor: '#fecaca',
                    background: '#fff1f2',
                  }}
                >
                  <MinusCircle size={16} /> Registrar Nuevo Egreso
                </button>
              </div>
            </form>

            {/* Egresos Table */}
            {!cajaInfo?.egresos || cajaInfo.egresos.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  color: 'var(--text-muted)',
                  background: '#f8fafc',
                  borderRadius: '12px',
                }}
              >
                <FileText size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>
                  No hay gastos o egresos registrados en el rango de fechas seleccionado.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '160px' }}>Fecha / Hora</th>
                      <th>Descripción / Motivo</th>
                      <th style={{ width: '130px' }}>Monto (S/.)</th>
                      <th style={{ width: '130px' }}>Método</th>
                      <th style={{ width: '130px' }}>Usuario</th>
                      <th style={{ width: '110px', textAlign: 'center' }}>Imagen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cajaInfo.egresos.map((eg: any) => (
                      <tr key={eg.id} className="row-item">
                        <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                          {new Date(eg.fecha).toLocaleString('es-PE')}
                        </td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{eg.descripcion}</td>
                        <td style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.98rem' }}>
                          - S/. {Number(eg.monto).toFixed(2)}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              background: eg.id_metodo_pago === 1 ? '#ede9fe' : '#f1f5f9',
                              color: eg.id_metodo_pago === 1 ? '#6d28d9' : '#334155',
                            }}
                          >
                            {String(eg.metodo_pago?.nom_metodo_pago || 'EFECTIVO').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {eg.usuario?.username || eg.usuario?.name || 'Sistema'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {eg.imagen_path ? (
                            <button
                              type="button"
                              onClick={() => setSelectedImage(`/storage/${eg.imagen_path}`)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                color: 'var(--primary-color)',
                                fontWeight: 600,
                              }}
                            >
                              <Eye size={13} /> Ver
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ninguna</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Apertura de Caja */}
      <AperturaCajaModal
        isOpen={showAperturaModal}
        onClose={() => setShowAperturaModal(false)}
        onSuccess={() => fetchCaja()}
      />

      {/* Modal 2: Registrar Egreso / Gasto */}
      {showEgresoModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setShowEgresoModal(false)}>
          <div
            className="glass-panel modal-content"
            style={{
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <MinusCircle size={20} color="#dc2626" />
                Registrar Egreso / Gasto
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEgresoModal(false)}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEgresoSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Descripción del Gasto: *
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  autoFocus
                  placeholder="EJ: BOLSAS, JABÓN LÍQUIDO, ALMUERZO PERSONAL"
                  value={egresoForm.descripcion}
                  onChange={(e) => setEgresoForm({ ...egresoForm, descripcion: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Monto a retirar (S/.): *
                </label>
                <input
                  type="number"
                  step="0.10"
                  min="0.01"
                  className="form-input"
                  required
                  placeholder="0.00"
                  value={egresoForm.monto}
                  onChange={(e) => setEgresoForm({ ...egresoForm, monto: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Método de Pago:
                </label>
                <select
                  className="form-select"
                  value={egresoForm.id_metodo_pago}
                  onChange={(e) => setEgresoForm({ ...egresoForm, id_metodo_pago: e.target.value })}
                >
                  <option value="4">EFECTIVO</option>
                  <option value="1">YAPE / PLIN</option>
                  {metodosPago
                    .filter((mp) => mp.id !== 4 && mp.id !== 1)
                    .map((mp: any) => (
                      <option key={mp.id} value={mp.id}>
                        {String(mp.nom_metodo_pago || '').toUpperCase()}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Adjuntar Imagen / Comprobante:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label
                    className="btn-secondary"
                    style={{
                      cursor: 'pointer',
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ImageIcon size={16} />
                    Adjuntar Imagen...
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                  </label>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {egresoImageFile ? egresoImageFile.name : 'Ninguna'}
                  </span>
                </div>

                {egresoImagePreview && (
                  <div style={{ marginTop: '12px' }}>
                    <img
                      src={egresoImagePreview}
                      alt="Preview"
                      style={{
                        maxHeight: '120px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEgresoModal(false)}
                  disabled={submittingEgreso}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingEgreso}
                  style={{ fontWeight: 700 }}
                >
                  {submittingEgreso ? 'Guardando...' : 'Aceptar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Cerrar Caja (Arqueo con Cuadre en Vivo) */}
      {showCierreModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setShowCierreModal(false)}>
          <div
            className="glass-panel modal-content"
            style={{
              maxWidth: '520px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#dc2626',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Lock size={22} /> Arqueo y Cierre de Caja
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCierreModal(false)}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Calculations Breakdown */}
            <div
              style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '0.92rem',
                color: '#334155',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Monto Inicial (Efectivo Apertura):</span>
                <strong>S/. {Number(cajaInfo?.monto_inicial || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#047857' }}>+ Ingresos en Efectivo:</span>
                <strong style={{ color: '#059669' }}>+ S/. {Number(cajaInfo?.ingresos_efectivo || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#b91c1c' }}>- Gastos / Egresos en Efectivo:</span>
                <strong style={{ color: '#dc2626' }}>- S/. {Number(cajaInfo?.egresos_efectivo || 0).toFixed(2)}</strong>
              </div>
              <div
                style={{
                  borderTop: '2px solid #cbd5e1',
                  paddingTop: '10px',
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                }}
              >
                <span>Monto Teórico Esperado:</span>
                <span style={{ color: '#047857', fontSize: '1.25rem' }}>
                  S/. {montoTeorico.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCierreSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontWeight: 800, margin: 0 }}>
                    Monto Real Contado en Caja (S/.): *
                  </label>
                  <button
                    type="button"
                    onClick={() => setMontoCierre(montoTeorico.toFixed(2))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-color)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Usar Monto Teórico (Caja Cuadrada)
                  </button>
                </div>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  className="form-input"
                  required
                  autoFocus
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    padding: '12px 14px',
                    borderColor: liveDiff === null ? '#cbd5e1' : (liveDiff === 0 ? '#22c55e' : (liveDiff < 0 ? '#ef4444' : '#0284c7')),
                  }}
                  placeholder="0.00"
                  value={montoCierre}
                  onChange={(e) => setMontoCierre(e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              {/* Live Arqueo Differential Indicator */}
              {liveDiff !== null && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    background: liveDiff === 0 ? '#dcfce7' : (liveDiff > 0 ? '#e0f2fe' : '#fee2e2'),
                    color: liveDiff === 0 ? '#15803d' : (liveDiff > 0 ? '#0369a1' : '#b91c1c'),
                    border: `1px solid ${liveDiff === 0 ? '#86efac' : (liveDiff > 0 ? '#7dd3fc' : '#fca5a5')}`,
                  }}
                >
                  {liveDiff === 0 && (
                    <>
                      <CheckCircle2 size={20} />
                      <span>Caja Cuadrada Conforme: Conteo físico coincide exactamente.</span>
                    </>
                  )}
                  {liveDiff < 0 && (
                    <>
                      <AlertTriangle size={20} />
                      <span>Faltante de Caja: - S/. {Math.abs(liveDiff).toFixed(2)} respecto al teórico.</span>
                    </>
                  )}
                  {liveDiff > 0 && (
                    <>
                      <PlusCircle size={20} />
                      <span>Sobrante de Caja: + S/. {liveDiff.toFixed(2)} respecto al teórico.</span>
                    </>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCierreModal(false)}
                  disabled={submittingCierre}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-danger"
                  disabled={submittingCierre || !montoCierre}
                  style={{ fontWeight: 800, padding: '10px 20px' }}
                >
                  {submittingCierre ? 'Guardando Cierre...' : 'Confirmar Cierre Definitivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Resumen de Cierre Exitoso */}
      {showCierreSuccessModal && cierreResumen && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div
            className="glass-panel modal-content"
            style={{
              maxWidth: '500px',
              width: '90%',
              padding: '28px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: cierreResumen.cuadre === 'CONFORME' ? '#dcfce7' : '#fee2e2',
                color: cierreResumen.cuadre === 'CONFORME' ? '#15803d' : '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              Caja Cerrada Exitosamente
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
              Turno #{cierreResumen.id_caja} finalizado por <b>{cierreResumen.usuario_cierre}</b>.
            </p>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                border: '1px solid #e2e8f0',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.92rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Monto Inicial:</span>
                <strong>S/. {Number(cierreResumen.monto_inicial).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#047857' }}>Ingresos en Efectivo:</span>
                <strong style={{ color: '#059669' }}>+ S/. {Number(cierreResumen.ingresos_efectivo).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#b91c1c' }}>Gastos en Efectivo:</span>
                <strong style={{ color: '#dc2626' }}>- S/. {Number(cierreResumen.egresos_efectivo).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span style={{ fontWeight: 700 }}>Monto Teórico Esperado:</span>
                <strong>S/. {Number(cierreResumen.monto_teorico_efectivo).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Conteo Físico Real Entregado:</span>
                <strong style={{ color: '#15803d', fontSize: '1.05rem' }}>
                  S/. {Number(cierreResumen.monto_cierre_real).toFixed(2)}
                </strong>
              </div>
              <div
                style={{
                  borderTop: '2px dashed #cbd5e1',
                  paddingTop: '8px',
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                }}
              >
                <span>Resultado Arqueo:</span>
                <span
                  style={{
                    color: cierreResumen.cuadre === 'CONFORME' ? '#15803d' : (cierreResumen.cuadre === 'SOBRANTE' ? '#0369a1' : '#dc2626'),
                  }}
                >
                  {cierreResumen.cuadre === 'CONFORME' && '✓ CAJA CUADRADA'}
                  {cierreResumen.cuadre === 'SOBRANTE' && `SOBRANTE (+S/. ${Number(cierreResumen.diferencia).toFixed(2)})`}
                  {cierreResumen.cuadre === 'FALTANTE' && `FALTANTE (-S/. ${Math.abs(Number(cierreResumen.diferencia)).toFixed(2)})`}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setShowCierreSuccessModal(false);
                setCierreResumen(null);
              }}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontWeight: 800, fontSize: '1rem' }}
            >
              Aceptar y Ver Resumen
            </button>
          </div>
        </div>
      )}

      {/* Modal 5: Image Viewer Modal */}
      {selectedImage && (
        <div
          className="modal-overlay"
          style={{ zIndex: 10000 }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Comprobante de Egreso"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: '8px',
                objectFit: 'contain',
              }}
            />
            <div style={{ textAlign: 'right', marginTop: '12px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedImage(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
