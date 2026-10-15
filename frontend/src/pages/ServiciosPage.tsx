import React, { useEffect, useState } from 'react';
import { Shirt, Plus, Edit, CheckCircle, XCircle, X, Search, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ServiciosPage: React.FC = () => {
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTipo, setActiveTipo] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nom_servicio: '',
    tipo_servicio: 'k',
    precio_kilo: '0.00',
    habilitado: true,
    activado: true,
  });

  const fetchServicios = async () => {
    setLoading(true);
    try {
      const res = await api.get('/servicios');
      setServicios(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  const filteredServicios = servicios.filter(s => {
    const matchTipo = activeTipo === 'all' || s.tipo_servicio === activeTipo;
    const matchSearch = !search || s.nom_servicio.toLowerCase().includes(search.toLowerCase());
    return matchTipo && matchSearch;
  });

  const handleDeleteServicio = async (s: any) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el servicio "${s.nom_servicio}"?`)) {
      return;
    }
    try {
      await api.delete(`/servicios/${s.id}`);
      fetchServicios();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar servicio');
    }
  };

  const handleToggleHabilitado = async (s: any) => {
    try {
      await api.put(`/servicios/${s.id}`, { habilitado: !s.habilitado });
      fetchServicios();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar estado del servicio');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ nom_servicio: '', tipo_servicio: 'k', precio_kilo: '0.00', habilitado: true, activado: true });
    setShowModal(true);
  };

  const openEditModal = (s: any) => {
    setEditingId(s.id);
    setForm({
      nom_servicio: s.nom_servicio,
      tipo_servicio: s.tipo_servicio,
      precio_kilo: s.precio_kilo,
      habilitado: s.habilitado,
      activado: s.activado,
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

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'k': return 'Por Kilo';
      case 's': return 'Servicio Especial';
      case 'p': return 'Por Prenda';
      default: return tipo;
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 320px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '38px', height: '38px', fontSize: '0.85rem' }}
              placeholder="Buscar servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', background: '#ffffff', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '10px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'k', label: 'Por Kilo' },
              { id: 's', label: 'Servicios' },
              { id: 'p', label: 'Prendas' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTipo(tab.id)}
                style={{
                  background: activeTipo === tab.id ? 'var(--accent-primary)' : 'transparent',
                  color: activeTipo === tab.id ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          Nuevo Servicio
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Cargando tarifario de servicios..." />
      ) : filteredServicios.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No hay servicios que coincidan con la búsqueda o categoría.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {filteredServicios.map((s) => (
            <div key={s.id} className="glass-card" style={{ padding: '20px', position: 'relative', opacity: s.habilitado ? 1 : 0.75 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: s.habilitado ? 'rgba(79, 70, 229, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: s.habilitado ? '#4f46e5' : '#64748b' }}>
                  <Shirt size={24} />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => openEditModal(s)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', color: '#475569', cursor: 'pointer' }}
                    title="Editar Servicio"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteServicio(s)}
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px', color: '#ef4444', cursor: 'pointer' }}
                    title="Eliminar Servicio"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{s.nom_servicio}</h4>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                Tipo: {getTipoLabel(s.tipo_servicio)}
              </span>

              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                    S/ {Number(s.precio_kilo || 0).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleHabilitado(s)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: s.habilitado ? '#059669' : '#dc2626',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                  title="Clic para cambiar estado"
                >
                  {s.habilitado ? (
                    <><CheckCircle size={14} /> Habilitado</>
                  ) : (
                    <><XCircle size={14} /> Inactivo</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del Servicio *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={form.nom_servicio}
                  onChange={(e) => setForm({ ...form, nom_servicio: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Servicio</label>
                <select
                  className="form-select"
                  value={form.tipo_servicio}
                  onChange={(e) => setForm({ ...form, tipo_servicio: e.target.value })}
                >
                  <option value="k">Por Kilo (k)</option>
                  <option value="s">Servicio Especial (s)</option>
                  <option value="p">Por Prenda (p)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Precio (S/) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  required
                  value={form.precio_kilo}
                  onChange={(e) => setForm({ ...form, precio_kilo: e.target.value })}
                />
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
