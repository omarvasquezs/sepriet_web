import React, { useEffect, useState } from 'react';
import { Lock, Unlock, MinusCircle } from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const CajaPage: React.FC = () => {
  const [cajaInfo, setCajaInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [montoApertura, setMontoApertura] = useState('50.00');
  const [montoCierre, setMontoCierre] = useState('');
  const [showEgresoModal, setShowEgresoModal] = useState(false);

  const [egresoForm, setEgresoForm] = useState({
    descripcion: '',
    monto: '',
    id_metodo_pago: ''
  });

  const [metodosPago, setMetodosPago] = useState<any[]>([]);

  const fetchCaja = async () => {
    try {
      const [cajaRes, catRes] = await Promise.all([
        api.get('/caja/estado'),
        api.get('/catalogos')
      ]);
      setCajaInfo(cajaRes.data);
      setMetodosPago(catRes.data.metodos_pago || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaja();
  }, []);

  const handleApertura = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/caja/apertura', { monto_apertura: Number(montoApertura) });
      fetchCaja();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al abrir caja');
    }
  };

  const handleCierre = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/caja/cierre', { monto_cierre: Number(montoCierre) });
      setMontoCierre('');
      fetchCaja();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cerrar caja');
    }
  };

  const handleEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/caja/egreso', {
        ...egresoForm,
        monto: Number(egresoForm.monto),
        id_metodo_pago: egresoForm.id_metodo_pago ? Number(egresoForm.id_metodo_pago) : null
      });
      setShowEgresoModal(false);
      setEgresoForm({ descripcion: '', monto: '', id_metodo_pago: '' });
      fetchCaja();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar egreso');
    }
  };

  if (loading) return <LoadingSpinner text="Consultando estado de caja..." />;

  const caja = cajaInfo?.caja;

  return (
    <div style={{ padding: '28px' }}>
      {!caja ? (
        <div className="glass-panel" style={{ maxWidth: '500px', margin: '40px auto', padding: '36px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(220, 38, 38, 0.1)',
            color: '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Lock size={32} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Apertura de Caja Simple</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Inicie el turno ingresando el monto inicial de dinero en caja física.
          </p>

          <form onSubmit={handleApertura}>
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
              <label className="form-label">Monto Inicial Apertura (S/)</label>
              <input
                type="number"
                step="0.10"
                className="form-input"
                required
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Unlock size={18} /> Abrir Caja
            </button>
          </form>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Monto Apertura</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
                S/ {Number(caja.monto_apertura).toFixed(2)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(caja.datetime_apertura).toLocaleTimeString('es-PE')}
              </span>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Ventas del Turno</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '8px' }}>
                + S/ {Number(cajaInfo.total_ventas || 0).toFixed(2)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ingresos en efectivo/digital</span>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Egresos del Turno</span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: '8px' }}>
                - S/ {Number(cajaInfo.total_egresos || 0).toFixed(2)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gastos de caja chica</span>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderColor: '#c7d2fe' }}>
              <span style={{ color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700 }}>Saldo Estimado</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5', marginTop: '8px' }}>
                S/ {Number(cajaInfo.saldo_estimado || 0).toFixed(2)}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#4f46e5' }}>Efectivo en caja en tiempo real</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Egresos / Gastos de Caja Chica</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setShowEgresoModal(true)}>
                <MinusCircle size={18} color="#dc2626" />
                Registrar Egreso
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', marginBottom: '36px' }}>
            {!caja.egresos || caja.egresos.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay egresos registrados en esta sesión de caja.</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción / Motivo</th>
                    <th>Método Pago</th>
                    <th>Usuario</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {caja.egresos.map((eg: any) => (
                    <tr key={eg.id} className="row-item">
                      <td>{new Date(eg.fecha).toLocaleTimeString('es-PE')}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{eg.descripcion}</td>
                      <td>{eg.metodo_pago?.nom_metodo_pago || 'Efectivo'}</td>
                      <td>{eg.usuario?.name}</td>
                      <td style={{ color: '#dc2626', fontWeight: 700 }}>- S/ {Number(eg.monto).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '28px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={20} color="#dc2626" /> Cierre de Caja Simple
            </h4>

            <form onSubmit={handleCierre}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Monto de Cierre Real / Conteo Físico (S/)</label>
                <input
                  type="number"
                  step="0.10"
                  className="form-input"
                  required
                  placeholder={`Estimado: S/ ${Number(cajaInfo.saldo_estimado).toFixed(2)}`}
                  value={montoCierre}
                  onChange={(e) => setMontoCierre(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-danger" style={{ width: '100%', padding: '12px' }}>
                Cerrar Turno de Caja
              </button>
            </form>
          </div>
        </div>
      )}

      {showEgresoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Registrar Egreso de Caja Chica</h3>
            <form onSubmit={handleEgreso}>
              <div className="form-group">
                <label className="form-label">Descripción del Gasto *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: Compra de detergente, pago de bolsas"
                  value={egresoForm.descripcion}
                  onChange={(e) => setEgresoForm({ ...egresoForm, descripcion: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Monto (S/) *</label>
                  <input
                    type="number"
                    step="0.10"
                    className="form-input"
                    required
                    value={egresoForm.monto}
                    onChange={(e) => setEgresoForm({ ...egresoForm, monto: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Método de Pago</label>
                  <select
                    className="form-select"
                    value={egresoForm.id_metodo_pago}
                    onChange={(e) => setEgresoForm({ ...egresoForm, id_metodo_pago: e.target.value })}
                  >
                    <option value="">Efectivo (Predeterminado)</option>
                    {metodosPago.map((mp: any) => (
                      <option key={mp.id} value={mp.id}>{mp.nom_metodo_pago}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEgresoModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Egreso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
