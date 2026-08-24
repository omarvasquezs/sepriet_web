import React, { useEffect, useState } from 'react';
import { Shirt, Plus, Edit, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';

export const ServiciosPage: React.FC = () => {
  const [servicios, setServicios] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nom_servicio: '',
    tipo_servicio: 'Kilo',
    precio_kilo: '0.00',
    precio_unidad: '0.00',
    habilitado: true,
  });

  const fetchServicios = async () => {
    try {
      const res = await api.get('/servicios');
      setServicios(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ nom_servicio: '', tipo_servicio: 'Kilo', precio_kilo: '0.00', precio_unidad: '0.00', habilitado: true });
    setShowModal(true);
  };

  const openEditModal = (s: any) => {
    setEditingId(s.id);
    setForm({
      nom_servicio: s.nom_servicio,
      tipo_servicio: s.tipo_servicio,
      precio_kilo: s.precio_kilo,
      precio_unidad: s.precio_unidad,
      habilitado: s.habilitado,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/servicios/${editingId}`, form);
      } else {
        await api.post('/servicios', form);
      }
      setShowModal(false);
      fetchServicios();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar servicio');
    }
  };

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Lista de Servicios y Tarifas</h3>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          Nuevo Servicio
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {servicios.map((s) => (
          <div key={s.id} className="glass-card" style={{ padding: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                <Shirt size={24} />
              </div>
              <button
                onClick={() => openEditModal(s)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <Edit size={18} />
              </button>
            </div>

            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{s.nom_servicio}</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
              Tipo: {s.tipo_servicio}
            </span>

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {s.tipo_servicio === 'Kilo' ? (
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                    S/ {Number(s.precio_kilo).toFixed(2)} <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ KG</small>
                  </span>
                ) : (
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                    S/ {Number(s.precio_unidad).toFixed(2)} <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ Unidad</small>
                  </span>
                )}
              </div>

              {s.habilitado ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>
                  <CheckCircle size={14} /> Habilitado
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600 }}>
                  <XCircle size={14} /> Inactivo
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '20px' }}>
              {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del Servicio *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={form.nom_servicio}
                  onChange={(e) => setForm({ ...form, nom_servicio: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Servicio</label>
                <select
                  className="form-select"
                  value={form.tipo_servicio}
                  onChange={(e) => setForm({ ...form, tipo_servicio: e.target.value })}
                >
                  <option value="Kilo">Kilo</option>
                  <option value="Unidad">Unidad</option>
                  <option value="Prenda">Prenda</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Precio por Kilo (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.precio_kilo}
                    onChange={(e) => setForm({ ...form, precio_kilo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Precio por Unidad (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.precio_unidad}
                    onChange={(e) => setForm({ ...form, precio_unidad: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <input
                  type="checkbox"
                  id="habilitado"
                  checked={form.habilitado}
                  onChange={(e) => setForm({ ...form, habilitado: e.target.checked })}
                />
                <label htmlFor="habilitado" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Servicio Habilitado</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Servicio</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
