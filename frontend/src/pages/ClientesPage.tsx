import React, { useEffect, useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ClientesPage: React.FC = () => {
  const [clientesData, setClientesData] = useState<any>({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const initialForm = {
    nombres: '',
    dni: '',
    codigo_pais: '+51',
    telefono: '',
    email: '',
    direccion: ''
  };

  const [form, setForm] = useState(initialForm);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clientes', { params: { search, page, per_page: 30 } });
      setClientesData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [search, page]);

  const handleOpenCreate = () => {
    setEditingClienteId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingClienteId(c.id);
    setForm({
      nombres: c.nombres || '',
      dni: c.dni || '',
      codigo_pais: c.codigo_pais || '+51',
      telefono: c.telefono || '',
      email: c.email || '',
      direccion: c.direccion || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (c: any) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al cliente "${c.nombres}"?`)) {
      return;
    }
    try {
      await api.delete(`/clientes/${c.id}`);
      fetchClientes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar cliente');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClienteId) {
        await api.put(`/clientes/${editingClienteId}`, form);
      } else {
        await api.post('/clientes', form);
      }
      setShowModal(false);
      setForm(initialForm);
      setEditingClienteId(null);
      fetchClientes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar cliente');
    }
  };

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', width: '360px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', paddingLeft: '42px' }}
            placeholder="Buscar por nombres, DNI o teléfono..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <button className="btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <LoadingSpinner text="Cargando directorio de clientes..." />
        ) : clientesData.data.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No se encontraron clientes.</p>
        ) : (
          <div>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombres y Apellidos</th>
                  <th>DNI / Doc</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesData.data.map((c: any) => (
                  <tr key={c.id} className="row-item">
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.nombres}</td>
                    <td>{c.dni || '-'}</td>
                    <td>
                      {c.telefono ? `${c.codigo_pais || ''} ${c.telefono}` : '-'}
                    </td>
                    <td>{c.email || '-'}</td>
                    <td>{c.direccion || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
                          title="Editar Cliente"
                          onClick={() => handleOpenEdit(c)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
                          title="Eliminar Cliente"
                          onClick={() => handleDelete(c)}
                        >
                          <Trash2 size={14} />
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
                Página {clientesData.current_page} de {clientesData.last_page} ({clientesData.total} clientes registrados)
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
                  disabled={page >= clientesData.last_page}
                  onClick={() => setPage(prev => prev + 1)}
                  style={{ opacity: page >= clientesData.last_page ? 0.5 : 1 }}
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
              {editingClienteId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombres y Apellidos *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={form.nombres}
                  onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">DNI / Documento</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.dni}
                    onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Código País</label>
                  <select
                    className="form-select"
                    value={form.codigo_pais}
                    onChange={(e) => setForm({ ...form, codigo_pais: e.target.value })}
                  >
                    <option value="+51">+51 (Perú)</option>
                    <option value="+54">+54 (Argentina)</option>
                    <option value="+56">+56 (Chile)</option>
                    <option value="+57">+57 (Colombia)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingClienteId ? 'Guardar Cambios' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
