import React, { useEffect, useState } from 'react';
import { Search, Plus, Printer, DollarSign, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';

export const ComprobantesPage: React.FC = () => {
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
      await api.post('/comprobantes', {
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
      });

      setShowCreateModal(false);
      setPage(1);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar comprobante');
    }
  };

  const handleAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await api.post(`/comprobantes/${selectedTicket.id}/abono`, {
        monto_abonado: Number(abonoAmount),
        metodo_pago_id: Number(abonoMetodoPago)
      });
      setShowAbonoModal(false);
      setAbonoAmount('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar abono');
    }
  };

  const handleEstadoRopaChange = async (ticketId: number, estadoRopaId: string) => {
    try {
      await api.put(`/comprobantes/${ticketId}/estado`, { estado_ropa_id: Number(estadoRopaId) });
      fetchData();
    } catch (err) {
      console.error(err);
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
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '750px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '42px' }}
              placeholder="Buscar ticket (NV001-...), DNI, cliente..."
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
              <option key={ep.id} value={ep.id}>{ep.nom_estado}</option>
            ))}
          </select>

          <select
            className="form-select"
            value={estadoRopaFilter}
            onChange={(e) => { setEstadoRopaFilter(e.target.value); setPage(1); }}
          >
            <option value="">Prendas: Todos</option>
            {catalogos.estados_ropa.map((er: any) => (
              <option key={er.id} value={er.id}>{er.nom_estado_ropa}</option>
            ))}
          </select>
        </div>

        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> Registrar Comprobante
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Cargando comprobantes...</p>
        ) : comprobantesData.data.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No se encontraron comprobantes con esos filtros.</p>
        ) : (
          <div>
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
                    <td style={{ fontWeight: 700, color: '#818cf8' }}>{t.cod_comprobante || `N° ${t.id}`}</td>
                    <td style={{ fontWeight: 600, color: 'white' }}>{t.cliente?.nombres || 'Cliente Genérico'}</td>
                    <td>{new Date(t.fecha).toLocaleDateString('es-PE')}</td>
                    <td>
                      <span className={`badge ${getBadgeClassPago(t.estado_comprobante?.nom_estado)}`}>
                        {t.estado_comprobante?.nom_estado || 'DEBE'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '4px 8px', fontSize: '0.78rem', fontWeight: 600 }}
                        value={t.estado_ropa_id || 1}
                        onChange={(e) => handleEstadoRopaChange(t.id, e.target.value)}
                      >
                        {catalogos.estados_ropa.map((er: any) => (
                          <option key={er.id} value={er.id}>{er.nom_estado_ropa}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontWeight: 700 }}>S/ {Number(t.costo_total).toFixed(2)}</td>
                    <td style={{ color: '#34d399', fontWeight: 600 }}>S/ {Number(t.monto_abonado).toFixed(2)}</td>
                    <td style={{ color: Number(t.monto_restante) > 0 ? '#fca5a5' : '#34d399', fontWeight: 700 }}>
                      S/ {Number(t.monto_restante).toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {Number(t.monto_restante) > 0 && (
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            title="Registrar Abono"
                            onClick={() => {
                              setSelectedTicket(t);
                              setAbonoMetodoPago('4');
                              setShowAbonoModal(true);
                            }}
                          >
                            <DollarSign size={14} color="#34d399" /> Abono
                          </button>
                        )}
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '20px' }}>Registrar Nuevo Comprobante</h3>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
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

              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginTop: '16px', marginBottom: '12px' }}>Detalles de Servicios</h4>

              {createForm.detalles.map((det, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '14px', marginBottom: '12px' }}>
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
                          {s.nom_servicio} ({s.tipo_servicio === 'k' ? 'Kilo' : s.tipo_servicio === 's' ? 'Servicio' : 'Prenda'}) - S/ {Number(s.precio_kilo).toFixed(2)}
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

                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem', textAlign: 'right' }}>
                      S/ {(Number(det.peso_kg || 0) * Number(det.costo_kilo || 0)).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDetalle(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" className="btn-secondary" onClick={handleAddDetalle} style={{ marginBottom: '20px' }}>
                + Agregar Fila
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
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
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                  Total a Pagar: <span style={{ color: '#818cf8' }}>S/ {calculateTotal().toFixed(2)}</span>
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
              Registrar Abono a {selectedTicket.cod_comprobante}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Monto pendiente: <b style={{ color: '#fca5a5' }}>S/ {Number(selectedTicket.monto_restante).toFixed(2)}</b>
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

              <div className="form-group" style={{ marginBottom: '24px' }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAbonoModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Confirmar Abono</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Print Preview Mockup */}
      {showPrintModal && selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ background: '#ffffff', color: '#000000', fontFamily: 'monospace' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '12px', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>SEPRIET LAUNDRY</h2>
              <p style={{ fontSize: '0.8rem' }}>Av Agustín de la Rosa Toro 318 SAN LUIS</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '6px' }}>{selectedTicket.cod_comprobante || `Ticket #${selectedTicket.id}`}</p>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
              <p><b>CLIENTE:</b> {selectedTicket.cliente?.nombres}</p>
              <p><b>DNI/DOC:</b> {selectedTicket.cliente?.dni || 'N/A'}</p>
              <p><b>FECHA:</b> {new Date(selectedTicket.fecha).toLocaleString('es-PE')}</p>
              <p><b>ESTADO PAGO:</b> {selectedTicket.estado_comprobante?.nom_estado}</p>
              <p><b>ESTADO PRENDA:</b> {selectedTicket.estado_ropa?.nom_estado_ropa}</p>
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
                    <td style={{ textAlign: 'right' }}>S/ {Number(d.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '2px dashed #000', paddingTop: '8px', textAlign: 'right', fontSize: '0.85rem' }}>
              <p>TOTAL: S/ {Number(selectedTicket.costo_total).toFixed(2)}</p>
              <p>ABONADO: S/ {Number(selectedTicket.monto_abonado).toFixed(2)}</p>
              <p style={{ fontWeight: 800 }}>PENDIENTE: S/ {Number(selectedTicket.monto_restante).toFixed(2)}</p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ fontSize: '0.75rem' }}>¡Gracias por su preferencia!</p>
              <p style={{ fontSize: '0.7rem', color: '#666' }}>Conserve este ticket para retirar sus prendas.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button className="btn-secondary" style={{ background: '#e2e8f0', color: '#000' }} onClick={() => setShowPrintModal(false)}>
                Cerrar
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
