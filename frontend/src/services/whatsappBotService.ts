import api from '../api/axios';
import { showTopAlert } from '../utils/topAlert';

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
  const diasRecojo = 30;

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

/**
 * Sends a WhatsApp notification via the automated Bot (TextMeBot) in the background.
 * Triggers a 5-second green top alert bar upon completion without opening any modal.
 */
export const sendWhatsAppBotNotification = async (
  ticket: any,
  actionType: 'ticket' | 'listo' | 'recogido' = 'ticket',
  customMessage?: string
): Promise<boolean> => {
  if (!ticket || !ticket.id) return false;

  const cod = ticket.cod_comprobante || `Ticket #${ticket.id}`;
  const rawPhone = ticket.cliente?.telefono || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const rawCode = ticket.cliente?.codigo_pais?.trim();
  const countryCode = rawCode || '+51';

  if (!cleanPhone || cleanPhone.length < 7 || cleanPhone.length > 15) {
    showTopAlert(
      `Comprobante ${cod}: El cliente no tiene teléfono celular registrado para enviar WhatsApp.`,
      'warning',
      'Aviso WhatsApp',
      5000
    );
    return false;
  }

  const cleanCountry = countryCode.replace('+', '');
  const fullNumber = `${cleanCountry}${cleanPhone}`;
  const apiKey = localStorage.getItem('textmebot_api_key') || 'hCS2aZ9aHwhF';
  const messageToSend = customMessage || buildWhatsAppMessage(ticket, actionType);

  try {
    const res = await api.post(`/comprobantes/${ticket.id}/send-whatsapp`, {
      phone: fullNumber,
      apikey: apiKey,
      message: messageToSend,
      format: 'a4',
      force_regenerate_pdf: true,
    });

    if (!res.data?.success) {
      showTopAlert(
        `Comprobante ${cod}: Falló el envío WhatsApp al (+${fullNumber}) - ${res.data?.message || 'Error'}`,
        'error',
        'Error WhatsApp',
        6000
      );
      return false;
    }

    // If actionType is 'recogido', dispatch initial success and sequence the thank you note after 8 seconds
    if (actionType === 'recogido') {
      showTopAlert(
        `¡Comprobante ${cod} entregado! Notificación enviada a (+${fullNumber}). Enviando mensaje de agradecimiento...`,
        'success',
        'WhatsApp Bot',
        5000
      );

      setTimeout(async () => {
        try {
          await api.post(`/comprobantes/${ticket.id}/send-whatsapp`, {
            phone: fullNumber,
            apikey: apiKey,
            message: DEFAULT_THANK_YOU_MESSAGE,
            only_text: true,
          });
          showTopAlert(
            `¡Mensaje de agradecimiento enviado con éxito a (+${fullNumber}) vía WhatsApp Bot! ✨`,
            'success',
            'WhatsApp Bot',
            5000
          );
        } catch (err: any) {
          console.error('Error sending 2nd thank you message:', err);
        }
      }, 8200);

      return true;
    }

    // Standard ticket creation, abono, or listo
    let actionDesc = 'Notificación y PDF oficial A4 enviados con éxito';
    if (actionType === 'listo') {
      actionDesc = 'Aviso de prendas listas y PDF A4 enviados con éxito';
    }

    showTopAlert(
      `¡Comprobante ${cod}! ${actionDesc} por WhatsApp a (+${fullNumber}) vía Bot.`,
      'success',
      'WhatsApp Bot',
      5000
    );
    return true;
  } catch (err: any) {
    const errMsg = err.response?.data?.message || err.message || 'Error de conexión con TextMeBot';
    showTopAlert(
      `Comprobante ${cod}: Error al enviar WhatsApp a (+${fullNumber}) - ${errMsg}`,
      'error',
      'Error WhatsApp',
      6000
    );
    return false;
  }
};
