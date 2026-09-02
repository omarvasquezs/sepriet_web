import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';
import { globalCircuitBreaker, CircuitState } from '../api/circuitBreaker';

export const ResilienceBanner: React.FC = () => {
  const [circuitState, setCircuitState] = useState<CircuitState>(globalCircuitBreaker.getState());

  useEffect(() => {
    const unsubscribe = globalCircuitBreaker.subscribe((state) => {
      setCircuitState(state);
    });
    return () => unsubscribe();
  }, []);

  if (circuitState === CircuitState.CLOSED) {
    return null;
  }

  const handleManualReset = () => {
    globalCircuitBreaker.reset();
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: circuitState === CircuitState.OPEN ? '#fef2f2' : '#eff6ff',
        border: `1px solid ${circuitState === CircuitState.OPEN ? '#fecaca' : '#bfdbfe'}`,
        color: circuitState === CircuitState.OPEN ? '#991b1b' : '#1e40af',
        padding: '14px 18px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '420px',
        animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {circuitState === CircuitState.OPEN ? (
        <ShieldAlert size={22} color="#dc2626" />
      ) : (
        <RefreshCw size={22} color="#2563eb" style={{ animation: 'spinSmooth 1s linear infinite' }} />
      )}

      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>
          {circuitState === CircuitState.OPEN
            ? 'Protección de Servidor Activa (Circuit Breaker)'
            : 'Probando recuperación del servicio...'}
        </p>
        <p style={{ fontSize: '0.78rem', margin: '2px 0 0 0', opacity: 0.85 }}>
          {circuitState === CircuitState.OPEN
            ? 'Detectadas fallas continuas. Pausando peticiones para estabilizar el servidor.'
            : 'Canal de prueba abierto. Restaurando conexión normal.'}
        </p>
      </div>

      <button
        onClick={handleManualReset}
        style={{
          background: circuitState === CircuitState.OPEN ? '#dc2626' : '#2563eb',
          color: 'white',
          border: 'none',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <CheckCircle2 size={13} />
        Reintentar
      </button>
    </div>
  );
};
