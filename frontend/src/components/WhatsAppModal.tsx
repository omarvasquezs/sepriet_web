import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
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
  autoSend?: boolean;
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

export const DEFAULT_THANK_YOU_MESSAGE = `Gracias por confiar en nosotros ✨Esperamos que el servicio haya sido de tu total satisfacción.\n¡Será un gusto atenderte nuevamente!`;

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
  const diasRecojo = 7;

  const sb: string[] = [];

  if (actionType === 'listo') {
    sb.push(`Para informarle que sus prendas ya estan listas para recoger.\n`);
    sb.push(`Comprobante: ${cod}\n`);
  } else if (actionType === 'recogido') {
    sb.push(`Para informarle que sus prendas han sido entregadas con éxito.\n`);
    sb.push(`Comprobante: ${cod}\n`);
  } else {
    sb.push(`LAVANDERIA SEPRIET`);
    sb.push(`Jr. Enrique Nerini N° 995 Urb. San Luis`);

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
      const peso = parseFloat(det.peso_kg || 0);
      const costo = parseFloat(det.costo_kilo || 0);
      const subtotal = peso * costo;

      if (peso > 0.001) {
        sb.push(`- ${srvNom}: ${peso.toFixed(2)} kg x ${costo.toFixed(2)} = ${subtotal.toFixed(2)}`);
      } else {
        sb.push(`- ${srvNom}: ${subtotal > 0 ? subtotal.toFixed(2) : costo.toFixed(2)}`);
      }
    });
    sb.push('');
  } else {
    sb.push('- (sin detalles)\n');
  }

  // Totales y descuentos
  if (descuento > 0) {
    const totalConDescuento = costoTotal;
    const totalSinDescuento = totalConDescuento / (1.0 - descuento / 100.0);
    const descuentoMonto = totalSinDescuento - totalConDescuento;

    sb.push(`TOTAL SIN DESCUENTO: ${totalSinDescuento.toFixed(2)}`);
    sb.push(`DESCUENTO: ${descuento.toFixed(1)}% (S/. ${descuentoMonto.toFixed(2)})`);
    sb.push(`TOTAL CON DESCUENTO: ${totalConDescuento.toFixed(2)}\n`);
  } else {
    sb.push(`TOTAL: ${costoTotal.toFixed(2)}\n`);
  }

  // Abonos
  if (ticket.ingresos && ticket.ingresos.length > 0) {
    sb.push('ABONOS:');
    ticket.ingresos.forEach((ing: any) => {
      const f = ing.fecha
        ? new Date(ing.fecha).toLocaleDateString('es-PE') +
          ' ' +
          new Date(ing.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        : '';
      const metodo = ing.metodo_pago?.nom_metodo_pago ? ` (${String(ing.metodo_pago.nom_metodo_pago).toUpperCase()})` : '';
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
  autoSend = false,
}) => {
  const [countryCode, setCountryCode] = useState('+51');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [secondMessage, setSecondMessage] = useState(DEFAULT_THANK_YOU_MESSAGE);
  const [includeSecondMessage, setIncludeSecondMessage] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedSecond, setCopiedSecond] = useState(false);
  const [currentActionType, setCurrentActionType] = useState<'ticket' | 'listo' | 'recogido'>(actionType);

  // Sync actionType prop when modal opens or prop changes
  useEffect(() => {
    setCurrentActionType(actionType);
  }, [actionType, isOpen]);

  // Bot API Key state
  const [textMeBotKey, setTextMeBotKey] = useState<string>(
    localStorage.getItem('textmebot_api_key') || 'hCS2aZ9aHwhF'
  );
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);

  // PDF Generation State
  const [pdfInfo, setPdfInfo] = useState<{ url: string; filename: string } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [includePdfLink, setIncludePdfLink] = useState(true);

  // Sending state
  const [isSendingBot, setIsSendingBot] = useState(false);
  const [botStatusMessage, setBotStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const autoSendTriggeredRef = useRef(false);

  // Send via Bot handler
  const executeSendBot = async (
    targetPhone: string,
    targetCountry: string,
    targetMsg: string,
    targetSecondMsg?: string,
    targetSecondIncluded = true
  ) => {
    if (!targetPhone || targetPhone.length < 7 || targetPhone.length > 15) {
      setBotStatusMessage({
        type: 'error',
        text: '⚠️ El número debe tener entre 7 y 15 dígitos.',
      });
      return;
    }

    const key = textMeBotKey.trim() || 'hCS2aZ9aHwhF';
    localStorage.setItem('textmebot_api_key', key);

    setIsSendingBot(true);
    setBotStatusMessage({
      type: 'info',
      text: '🤖 Enviando comprobante y PDF vía TextMeBot...',
    });

    const cleanCountry = targetCountry.replace('+', '');
    const fullNumber = `${cleanCountry}${targetPhone}`;

    try {
      // 1. Enviar comprobante oficial (con documento PDF adjunto)
      const res = await api.post(`/comprobantes/${ticket.id}/send-whatsapp`, {
        phone: fullNumber,
        apikey: key,
        message: targetMsg,
        format: 'a4',
      });

      if (!res.data?.success) {
        setBotStatusMessage({
          type: 'error',
          text: `⚠️ ${res.data?.message || 'Error al enviar comprobante vía TextMeBot'}`,
        });
        setIsSendingBot(false);
        return;
      }

      // 2. Si es estado RECOGIDO y se incluye el 2do mensaje de agradecimiento:
      if (currentActionType === 'recogido' && targetSecondIncluded && targetSecondMsg && targetSecondMsg.trim()) {
        for (let i = 8; i > 0; i--) {
          setBotStatusMessage({
            type: 'info',
            text: `✅ Comprobante enviado. Enviando agradecimiento en ${i} seg...`,
          });
          await new Promise((r) => setTimeout(r, 1000));
        }

        const res2 = await api.post(`/comprobantes/${ticket.id}/send-whatsapp`, {
          phone: fullNumber,
          apikey: key,
          message: targetSecondMsg.trim(),
          only_text: true,
        });

        if (res2.data?.success) {
          setBotStatusMessage({
            type: 'success',
            text: '✅ ¡Comprobante actualizado y mensaje de agradecimiento enviados con éxito vía TextMeBot!',
          });
        } else {
          setBotStatusMessage({
            type: 'error',
            text: `⚠️ Comprobante enviado, pero el agradecimiento falló: ${res2.data?.message || 'Error'}`,
          });
        }
      } else {
        setBotStatusMessage({
          type: 'success',
          text: '✅ ¡Comprobante y PDF enviados con éxito al cliente vía TextMeBot!',
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

  // Fetch or generate PDF when modal opens
  useEffect(() => {
    if (ticket && isOpen) {
      autoSendTriggeredRef.current = false;
      const rawPhone = ticket.cliente?.telefono || '';
      const cleanPhone = rawPhone.replace(/\D/g, '');
      setPhone(cleanPhone);

      const rawCode = ticket.cliente?.codigo_pais?.trim();
      const initialCountry = rawCode || '+51';
      setCountryCode(initialCountry);

      setCopied(false);
      setBotStatusMessage(null);

      // Trigger background PDF generation (A4 format by default)
      setIsGeneratingPdf(true);
      api
        .get(`/comprobantes/${ticket.id}/pdf?format=a4`)
        .then((res) => {
          if (res.data?.success) {
            let cleanUrl = res.data.url;
            try {
              const apiBase = import.meta.env.VITE_API_BASE_URL;
              if (apiBase && (cleanUrl.includes('localhost:8000') || cleanUrl.startsWith('/'))) {
                const apiOrigin = new URL(apiBase, window.location.origin).origin;
                cleanUrl = cleanUrl.replace(/^https?:\/\/localhost:8000/, apiOrigin);
                if (cleanUrl.startsWith('/')) {
                  cleanUrl = `${apiOrigin}${cleanUrl}`;
                }
              }
            } catch {
              // fallback
            }
            setPdfInfo({
              url: cleanUrl,
              filename: res.data.filename,
            });
            const preparedMsg = buildWhatsAppMessage(ticket, currentActionType, cleanUrl);
            setMessage(preparedMsg);

            // Auto-send if requested and phone has minimum digits
            if (autoSend && cleanPhone.length >= 7 && !autoSendTriggeredRef.current) {
              autoSendTriggeredRef.current = true;
              executeSendBot(cleanPhone, initialCountry, preparedMsg, secondMessage, includeSecondMessage);
            } else if (autoSend && cleanPhone.length < 7) {
              setBotStatusMessage({
                type: 'error',
                text: '⚠️ El cliente no tiene teléfono registrado. Ingrese el número y presione Enviar.',
              });
            }
          }
        })
        .catch((err) => {
          console.error('Error generating PDF:', err);
          const fallbackMsg = buildWhatsAppMessage(ticket, currentActionType);
          setMessage(fallbackMsg);

          if (autoSend && cleanPhone.length >= 7 && !autoSendTriggeredRef.current) {
            autoSendTriggeredRef.current = true;
            executeSendBot(cleanPhone, initialCountry, fallbackMsg, secondMessage, includeSecondMessage);
          }
        })
        .finally(() => {
          setIsGeneratingPdf(false);
        });
    }
  }, [ticket, isOpen]);

  // Update message when actionType or PDF link checkbox changes
  useEffect(() => {
    if (ticket && isOpen) {
      const urlToUse = includePdfLink && pdfInfo?.url ? pdfInfo.url : undefined;
      setMessage(buildWhatsAppMessage(ticket, currentActionType, urlToUse));
    }
  }, [currentActionType, includePdfLink, pdfInfo, ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setPhone(val);
  };

  const isPhoneValid = phone.length >= 7 && phone.length <= 15;

  const handleManualSendClick = () => {
    executeSendBot(phone, countryCode, message, secondMessage, includeSecondMessage);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100050 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: '#22c55e20',
                color: '#16a34a',
                padding: '8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Notificar por WhatsApp (Bot Automático)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {currentActionType === 'listo'
                  ? 'Aviso de prendas listas para recojo'
                  : currentActionType === 'recogido'
                  ? 'Confirmación y agradecimiento por entrega'
                  : `Comprobante ${ticket.cod_comprobante || ''}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notification Status Switcher Tabs */}
        <div style={{ marginBottom: '14px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '10px',
            }}
          >
            <button
              type="button"
              onClick={() => setCurrentActionType('ticket')}
              style={{
                padding: '7px 8px',
                fontSize: '0.8rem',
                fontWeight: currentActionType === 'ticket' ? 700 : 500,
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                background: currentActionType === 'ticket' ? '#ffffff' : 'transparent',
                color: currentActionType === 'ticket' ? '#1e293b' : '#64748b',
                boxShadow: currentActionType === 'ticket' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              🧾 Registro / Abono
            </button>
            <button
              type="button"
              onClick={() => setCurrentActionType('listo')}
              style={{
                padding: '7px 8px',
                fontSize: '0.8rem',
                fontWeight: currentActionType === 'listo' ? 700 : 500,
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                background: currentActionType === 'listo' ? '#ffffff' : 'transparent',
                color: currentActionType === 'listo' ? '#4338ca' : '#64748b',
                boxShadow: currentActionType === 'listo' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              👕 Prendas Listas
            </button>
            <button
              type="button"
              onClick={() => setCurrentActionType('recogido')}
              style={{
                padding: '7px 8px',
                fontSize: '0.8rem',
                fontWeight: currentActionType === 'recogido' ? 700 : 500,
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                background: currentActionType === 'recogido' ? '#ffffff' : 'transparent',
                color: currentActionType === 'recogido' ? '#047857' : '#64748b',
                boxShadow: currentActionType === 'recogido' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              ✨ Entregado / Gracias
            </button>
          </div>
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
              <AlertCircle size={14} /> El cliente no tiene teléfono registrado. Ingrese el número para notificarlo.
            </div>
          )}

          {/* PDF Status / Download Banner */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#16a34a" />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d' }}>
                  Comprobante en PDF (Adjunto al mensaje)
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

          {/* Status Message */}
          {botStatusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background:
                  botStatusMessage.type === 'success'
                    ? '#f0fdf4'
                    : botStatusMessage.type === 'info'
                    ? '#eff6ff'
                    : '#fef2f2',
                color:
                  botStatusMessage.type === 'success'
                    ? '#166534'
                    : botStatusMessage.type === 'info'
                    ? '#1d4ed8'
                    : '#991b1b',
                border: `1px solid ${
                  botStatusMessage.type === 'success'
                    ? '#bbf7d0'
                    : botStatusMessage.type === 'info'
                    ? '#bfdbfe'
                    : '#fecaca'
                }`,
              }}
            >
              {botStatusMessage.type === 'info' && <Loader2 size={15} className="animate-spin" />}
              <div>{botStatusMessage.text}</div>
            </div>
          )}

          {/* Optional API Key Settings */}
          <div style={{ marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setShowApiKeyConfig(!showApiKeyConfig)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '0.76rem',
                color: '#6366f1',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <Key size={13} /> {showApiKeyConfig ? 'Ocultar configuración de Bot' : 'Configuración de API Key (TextMeBot)'}
            </button>
            {showApiKeyConfig && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px',
                  marginTop: '6px',
                }}
              >
                <input
                  type="password"
                  className="form-input"
                  placeholder="API Key de TextMeBot"
                  value={textMeBotKey}
                  onChange={(e) => {
                    setTextMeBotKey(e.target.value);
                    localStorage.setItem('textmebot_api_key', e.target.value.trim());
                  }}
                />
              </div>
            )}
          </div>

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
              <label className="form-label" style={{ fontSize: '0.82rem', margin: 0, fontWeight: 600 }}>
                {currentActionType === 'recogido'
                  ? '1er Mensaje: Notificación de Comprobante / Entrega'
                  : 'Vista previa del mensaje'}
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
              rows={currentActionType === 'recogido' ? 5 : 7}
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

          {/* 2do Mensaje: Agradecimiento al cliente (Específico al entregar / recogido) */}
          {currentActionType === 'recogido' && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#047857',
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeSecondMessage}
                    onChange={(e) => setIncludeSecondMessage(e.target.checked)}
                  />
                  ✨ 2do Mensaje: Agradecimiento por entrega
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
                  onClick={() => {
                    navigator.clipboard.writeText(secondMessage);
                    setCopiedSecond(true);
                    setTimeout(() => setCopiedSecond(false), 2500);
                  }}
                >
                  {copiedSecond ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                  {copiedSecond ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <textarea
                className="form-input"
                rows={3}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  lineHeight: '1.4',
                  resize: 'vertical',
                }}
                value={secondMessage}
                onChange={(e) => setSecondMessage(e.target.value)}
              />
            </div>
          )}
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

          <button
            type="button"
            className="btn-primary"
            style={{
              background: '#22c55e',
              borderColor: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              padding: '8px 18px',
            }}
            disabled={isSendingBot || isGeneratingPdf}
            onClick={handleManualSendClick}
          >
            {isSendingBot ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Enviando con Bot...
              </>
            ) : (
              <>
                <Send size={16} />{' '}
                {currentActionType === 'recogido' && includeSecondMessage
                  ? 'Enviar Comprobante + Agradecimiento (Bot)'
                  : 'Enviar Notificación con Bot'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
