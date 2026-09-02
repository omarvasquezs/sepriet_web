import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  X,
  FileText,
  Send,
  Loader2,
  Key,
  Bot,
  Download
} from 'lucide-react';
import api from '../api/axios';

export interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
  actionType?: 'ticket' | 'listo' | 'recogido';
}

const COUNTRY_CODES = [
  { code: '+51', country: 'Perú (+51)' },
  { code: '+593', country: 'Ecuador (+593)' },
  { code: '+1', country: 'Estados Unidos / Canadá (+1)' },
  { code: '+52', country: 'México (+52)' },
  { code: '+57', country: 'Colombia (+57)' },
  { code: '+58', country: 'Venezuela (+58)' },
  { code: '+56', country: 'Chile (+56)' },
  { code: '+55', country: 'Brasil (+55)' },
  { code: '+54', country: 'Argentina (+54)' },
  { code: '+34', country: 'España (+34)' },
  { code: '+49', country: 'Alemania (+49)' },
  { code: '+33', country: 'Francia (+33)' },
  { code: '+44', country: 'Reino Unido (+44)' },
  { code: '+39', country: 'Italia (+39)' },
  { code: '+81', country: 'Japón (+81)' },
  { code: '+86', country: 'China (+86)' },
];

export const buildWhatsAppMessage = (
  ticket: any,
  actionType: 'ticket' | 'listo' | 'recogido' = 'ticket',
  pdfUrl?: string
): string => {
  if (!ticket) return '';

  const cod = ticket.cod_comprobante || `Ticket #${ticket.id}`;
  const clienteNombre = ticket.cliente?.nombres || 'Cliente';
  const clienteDni = ticket.cliente?.dni || ticket.cliente?.num_documento || '';
  const costoTotal = Number(ticket.costo_total || 0);
  const montoAbonado = Number(ticket.monto_abonado || 0);
  const descuento = Number(ticket.descuento || 0);
  const deuda = Math.max(0, costoTotal - montoAbonado);
  const diasRecojo = 30;

  if (actionType === 'recogido') {
    let msg = `Gracias por confiar en nosotros ✨ Esperamos que el servicio haya sido de tu total satisfacción.\n¡Será un gusto atenderte nuevamente!`;
    if (pdfUrl) {
      msg += `\n\nPuede ver su comprobante digital aquí:\n${pdfUrl}`;
    }
    return msg;
  }

  const sb: string[] = [];

  if (actionType === 'listo') {
    sb.push(`Para informarle que sus prendas ya estan listas para recoger.\n`);
    sb.push(`Comprobante: ${cod}\n`);
  } else {
    sb.push(`LAVANDERIA SEPRIET`);
    sb.push(`Enrique Nerini 995, San Luis 15021`);

    let tipoLabel = 'COMPROBANTE';
    if (ticket.tipo_comprobante === 'N') tipoLabel = 'NOTA DE VENTA ELECTRÓNICA';
    else if (ticket.tipo_comprobante === 'B') tipoLabel = 'BOLETA';
    else if (ticket.tipo_comprobante === 'F') tipoLabel = 'FACTURA';

    sb.push(tipoLabel);
    sb.push(cod);

    const fechaObj = ticket.fecha ? new Date(ticket.fecha) : new Date();
    const fechaFormatted =
      fechaObj.toLocaleDateString('es-PE') +
      ' - ' +
      fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    sb.push(`FECHA Y HORA: ${fechaFormatted}`);
    sb.push(`CLIENTE: ${clienteNombre}`);
    if (clienteDni) sb.push(`DNI: ${clienteDni}`);
    if (ticket.cliente?.direccion) sb.push(`DIRECCIÓN: ${ticket.cliente.direccion}`);
    sb.push('');
  }

  // Detalle de servicios
  if (ticket.detalles && ticket.detalles.length > 0) {
    ticket.detalles.forEach((det: any) => {
      const srvNom = det.servicio?.nom_servicio || 'Servicio';
      const peso = Number(det.peso_kg || 0);
      const costoKilo = Number(det.costo_kilo || det.precio_unitario || 0);
      const subtotal = Number(det.subtotal || peso * costoKilo);

      if (peso > 0.001) {
        sb.push(`- ${srvNom}: ${peso.toFixed(2)} kg x ${costoKilo.toFixed(2)} = ${subtotal.toFixed(2)}`);
      } else {
        sb.push(`- ${srvNom}: ${subtotal.toFixed(2)}`);
      }
    });
    sb.push('');
  }

  // Totales
  if (descuento > 0) {
    const totalSinDescuento = costoTotal + descuento;
    sb.push(`TOTAL SIN DESCUENTO: S/. ${totalSinDescuento.toFixed(2)}`);
    sb.push(`DESCUENTO: S/. ${descuento.toFixed(2)}`);
    sb.push(`TOTAL CON DESCUENTO: S/. ${costoTotal.toFixed(2)}\n`);
  } else {
    sb.push(`TOTAL: S/. ${costoTotal.toFixed(2)}\n`);
  }

  // Abonos
  if (ticket.ingresos && ticket.ingresos.length > 0) {
    sb.push(`ABONOS:`);
    ticket.ingresos.forEach((ing: any) => {
      const f = ing.fecha
        ? new Date(ing.fecha).toLocaleDateString('es-PE') +
          ' ' +
          new Date(ing.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        : '';
      const metodo = ing.metodo_pago?.nom_metodo_pago ? ` (${ing.metodo_pago.nom_metodo_pago})` : '';
      sb.push(`- ${f}: S/. ${Number(ing.monto_abonado).toFixed(2)}${metodo}`);
    });
    sb.push('');
  }

  sb.push(`DEUDA: S/. ${deuda.toFixed(2)}`);
  sb.push(`TOTAL ABONADO: S/. ${montoAbonado.toFixed(2)}\n`);

  if (pdfUrl) {
    sb.push(`📄 COMPROBANTE EN PDF:`);
    sb.push(`${pdfUrl}\n`);
  }

  // Footer políticas
  sb.push(`*El tiempo máximo para recoger su prenda es de ${diasRecojo} días.*`);
  sb.push(`*De no recoger en ${diasRecojo} días se aplicara penalidad.*`);
  sb.push(`*Una vez retirada la prenda, no se aceptarán reclamos.*`);

  return sb.join('\n');
};

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  ticket,
  actionType = 'ticket',
}) => {
  const [countryCode, setCountryCode] = useState('+51');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Send Mode: 'whatsapp' (manual web link) or 'textmebot' (automated bot with document)
  const [sendMode, setSendMode] = useState<'whatsapp' | 'textmebot'>('whatsapp');
  const [textMeBotKey, setTextMeBotKey] = useState<string>(
    localStorage.getItem('textmebot_api_key') || ''
  );

  // PDF Generation State
  const [pdfInfo, setPdfInfo] = useState<{ url: string; filename: string } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [includePdfLink, setIncludePdfLink] = useState(true);

  // Sending state
  const [isSendingBot, setIsSendingBot] = useState(false);
  const [botStatusMessage, setBotStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch or generate PDF when modal opens
  useEffect(() => {
    if (ticket && isOpen) {
      const rawPhone = ticket.cliente?.telefono || '';
      const cleanPhone = rawPhone.replace(/\D/g, '');
      setPhone(cleanPhone);

      const rawCode = ticket.cliente?.codigo_pais?.trim();
      if (rawCode) {
        setCountryCode(rawCode);
      } else {
        setCountryCode('+51');
      }

      setCopied(false);
      setBotStatusMessage(null);

      // Trigger background PDF generation
      setIsGeneratingPdf(true);
      api
        .get(`/comprobantes/${ticket.id}/pdf`)
        .then((res) => {
          if (res.data?.success) {
            setPdfInfo({
              url: res.data.url,
              filename: res.data.filename,
            });
            setMessage(buildWhatsAppMessage(ticket, actionType, includePdfLink ? res.data.url : undefined));
          }
        })
        .catch((err) => {
          console.error('Error generating PDF:', err);
          setMessage(buildWhatsAppMessage(ticket, actionType));
        })
        .finally(() => {
          setIsGeneratingPdf(false);
        });
    }
  }, [ticket, actionType, isOpen]);

  // Update message when PDF link checkbox changes
  useEffect(() => {
    if (ticket && isOpen) {
      const urlToUse = includePdfLink && pdfInfo?.url ? pdfInfo.url : undefined;
      setMessage(buildWhatsAppMessage(ticket, actionType, urlToUse));
    }
  }, [includePdfLink, pdfInfo]);

  if (!isOpen || !ticket) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setPhone(val);
  };

  const isPhoneValid = phone.length >= 7 && phone.length <= 15;

  const handleSendWhatsAppWeb = () => {
    if (!isPhoneValid) {
      alert('El número debe tener entre 7 y 15 dígitos (sin prefijo de país).');
      return;
    }
    const cleanCountry = countryCode.replace('+', '');
    const fullNumber = `${cleanCountry}${phone}`;
    const encodedMsg = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${fullNumber}&text=${encodedMsg}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendTextMeBot = async () => {
    if (!isPhoneValid) {
      alert('El número debe tener entre 7 y 15 dígitos.');
      return;
    }

    if (!textMeBotKey.trim()) {
      alert('Por favor ingrese su API Key de TextMeBot.');
      return;
    }

    // Save key in localStorage
    localStorage.setItem('textmebot_api_key', textMeBotKey.trim());

    setIsSendingBot(true);
    setBotStatusMessage(null);

    const cleanCountry = countryCode.replace('+', '');
    const fullNumber = `${cleanCountry}${phone}`;

    try {
      const res = await api.post(`/comprobantes/${ticket.id}/send-whatsapp`, {
        phone: fullNumber,
        apikey: textMeBotKey.trim(),
        message: message,
      });

      if (res.data?.success) {
        setBotStatusMessage({
          type: 'success',
          text: '✅ ¡Comprobante y PDF enviados con éxito al cliente vía TextMeBot!',
        });
      } else {
        setBotStatusMessage({
          type: 'error',
          text: `⚠️ ${res.data?.message || 'Error al enviar vía TextMeBot'}`,
        });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Error al conectar con TextMeBot';
      setBotStatusMessage({
        type: 'error',
        text: `❌ Error: ${errMsg}`,
      });
    } finally {
      setIsSendingBot(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
        }}
      >
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: '#22c55e20',
                color: '#22c55e',
                padding: '8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Notificar por WhatsApp
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {actionType === 'listo'
                  ? 'Notificación de prendas listas'
                  : actionType === 'recogido'
                  ? 'Agradecimiento por entrega'
                  : `Comprobante ${ticket.cod_comprobante || ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
          }}
        >
          <button
            type="button"
            onClick={() => setSendMode('whatsapp')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              background: sendMode === 'whatsapp' ? '#ffffff' : 'transparent',
              color: sendMode === 'whatsapp' ? '#0f172a' : '#64748b',
              boxShadow: sendMode === 'whatsapp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <MessageSquare size={16} color={sendMode === 'whatsapp' ? '#22c55e' : '#64748b'} />
            WhatsApp Web / App
          </button>

          <button
            type="button"
            onClick={() => setSendMode('textmebot')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              background: sendMode === 'textmebot' ? '#ffffff' : 'transparent',
              color: sendMode === 'textmebot' ? '#4f46e5' : '#64748b',
              boxShadow: sendMode === 'textmebot' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Bot size={16} color={sendMode === 'textmebot' ? '#4f46e5' : '#64748b'} />
            Bot Automático (TextMeBot API)
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {/* Phone Number Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px', marginBottom: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Código de país</label>
              <select
                className="form-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.country}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>
                Número de celular (7-15 dígitos) *
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="Ej. 987654321"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={15}
                autoFocus
              />
            </div>
          </div>

          {!isPhoneValid && phone.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '0.78rem', marginBottom: '10px' }}>
              <AlertCircle size={14} /> El número debe tener entre 7 y 15 dígitos numéricos sin código de país.
            </div>
          )}

          {phone.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', fontSize: '0.78rem', marginBottom: '10px' }}>
              <AlertCircle size={14} /> El cliente no tiene teléfono registrado. Ingrese el número manualmente.
            </div>
          )}

          {/* TextMeBot API Key Field (Only when TextMeBot mode is active) */}
          {sendMode === 'textmebot' && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#4f46e5', fontWeight: 600, fontSize: '0.85rem' }}>
                <Key size={15} /> Clave de API de TextMeBot
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px 0' }}>
                El bot adjuntará el comprobante en PDF automáticamente al mensaje de WhatsApp.
              </p>
              <input
                type="password"
                className="form-input"
                placeholder="Ingresa tu API Key de TextMeBot (ej. aBc123XYZ)"
                value={textMeBotKey}
                onChange={(e) => setTextMeBotKey(e.target.value)}
              />
            </div>
          )}

          {/* PDF Status / Download Banner */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#16a34a" />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d' }}>
                  Comprobante en PDF (Estructura Año/Mes)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#166534' }}>
                  {isGeneratingPdf
                    ? 'Generando documento PDF...'
                    : pdfInfo
                    ? `${pdfInfo.filename}`
                    : 'Listo para generar'}
                </div>
              </div>
            </div>

            {pdfInfo?.url && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: '#166534',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includePdfLink}
                    onChange={(e) => setIncludePdfLink(e.target.checked)}
                  />
                  Incluir link
                </label>
                <a
                  href={pdfInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#ffffff',
                    textDecoration: 'none',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <Download size={13} /> Ver PDF
                </a>
              </div>
            )}
          </div>

          {/* Status message after bot send */}
          {botStatusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                marginBottom: '12px',
                background: botStatusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: botStatusMessage.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${botStatusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              }}
            >
              {botStatusMessage.text}
            </div>
          )}

          {/* Message Textarea */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label className="form-label" style={{ fontSize: '0.82rem', margin: 0 }}>
                Vista previa del mensaje
              </label>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={handleCopyMessage}
              >
                {copied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar texto'}
              </button>
            </div>
            <textarea
              className="form-input"
              rows={7}
              style={{
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                lineHeight: '1.4',
                resize: 'vertical',
              }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '14px',
          }}
        >
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {sendMode === 'whatsapp' ? (
              <button
                type="button"
                className="btn-primary"
                style={{
                  background: '#22c55e',
                  borderColor: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onClick={handleSendWhatsAppWeb}
              >
                <ExternalLink size={16} /> Abrir en WhatsApp
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                style={{
                  background: '#4f46e5',
                  borderColor: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                disabled={isSendingBot || isGeneratingPdf}
                onClick={handleSendTextMeBot}
              >
                {isSendingBot ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Enviando vía Bot...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Enviar PDF con TextMeBot
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
