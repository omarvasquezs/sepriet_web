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
} from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AperturaCajaModal } from '../components/AperturaCajaModal';

export const CajaPage: React.FC = () => {
  const [cajaInfo, setCajaInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [showEgresoModal, setShowEgresoModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
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
      if (cajaRes.data.requiere_apertura) {
        setShowAperturaModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaja();
  }, []);

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
      await api.post('/caja/cierre', { monto_cierre: Number(montoCierre) });
      setShowCierreModal(false);
      setMontoCierre('');
      fetchCaja();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cerrar caja');
    } finally {
      setSubmittingCierre(false);
    }
  };

  const caja = cajaInfo?.caja;
  const isCajaAbierta = !!caja && !caja.datetime_cierre;

  return (
    <div className="page-container">
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Estado de Caja y Egresos
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Control diario de efectivo físico, ingresos digitales y gastos de caja chica.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {isCajaAbierta ? (
            <>
              <button
                className="btn-secondary"
                onClick={() => setShowEgresoModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <MinusCircle size={18} color="#dc2626" />
                Registrar Nuevo Egreso
              </button>
              <button
                className="btn-danger"
                onClick={() => setShowCierreModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Lock size={18} />
                Cerrar Caja
              </button>
            </>
          ) : (
            <button
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

      {loading ? (
        <LoadingSpinner text="Cargando estado de caja y consolidados..." />
      ) : !isCajaAbierta ? (
        // Estado: Caja Cerrada
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
        // Estado: Caja Abierta con Resumen Consolidado (Screenshot 4)
        <div>
          {/* Box 1: Resumen Consolidado (Efectivo y YAPE/PLIN) */}
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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

            {/* Totals & Grand Summary Line (Exact copy from Java Screenshot 4) */}
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

          {/* Box 2: Detalle de Gastos / Egresos (Screenshot 4) */}
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
                            {eg.metodo_pago?.nom_metodo_pago || 'EFECTIVO'}
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

      {/* Modal 1: Apertura de Caja (Matches Screenshot 1 & 2) */}
      <AperturaCajaModal
        isOpen={showAperturaModal}
        onClose={() => setShowAperturaModal(false)}
        onSuccess={() => fetchCaja()}
      />

      {/* Modal 2: Registrar Egreso / Gasto (Matches Screenshot 5) */}
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
                        {mp.nom_metodo_pago}
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

      {/* Modal 3: Cerrar Caja */}
      {showCierreModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setShowCierreModal(false)}>
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
                  color: '#dc2626',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Lock size={20} /> Cierre de Caja
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

            <div
              style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '10px',
                marginBottom: '18px',
                fontSize: '0.9rem',
                color: '#334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Monto Inicial:</span>
                <strong>S/. {Number(cajaInfo?.monto_inicial || 0).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Monto Teórico Efectivo:</span>
                <strong style={{ color: '#059669' }}>
                  S/. {Number(cajaInfo?.monto_teorico_efectivo || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            <form onSubmit={handleCierreSubmit}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Monto de Cierre Real / Conteo Físico (S/.): *
                </label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  className="form-input"
                  required
                  autoFocus
                  placeholder={`Ej: ${Number(cajaInfo?.monto_teorico_efectivo || 0).toFixed(2)}`}
                  value={montoCierre}
                  onChange={(e) => setMontoCierre(e.target.value)}
                />
              </div>

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
                  disabled={submittingCierre}
                  style={{ fontWeight: 700 }}
                >
                  {submittingCierre ? 'Cerrando...' : 'Confirmar Cierre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Image Viewer Modal */}
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
