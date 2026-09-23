import React, { useState } from 'react';
import { Unlock, X, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axios';

interface AperturaCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AperturaCajaModal: React.FC<AperturaCajaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [montoInicial, setMontoInicial] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMonto, setSuccessMonto] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsedMonto = parseFloat(montoInicial) || 0;
      await api.post('/caja/apertura', {
        monto_apertura: parsedMonto,
      });
      setSuccessMonto(parsedMonto);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Error al aperturar la caja. Intente nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessMonto(null);
    onSuccess();
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      {successMonto !== null ? (
        // Success Dialog (Matches Screenshot 2)
        <div
          className="glass-panel modal-content"
          style={{
            maxWidth: '420px',
            width: '90%',
            padding: '28px 24px',
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease-out',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(5, 150, 105, 0.1)',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '8px',
            }}
          >
            Éxito
          </h3>

          <p
            style={{
              fontSize: '0.98rem',
              color: '#334155',
              marginBottom: '24px',
              lineHeight: 1.5,
            }}
          >
            Caja aperturada exitosamente con{' '}
            <strong style={{ color: '#059669', fontSize: '1.1rem' }}>
              S/. {successMonto.toFixed(2)}
            </strong>
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={handleSuccessClose}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            Aceptar
          </button>
        </div>
      ) : (
        // Apertura Form Modal (Matches Screenshot 1)
        <div
          className="glass-panel modal-content"
          style={{
            maxWidth: '460px',
            width: '90%',
            padding: '24px',
            animation: 'fadeIn 0.2s ease-out',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Unlock size={20} color="var(--primary-color)" />
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                }}
              >
                Apertura de Caja
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '18px 16px',
                background: '#f8fafc',
                marginBottom: '20px',
              }}
            >
              <p
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  margin: '0 0 6px 0',
                }}
              >
                No se ha aperturado la caja el día de hoy.
              </p>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  margin: '0 0 16px 0',
                }}
              >
                Por favor ingrese el monto inicial físico que hay en caja:
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <label
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  Monto Inicial en Efectivo (S/):
                </label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  required
                  autoFocus
                  className="form-input"
                  style={{
                    width: '100%',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: '#0f172a',
                    background: '#ffffff',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #94a3b8',
                    boxSizing: 'border-box',
                  }}
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  background: 'rgba(220, 38, 38, 0.08)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
                style={{ flex: 1, minHeight: '44px', padding: '10px 14px', fontSize: '0.9rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 1.5, minHeight: '44px', padding: '10px 14px', fontSize: '0.9rem', fontWeight: 700 }}
              >
                {loading ? 'Aperturando...' : 'Aperturar Caja'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
