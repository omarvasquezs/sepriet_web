import React, { useEffect, useState } from 'react';
import { Search, Plus, Printer, DollarSign, Trash2 } from 'lucide-react';
import api from '../api/axios';

export const ComprobantesPage: React.FC = () => {
  const [comprobantes, setComprobantes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [catalogos, setCatalogos] = useState<any>({ estados: [], estados_ropa: [], metodos_pago: [] });

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Abono Form
  const [abonoAmount, setAbonoAmount] = useState('');
  const [abonoMetodoPago, setAbonoMetodoPago] = useState('');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    cliente_id: '',
    fecha_entrega: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    descuento: '0.00',
    monto_abonado: '0.00',
    metodo_pago_id: '',
    observaciones: '',
    detalles: [
      { servicio_id: '', peso_kg: '', costo_kilo: '', cantidad: 1, precio_unitario: '0.00', estado_ropa_id: '', observaciones: '' }
    ]
  });

  const fetchData = async () => {
    try {
      const [compRes, cliRes, servRes, catRes] = await Promise.all([
        api.get('/comprobantes', { params: { search, estado_id: estadoFilter } }),
        api.get('/clientes'),
        api.get('/servicios'),
        api.get('/catalogos')
      ]);

      setComprobantes(compRes.data);
      setClientes(cliRes.data);
      setServicios(servRes.data);
      setCatalogos(catRes.data);

      if (catRes.data.metodos_pago.length > 0 && !createForm.metodo_pago_id) {
        setCreateForm(prev => ({ ...prev, metodo_pago_id: String(catRes.data.metodos_pago[0].id) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, estadoFilter]);

  const handleAddDetalle = () => {
    setCreateForm(prev => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        { servicio_id: '', peso_kg: '', costo_kilo: '', cantidad: 1, precio_unitario: '0.00', estado_ropa_id: '', observaciones: '' }
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
        precio_unitario: s?.precio_unidad ? String(s.precio_unidad) : '0.00',
        peso_kg: s?.tipo_servicio === 'Kilo' ? '2.5' : '',
        cantidad: s?.tipo_servicio === 'Kilo' ? 1 : 1
      };
      return { ...prev, detalles: newDetalles };
    });
  };

  // Calculations
  const calculateTotal = () => {
    let subtotal = 0;
    createForm.detalles.forEach(d => {
      if (Number(d.peso_kg || 0) > 0 && Number(d.costo_kilo || 0) > 0) {
        subtotal += Number(d.peso_kg) * Number(d.costo_kilo);
      } else {
        subtotal += Number(d.cantidad || 1) * Number(d.precio_unitario || 0);
      }
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
          peso_kg: d.peso_kg ? Number(d.peso_kg) : null,
          costo_kilo: d.costo_kilo ? Number(d.costo_kilo) : null,
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
          estado_ropa_id: d.estado_ropa_id ? Number(d.estado_ropa_id) : null,
          observaciones: d.observaciones
        }))
      });

      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar comprobante');
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

  const handleEstadoChange = async (ticketId: number, estadoId: string) => {
    try {
      await api.put(`/comprobantes/${ticketId}/estado`, { estado_id: Number(estadoId) });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '42px' }}
              placeholder="Buscar por código (TICK-...) o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="">Todos los Estados</option>
            {catalogos.estados.map((est: any) => (
              <option key={est.id} value={est.id}>{est.nombre}</option>
            ))}
          </select>
        </div>

        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> Registrar Comprobante
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando comprobantes...</p>
        ) : comprobantes.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay comprobantes para mostrar.</p>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Cliente</th>
                <th>Fecha Recepción</th>
                <th>Fecha Entrega</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Abonado</th>
                <th>Restante</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comprobantes.map((t) => (
                <tr key={t.id} className="row-item">
                  <td style={{ fontWeight: 700, color: '#818cf8' }}>{t.cod_comprobante}</td>
                  <td style={{ fontWeight: 600, color: 'white' }}>{t.cliente?.nombres}</td>
                  <td>{new Date(t.fecha).toLocaleDateString('es-PE')}</td>
                  <td>{t.fecha_entrega ? new Date(t.fecha_entrega).toLocaleDateString('es-PE') : '-'}</td>
                  <td>
                    <select
                      className="form-select"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', fontWeight: 600 }}
                      value={t.estado_id}
                      onChange={(e) => handleEstadoChange(t.id, e.target.value)}
                    >
                      {catalogos.estados.map((est: any) => (
                        <option key={est.id} value={est.id}>{est.nombre}</option>
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
                            setAbonoMetodoPago(catalogos.metodos_pago[0]?.id || '');
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
        )}
      </div>

      {/* Modal Registrar Comprobante */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '20px' }}>Registrar Comprobante / Ticket</h3>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

                <div className="form-group">
                  <label className="form-label">Fecha Estimada de Entrega</label>
                  <input
                    type="date"
                    className="form-input"
                    value={createForm.fecha_entrega}
                    onChange={(e) => setCreateForm({ ...createForm, fecha_entrega: e.target.value })}
                  />
                </div>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginTop: '16px', marginBottom: '12px' }}>Detalles de Servicios</h4>

              {createForm.detalles.map((det, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '14px', marginBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                    <select
                      className="form-select"
                      required
                      value={det.servicio_id}
                      onChange={(e) => handleSelectServicio(idx, e.target.value)}
                    >
                      <option value="">Seleccionar Servicio...</option>
                      {servicios.map(s => (
                        <option key={s.id} value={s.id}>{s.nom_servicio} ({s.tipo_servicio})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.10"
                      className="form-input"
                      placeholder="Peso KG"
                      value={det.peso_kg}
                      onChange={(e) => {
                        const newD = [...createForm.detalles];
                        newD[idx].peso_kg = e.target.value;
                        setCreateForm({ ...createForm, detalles: newD });
                      }}
                    />

                    <input
                      type="number"
                      className="form-input"
                      placeholder="Cant."
                      value={det.cantidad}
                      onChange={(e) => {
                        const newD = [...createForm.detalles];
                        newD[idx].cantidad = Number(e.target.value);
                        setCreateForm({ ...createForm, detalles: newD });
                      }}
                    />

                    <select
                      className="form-select"
                      value={det.estado_ropa_id}
                      onChange={(e) => {
                        const newD = [...createForm.detalles];
                        newD[idx].estado_ropa_id = e.target.value;
                        setCreateForm({ ...createForm, detalles: newD });
                      }}
                    >
                      <option value="">Estado Ropa</option>
                      {catalogos.estados_ropa.map((er: any) => (
                        <option key={er.id} value={er.id}>{er.nombre}</option>
                      ))}
                    </select>

                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                      S/ {
                        Number(det.peso_kg || 0) > 0 && Number(det.costo_kilo || 0) > 0
                          ? (Number(det.peso_kg) * Number(det.costo_kilo)).toFixed(2)
                          : (Number(det.cantidad || 1) * Number(det.precio_unitario || 0)).toFixed(2)
                      }
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
                + Agregar Servicio
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
                  <label className="form-label">Método de Pago Initial</label>
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

              <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                  Total Final: <span style={{ color: '#818cf8' }}>S/ {calculateTotal().toFixed(2)}</span>
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
              Registrar Abono a Ticket {selectedTicket.cod_comprobante}
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Deuda pendiente: <b style={{ color: '#fca5a5' }}>S/ {Number(selectedTicket.monto_restante).toFixed(2)}</b>
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
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>LAVANDERIA SEPRIET</h2>
              <p style={{ fontSize: '0.8rem' }}>RUC: 20601234567 | Av. Principal 123</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '6px' }}>{selectedTicket.cod_comprobante}</p>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
              <p><b>CLIENTE:</b> {selectedTicket.cliente?.nombres}</p>
              <p><b>DNI:</b> {selectedTicket.cliente?.dni || 'N/A'}</p>
              <p><b>FECHA:</b> {new Date(selectedTicket.fecha).toLocaleString('es-PE')}</p>
              <p><b>ENTREGA:</b> {selectedTicket.fecha_entrega ? new Date(selectedTicket.fecha_entrega).toLocaleDateString('es-PE') : '-'}</p>
            </div>

            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', marginBottom: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                  <th>CANT/KG</th>
                  <th>DESCRIPCION</th>
                  <th style={{ textAlign: 'right' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {selectedTicket.detalles?.map((d: any, idx: number) => (
                  <tr key={idx}>
                    <td>{d.peso_kg ? `${d.peso_kg} KG` : `${d.cantidad} UN`}</td>
                    <td>{d.servicio?.nom_servicio}</td>
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
              <p style={{ fontSize: '0.7rem', color: '#666' }}>Conserve este ticket para recoger sus prendas.</p>
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
