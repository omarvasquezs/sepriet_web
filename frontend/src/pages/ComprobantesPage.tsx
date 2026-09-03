import React, { useEffect, useState } from 'react';
import { Search, Plus, Printer, DollarSign, Trash2, ChevronLeft, ChevronRight, MessageSquare, Calendar, FileText } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { WhatsAppModal } from '../components/WhatsAppModal';
import { LoadingSpinner } from '../components/LoadingSpinner';

const toDateTimeLocal = (d: Date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const ComprobantesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role_id === 1) || Boolean(user?.role && user.role.toLowerCase().includes('admin'));

  const [comprobantesData, setComprobantesData] = useState<any>({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [catalogos, setCatalogos] = useState<any>({ estados_pago: [], estados_ropa: [], metodos_pago: [] });

  const [search, setSearch] = useState('');
  const [estadoPagoFilter, setEstadoPagoFilter] = useState('');
  const [estadoRopaFilter, setEstadoRopaFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // WhatsApp Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppTicket, setWhatsAppTicket] = useState<any>(null);
  const [whatsAppActionType, setWhatsAppActionType] = useState<'ticket' | 'listo' | 'recogido'>('ticket');

  // Operation Dates (Admin only)
  const [fechaOperacionCreate, setFechaOperacionCreate] = useState(toDateTimeLocal());
  const [fechaOperacionAbono, setFechaOperacionAbono] = useState(toDateTimeLocal());

  // Abono Form
  const [abonoAmount, setAbonoAmount] = useState('');
  const [abonoMetodoPago, setAbonoMetodoPago] = useState('4');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    tipo_comprobante: 'N',
    cliente_id: '',
    metodo_pago_id: '4', // Efectivo
    descuento: '0.00',
    monto_abonado: '0.00',
    observaciones: '',
    num_ruc: '',
    razon_social: '',
    detalles: [
      { servicio_id: '', peso_kg: '1.00', costo_kilo: '0.00' }
    ]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, cliRes, servRes, catRes] = await Promise.all([
        api.get('/comprobantes', {
          params: {
            search,
            estado_comprobante_id: estadoPagoFilter,
            estado_ropa_id: estadoRopaFilter,
            page
          }
        }),
        api.get('/clientes', { params: { per_page: 100 } }),
        api.get('/servicios', { params: { habilitado: true } }),
        api.get('/catalogos')
      ]);

      setComprobantesData(compRes.data);
      setClientes(cliRes.data.data || cliRes.data);
      setServicios(servRes.data);
      setCatalogos(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, estadoPagoFilter, estadoRopaFilter, page]);

  const handleAddDetalle = () => {
    setCreateForm(prev => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        { servicio_id: '', peso_kg: '1.00', costo_kilo: '0.00' }
      ]
    }));
  };

  const handleRemoveDetalle = (index: number) => {
    if (createForm.detalles.length === 1) return;
    setCreateForm(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }));
  };

  const handleSelectServicio = (index: number, servicioId: string) => {
    const s = servicios.find(item => item.id === Number(servicioId));
    setCreateForm(prev => {
      const newDetalles = [...prev.detalles];
      newDetalles[index] = {
        ...newDetalles[index],
        servicio_id: servicioId,
        costo_kilo: s?.precio_kilo ? String(s.precio_kilo) : '0.00',
        peso_kg: newDetalles[index].peso_kg || '1.00'
      };
      return { ...prev, detalles: newDetalles };
    });
  };

  const calculateTotal = () => {
    let subtotal = 0;
    createForm.detalles.forEach(d => {
      subtotal += Number(d.peso_kg || 0) * Number(d.costo_kilo || 0);
    });
    const desc = Number(createForm.descuento || 0);
    return Math.max(0, subtotal - desc);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...createForm,
        cliente_id: Number(createForm.cliente_id),
        metodo_pago_id: Number(createForm.metodo_pago_id),
        descuento: Number(createForm.descuento),
        monto_abonado: Number(createForm.monto_abonado),
        detalles: createForm.detalles.map(d => ({
          servicio_id: Number(d.servicio_id),
          peso_kg: Number(d.peso_kg),
          costo_kilo: Number(d.costo_kilo),
        }))
      };

      if (isAdmin && fechaOperacionCreate) {
        payload.fecha_operacion = fechaOperacionCreate;
      }

      const res = await api.post('/comprobantes', payload);
      const createdTicket = res.data;

      setShowCreateModal(false);
      setPage(1);
      fetchData();

      // Open WhatsApp sending dialog with the new ticket details
      setWhatsAppTicket(createdTicket);
      setWhatsAppActionType('ticket');
      setShowWhatsAppModal(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar comprobante');
    }
  };

  const handleAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      const payload: any = {
        monto_abonado: Number(abonoAmount),
        metodo_pago_id: Number(abonoMetodoPago)
      };

      if (isAdmin && fechaOperacionAbono) {
        payload.fecha_operacion = fechaOperacionAbono;
      }

      const res = await api.post(`/comprobantes/${selectedTicket.id}/abono`, payload);
      const updatedTicket = res.data;

      setShowAbonoModal(false);
      setAbonoAmount('');
      fetchData();

      // Offer WhatsApp receipt update
      setWhatsAppTicket(updatedTicket);
      setWhatsAppActionType('ticket');
      setShowWhatsAppModal(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar abono');
    }
  };

  const handleEstadoRopaChange = async (ticket: any, estadoRopaId: string) => {
    try {
      const numericEstado = Number(estadoRopaId);
      const res = await api.put(`/comprobantes/${ticket.id}/estado`, { estado_ropa_id: numericEstado });
      const updated = res.data;
      fetchData();

      // If marked as Listo (id=3) or Entregado/Recogido (id=4), prompt for WhatsApp notification
      if (numericEstado === 3) {
        setWhatsAppTicket(updated);
        setWhatsAppActionType('listo');
        setShowWhatsAppModal(true);
      } else if (numericEstado === 4) {
        setWhatsAppTicket(updated);
        setWhatsAppActionType('recogido');
        setShowWhatsAppModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPdf = async (ticketId: number) => {
    try {
      const res = await api.get(`/comprobantes/${ticketId}/pdf`);
      if (res.data?.url) {
        window.open(res.data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'No se pudo generar el comprobante en PDF');
    }
  };

  const getBadgeClassPago = (nombre: string) => {
    switch (nombre?.toUpperCase()) {
      case 'CANCELADO': return 'badge-listo';
      case 'ABONO': return 'badge-proceso';
      case 'DEBE': return 'badge-pendiente';
      case 'ANULADO': return 'badge-cancelado';
      default: return 'badge-pendiente';
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '750px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '42px' }}
              placeholder="Buscar ticket, DNI, cliente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select
            className="form-select"
            value={estadoPagoFilter}
            onChange={(e) => { setEstadoPagoFilter(e.target.value); setPage(1); }}
          >
            <option value="">Pago: Todos</option>
            {catalogos.estados_pago.map((ep: any) => (
              <option key={ep.id} value={ep.id}>{ep.nom_estado || ep.nombre}</option>
            ))}
          </select>

          <select
            className="form-select"
            value={estadoRopaFilter}
            onChange={(e) => { setEstadoRopaFilter(e.target.value); setPage(1); }}
          >
            <option value="">Prendas: Todos</option>
            {catalogos.estados_ropa.map((er: any) => (
              <option key={er.id} value={er.id}>{er.nom_estado_ropa || er.nombre}</option>
            ))}
          </select>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setFechaOperacionCreate(toDateTimeLocal());
            setShowCreateModal(true);
          }}
        >
          <Plus size={18} /> Registrar Comprobante
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '16px' }}>
        {loading ? (
          <LoadingSpinner text="Cargando comprobantes y tickets..." />
        ) : comprobantesData.data.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No se encontraron comprobantes con esos filtros.</p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Estado Pago</th>
                  <th>Estado Ropa</th>
                  <th>Total</th>
                  <th>Abonado</th>
                  <th>Restante</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {comprobantesData.data.map((t: any) => (
                  <tr key={t.id} className="row-item">
                    <td style={{ fontWeight: 700, color: '#4f46e5' }}>{t.cod_comprobante || `N° ${t.id}`}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.cliente?.nombres || 'Cliente Genérico'}</td>
                    <td>{new Date(t.fecha).toLocaleDateString('es-PE')}</td>
                    <td>
                      <span className={`badge ${getBadgeClassPago(t.estado_comprobante?.nom_estado || t.estado_comprobante?.nombre)}`}>
                        {t.estado_comprobante?.nom_estado || t.estado_comprobante?.nombre || 'DEBE'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '4px 8px', fontSize: '0.78rem', fontWeight: 600 }}
                        value={t.estado_ropa_id || 1}
                        onChange={(e) => handleEstadoRopaChange(t, e.target.value)}
                      >
                        {catalogos.estados_ropa.map((er: any) => (
                          <option key={er.id} value={er.id}>{er.nom_estado_ropa || er.nombre}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>S/ {Number(t.costo_total).toFixed(2)}</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>S/ {Number(t.monto_abonado).toFixed(2)}</td>
                    <td style={{ color: Number(t.monto_restante) > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                      S/ {Number(t.monto_restante).toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {Number(t.monto_restante) > 0 && (
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            title="Registrar Abono"
                            onClick={() => {
                              setSelectedTicket(t);
                              setFechaOperacionAbono(toDateTimeLocal());
                              setAbonoMetodoPago('4');
                              setShowAbonoModal(true);
                            }}
                          >
                            <DollarSign size={14} color="#059669" /> Abono
                          </button>
                        )}
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                          title="Enviar por WhatsApp"
                          onClick={() => {
                            setWhatsAppTicket(t);
                            setWhatsAppActionType('ticket');
                            setShowWhatsAppModal(true);
                          }}
                        >
                          <MessageSquare size={14} />
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff' }}
                          title="Descargar / Ver PDF"
                          onClick={() => handleDownloadPdf(t.id)}
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px' }}
                          title="Imprimir / Vista Previa"
                          onClick={() => {
                            setSelectedTicket(t);
                            setShowPrintModal(true);
                          }}
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Mostrando página {comprobantesData.current_page} de {comprobantesData.last_page} ({comprobantesData.total} tickets en total)
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  style={{ opacity: page <= 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <button
                  className="btn-secondary"
                  disabled={page >= comprobantesData.last_page}
                  onClick={() => setPage(prev => prev + 1)}
                  style={{ opacity: page >= comprobantesData.last_page ? 0.5 : 1 }}
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Registrar Comprobante */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Registrar Nuevo Comprobante</h3>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1.5fr 1.5fr' : '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Comprobante *</label>
                  <select
                    className="form-select"
                    value={createForm.tipo_comprobante}
                    onChange={(e) => setCreateForm({ ...createForm, tipo_comprobante: e.target.value })}
                  >
                    <option value="N">Nota de Venta (NV)</option>
                    <option value="B">Boleta de Venta (BV)</option>
                    <option value="F">Factura (FV)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <select
                    className="form-select"
                    required
                    value={createForm.cliente_id}
                    onChange={(e) => setCreateForm({ ...createForm, cliente_id: e.target.value })}
                  >
                    <option value="">Seleccione un cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombres} ({c.dni || 'Sin DNI'})</option>
                    ))}
                  </select>
                </div>

                {isAdmin && (
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5' }}>
                      <Calendar size={14} /> Fecha de Operación (Admin)
                    </label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={fechaOperacionCreate}
                      onChange={(e) => setFechaOperacionCreate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {createForm.tipo_comprobante === 'F' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">RUC *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={createForm.num_ruc}
                      onChange={(e) => setCreateForm({ ...createForm, num_ruc: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Razón Social *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={createForm.razon_social}
                      onChange={(e) => setCreateForm({ ...createForm, razon_social: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '16px', marginBottom: '12px' }}>Detalles de Servicios</h4>

              {createForm.detalles.map((det, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '14px', marginBottom: '12px', background: '#f8fafc' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                    <select
                      className="form-select"
                      required
                      value={det.servicio_id}
                      onChange={(e) => handleSelectServicio(idx, e.target.value)}
                    >
                      <option value="">Seleccionar Servicio...</option>
                      {servicios.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nom_servicio} ({s.tipo_servicio === 'k' || s.tipo_servicio === 'Kilo' ? 'Kilo' : s.tipo_servicio === 's' ? 'Servicio' : 'Prenda'}) - S/ {Number(s.precio_kilo || s.precio_unidad).toFixed(2)}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="Peso / Cant"
                      value={det.peso_kg}
                      onChange={(e) => {
                        const newD = [...createForm.detalles];
                        newD[idx].peso_kg = e.target.value;
                        setCreateForm({ ...createForm, detalles: newD });
                      }}
                    />

                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="Precio Unit"
                      value={det.costo_kilo}
                      onChange={(e) => {
                        const newD = [...createForm.detalles];
                        newD[idx].costo_kilo = e.target.value;
                        setCreateForm({ ...createForm, detalles: newD });
                      }}
                    />

                    <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem', textAlign: 'right' }}>
                      S/ {(Number(det.peso_kg || 0) * Number(det.costo_kilo || 0)).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDetalle(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" className="btn-secondary" onClick={handleAddDetalle} style={{ marginBottom: '20px' }}>
                + Agregar Fila
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', background: '#f8fafc', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Descuento (S/)</label>
                  <input
                    type="number"
                    step="0.50"
                    className="form-input"
                    value={createForm.descuento}
                    onChange={(e) => setCreateForm({ ...createForm, descuento: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Monto Abonado (S/)</label>
                  <input
                    type="number"
                    step="0.50"
                    className="form-input"
                    value={createForm.monto_abonado}
                    onChange={(e) => setCreateForm({ ...createForm, monto_abonado: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Método de Pago</label>
                  <select
                    className="form-select"
                    value={createForm.metodo_pago_id}
                    onChange={(e) => setCreateForm({ ...createForm, metodo_pago_id: e.target.value })}
                  >
                    {catalogos.metodos_pago.map((mp: any) => (
                      <option key={mp.id} value={mp.id}>{mp.nom_metodo_pago}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Notas adicionales..."
                  value={createForm.observaciones}
                  onChange={(e) => setCreateForm({ ...createForm, observaciones: e.target.value })}
                />
              </div>

              <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Total a Pagar: <span style={{ color: '#4f46e5' }}>S/ {calculateTotal().toFixed(2)}</span>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Generar Comprobante</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Abono */}
      {showAbonoModal && selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              Registrar Abono a {selectedTicket.cod_comprobante}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Monto pendiente: <b style={{ color: '#dc2626' }}>S/ {Number(selectedTicket.monto_restante).toFixed(2)}</b>
            </p>

            <form onSubmit={handleAbonoSubmit}>
              <div className="form-group">
                <label className="form-label">Monto a Abonar (S/) *</label>
                <input
                  type="number"
                  step="0.10"
                  className="form-input"
                  required
                  max={selectedTicket.monto_restante}
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Método de Pago *</label>
                <select
                  className="form-select"
                  required
                  value={abonoMetodoPago}
                  onChange={(e) => setAbonoMetodoPago(e.target.value)}
                >
                  {catalogos.metodos_pago.map((mp: any) => (
                    <option key={mp.id} value={mp.id}>{mp.nom_metodo_pago}</option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5' }}>
                    <Calendar size={14} /> Fecha de Operación (Admin)
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={fechaOperacionAbono}
                    onChange={(e) => setFechaOperacionAbono(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAbonoModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar Abono</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Print Preview */}
      {showPrintModal && selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ background: '#ffffff', color: '#000000', fontFamily: 'monospace', maxWidth: '480px' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '12px', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>LAVANDERIA SEPRIET</h2>
              <p style={{ fontSize: '0.8rem' }}>Enrique Nerini 995, San Luis 15021</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '6px' }}>{selectedTicket.cod_comprobante || `Ticket #${selectedTicket.id}`}</p>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
              <p><b>CLIENTE:</b> {selectedTicket.cliente?.nombres}</p>
              <p><b>DNI/DOC:</b> {selectedTicket.cliente?.dni || 'N/A'}</p>
              <p><b>FECHA:</b> {new Date(selectedTicket.fecha).toLocaleString('es-PE')}</p>
              <p><b>ESTADO PAGO:</b> {selectedTicket.estado_comprobante?.nom_estado || selectedTicket.estado_comprobante?.nombre}</p>
              <p><b>ESTADO PRENDA:</b> {selectedTicket.estado_ropa?.nom_estado_ropa || selectedTicket.estado_ropa?.nombre}</p>
            </div>

            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', marginBottom: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                  <th>KG/CANT</th>
                  <th>SERVICIO</th>
                  <th style={{ textAlign: 'right' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {selectedTicket.detalles?.map((d: any, idx: number) => (
                  <tr key={idx}>
                    <td>{d.peso_kg}</td>
                    <td>{d.servicio?.nom_servicio || 'Servicio'}</td>
                    <td style={{ textAlign: 'right' }}>S/ {Number(d.subtotal || (d.peso_kg * d.costo_kilo)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '2px dashed #000', paddingTop: '8px', textAlign: 'right', fontSize: '0.85rem' }}>
              <p>TOTAL: S/ {Number(selectedTicket.costo_total).toFixed(2)}</p>
              <p>ABONADO: S/ {Number(selectedTicket.monto_abonado).toFixed(2)}</p>
              <p style={{ fontWeight: 800 }}>PENDIENTE: S/ {Number(selectedTicket.monto_restante).toFixed(2)}</p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.72rem', color: '#444' }}>
              <p>* El tiempo máximo para recoger su prenda es de 30 días. *</p>
              <p>* De no recoger en 30 días se aplicará penalidad. *</p>
              <p>* Una vez retirada la prenda, no se aceptarán reclamos. *</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '20px' }}>
              <button className="btn-secondary" style={{ background: '#e2e8f0', color: '#000' }} onClick={() => setShowPrintModal(false)}>
                Cerrar
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff' }}
                  onClick={() => handleDownloadPdf(selectedTicket.id)}
                >
                  <FileText size={15} /> Descargar PDF
                </button>
                <button className="btn-primary" onClick={() => window.print()}>
                  <Printer size={16} /> Imprimir Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

