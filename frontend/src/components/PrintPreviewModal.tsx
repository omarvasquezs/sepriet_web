import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, MessageSquare, Download } from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from './LoadingSpinner';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
  onOpenWhatsApp?: (ticket: any, actionType?: 'ticket' | 'listo' | 'recogido') => void;
}

const resolvePdfUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  try {
    if (rawUrl.includes('/storage/')) {
      const storageIndex = rawUrl.indexOf('/storage/');
      return rawUrl.substring(storageIndex);
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    if (apiBase && (rawUrl.includes('localhost:8000') || rawUrl.startsWith('/'))) {
      const apiOrigin = new URL(apiBase, window.location.origin).origin;
      let url = rawUrl.replace(/^https?:\/\/localhost:8000/, apiOrigin);
      if (url.startsWith('/')) {
        url = `${apiOrigin}${url}`;
      }
      return url;
    }
  } catch {
    // fallback
  }
  return rawUrl;
};

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onOpenWhatsApp,
}) => {
  const [printPdfUrl, setPrintPdfUrl] = useState<string | null>(null);
  const [printPdfLoading, setPrintPdfLoading] = useState(false);
  const [printPdfError, setPrintPdfError] = useState<string | null>(null);
  const [printPdfFormat, setPrintPdfFormat] = useState<'ticket' | 'a4'>('a4');
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);

  const fetchPdf = async (targetFormat: 'ticket' | 'a4' = 'a4') => {
    if (!ticket) return;
    setPrintPdfLoading(true);
    setPrintPdfError(null);
    setPrintPdfFormat(targetFormat);

    try {
      const res = await api.get(`/comprobantes/${ticket.id}/pdf?format=${targetFormat}`);
      const url = resolvePdfUrl(res.data?.url);
      if (url) {
        setPrintPdfUrl(url);
      } else {
        setPrintPdfError('No se pudo obtener la URL del comprobante');
      }
    } catch (err: any) {
      setPrintPdfError(err.response?.data?.message || 'Error al generar la vista previa del comprobante en PDF');
    } finally {
      setPrintPdfLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ticket) {
      fetchPdf('a4');
    } else {
      setPrintPdfUrl(null);
      setPrintPdfError(null);
    }
  }, [isOpen, ticket?.id]);

  const handleChangeFormat = (newFormat: 'ticket' | 'a4') => {
    if (newFormat === printPdfFormat && printPdfUrl) return;
    fetchPdf(newFormat);
  };

  const handlePrintPdfDocument = () => {
    if (!printPdfUrl) return;

    // Method 1: Try direct iframe print
    try {
      if (pdfIframeRef.current?.contentWindow) {
        pdfIframeRef.current.contentWindow.focus();
        pdfIframeRef.current.contentWindow.print();
        return;
      }
    } catch (e) {
      console.warn('Direct iframe print exception:', e);
    }

    // Method 2: Fetch PDF blob and print via hidden iframe (same-origin blob)
    fetch(printPdfUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch {
              window.open(blobUrl, '_blank');
            } finally {
              setTimeout(() => {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(blobUrl);
              }, 60000);
            }
          }, 350);
        };
      })
      .catch((err) => {
        console.error('Error fetching blob for print:', err);
        window.open(printPdfUrl, '_blank');
      });
  };

  if (!isOpen || !ticket) return null;

  const code = ticket.cod_comprobante || `Ticket #${ticket.id}`;
  const clienteNombre = ticket.cliente?.nombres || 'Cliente';
  const fechaStr = ticket.fecha ? new Date(ticket.fecha).toLocaleDateString('es-PE') : '';

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 100040,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content pdf-preview-modal"
        style={{
          maxWidth: printPdfFormat === 'a4' ? '860px' : '560px',
          transition: 'max-width 0.25s ease',
          width: '95%',
          height: '92vh',
          maxHeight: '92vh',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-main, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: '#e0e7ff',
                color: '#4338ca',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Printer size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>
                {code}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                {clienteNombre} {fechaStr ? `• ${fechaStr}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Format Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '8px 16px',
            background: 'var(--bg-secondary, #f8fafc)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => handleChangeFormat('a4')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: printPdfFormat === 'a4' ? 700 : 500,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: printPdfFormat === 'a4' ? '#4f46e5' : 'var(--border-color, #cbd5e1)',
              background: printPdfFormat === 'a4' ? '#4f46e5' : '#ffffff',
              color: printPdfFormat === 'a4' ? '#ffffff' : 'var(--text-main, #334155)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📄 Hoja A4
          </button>
          <button
            type="button"
            onClick={() => handleChangeFormat('ticket')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: printPdfFormat === 'ticket' ? 700 : 500,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: printPdfFormat === 'ticket' ? '#4f46e5' : 'var(--border-color, #cbd5e1)',
              background: printPdfFormat === 'ticket' ? '#4f46e5' : '#ffffff',
              color: printPdfFormat === 'ticket' ? '#ffffff' : 'var(--text-main, #334155)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🧾 Ticket Térmico (80mm)
          </button>
        </div>

        {/* Modal Body - PDF Iframe Preview */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            background: '#475569',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {printPdfLoading && (
            <div style={{ textAlign: 'center', color: '#ffffff', margin: 'auto' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '12px', fontSize: '0.85rem', fontWeight: 500 }}>
                Cargando vista previa del PDF...
              </p>
            </div>
          )}

          {printPdfError && !printPdfLoading && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#fecaca', margin: 'auto' }}>
              <p style={{ fontWeight: 600, marginBottom: '12px' }}>{printPdfError}</p>
              <button
                type="button"
                className="btn-secondary"
                style={{ background: '#ffffff', color: '#1e293b' }}
                onClick={() => fetchPdf(printPdfFormat)}
              >
                Reintentar
              </button>
            </div>
          )}

          {printPdfUrl && !printPdfLoading && (
            <iframe
              ref={pdfIframeRef}
              src={`${printPdfUrl}#view=FitH&toolbar=0&navpanes=0`}
              title={`Comprobante ${code}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
                background: '#ffffff',
              }}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="pdf-modal-footer">
          <button
            type="button"
            className="btn-secondary pdf-btn-close"
            onClick={onClose}
          >
            Cerrar
          </button>

          <div className="pdf-modal-actions">
            {onOpenWhatsApp && (
              <button
                type="button"
                className="btn-secondary pdf-btn-whatsapp"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#16a34a',
                  borderColor: '#bbf7d0',
                  background: '#f0fdf4',
                  fontWeight: 600,
                }}
                onClick={() => onOpenWhatsApp(ticket, Number(ticket.estado_ropa_id) === 3 ? 'listo' : (Number(ticket.estado_ropa_id) === 4 ? 'recogido' : 'ticket'))}
              >
                <MessageSquare size={16} /> WhatsApp
              </button>
            )}
            {printPdfUrl && (
              <a
                href={printPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={`${ticket.cod_comprobante || ticket.id}${printPdfFormat === 'a4' ? '_a4' : ''}.pdf`}
                className="btn-secondary pdf-btn-download"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  color: '#4f46e5',
                  borderColor: '#c7d2fe',
                  background: '#eef2ff',
                  fontWeight: 600,
                }}
              >
                <Download size={15} /> Descargar
              </a>
            )}
            <button
              type="button"
              className="btn-primary pdf-btn-print"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handlePrintPdfDocument}
              disabled={printPdfLoading || !printPdfUrl}
            >
              <Printer size={16} /> Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
