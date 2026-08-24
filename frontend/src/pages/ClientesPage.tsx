import React, { useEffect, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import api from '../api/axios';

export const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nombres: '',
    dni: '',
    codigo_pais: '+51',
    telefono: '',
    email: '',
    direccion: ''
  });

  const fetchClientes = async () => {
    try {
      const res = await api.get('/clientes', { params: { search } });
      setClientes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clientes', form);
      setShowModal(false);
      setForm({ nombres: '', dni: '', codigo_pais: '+51', telefono: '', email: '', direccion: '' });
      fetchClientes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar cliente');
    }
  };

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', paddingLeft: '42px' }}
            placeholder="Buscar cliente por nombre o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando clientes...</p>
        ) : clientes.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron clientes.</p>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nombres</th>
                <th>DNI</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="row-item">
                  <td style={{ fontWeight: 600, color: 'white' }}>{c.nombres}</td>
                  <td>{c.dni || '-'}</td>
                  <td>
                    {c.telefono ? `${c.codigo_pais || ''} ${c.telefono}` : '-'}
                  </td>
                  <td>{c.email || '-'}</td>
                  <td>{c.direccion || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '20px' }}>Registrar Nuevo Cliente</h3>

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
                <button type="submit" className="btn-primary">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
