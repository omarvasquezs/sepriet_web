import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Plus, Printer, DollarSign, Trash2, ChevronLeft, ChevronRight, MessageSquare, Calendar, FileText, X, Download, Filter } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { WhatsAppModal } from '../components/WhatsAppModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AsyncSelect2, type SelectOption } from '../components/AsyncSelect2';

const toDateTimeLocal = (d: Date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export interface ComprobantesPageProps {
  filterPreset?: {
    id: string;
    label: string;
    timestamp: number;
  } | null;
  triggerCreateTicket?: number;
  onClearFilterPreset?: () => void;
}

export const ComprobantesPage: React.FC<ComprobantesPageProps> = ({
  filterPreset,
  triggerCreateTicket,
  onClearFilterPreset,
}) => {
  const { user } = useAuth();
  const isAdmin = (user?.role_id === 1) || Boolean(user?.role && user.role.toLowerCase().includes('admin'));

  const [comprobantesData, setComprobantesData] = useState<any>({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [catalogos, setCatalogos] = useState<any>({ estados_pago: [], estados_ropa: [], metodos_pago: [] });

  const [search, setSearch] = useState('');
  const [estadoPagoFilter, setEstadoPagoFilter] = useState('');
  const [estadoRopaFilter, setEstadoRopaFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [printPdfLoading, setPrintPdfLoading] = useState(false);
  const [printPdfUrl, setPrintPdfUrl] = useState<string | null>(null);
  const [printPdfError, setPrintPdfError] = useState<string | null>(null);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  // WhatsApp Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppTicket, setWhatsAppTicket] = useState<any>(null);
  const [whatsAppActionType, setWhatsAppActionType] = useState<'ticket' | 'listo' | 'recogido'>('ticket');

  // Operation Dates (Admin only)
  const [fechaOperacionCreate, setFechaOperacionCreate] = useState(toDateTimeLocal());
  const [fechaOperacionAbono, setFechaOperacionAbono] = useState(toDateTimeLocal());

  // Abono Form
  const [abonoAmount, setAbonoAmount] = useState('');
  const [abonoMetodoPago, setAbonoMetodoPago] = useState('4');

  // Selected Cliente Option for AsyncSelect2
  const [selectedClienteOption, setSelectedClienteOption] = useState<SelectOption | null>(null);

  // Quick Client Modal State
  const [showQuickClienteModal, setShowQuickClienteModal] = useState(false);
  const [quickClienteForm, setQuickClienteForm] = useState({
    nombres: '',
    dni: '',
    telefono: '',
    direccion: ''
  });

  // Temp service selection for Java/VJS style add row
  const [tempServicioId, setTempServicioId] = useState<string>('');
  const [tempServicioOption, setTempServicioOption] = useState<SelectOption | null>(null);

  // Create Form State (matching Java / VJS)
  const initialCreateForm = {
    tipo_comprobante: 'N', // 'N' | 'B' | 'F'
    cliente_id: '',
    estado_comprobante_id: '4', // Default CANCELADO (4)
    metodo_pago_id: '4', // Efectivo
    descuento: '0.00',
    monto_abonado: '0.00',
    observaciones: '',
    num_ruc: '',
    razon_social: '',
    detalles: [] as Array<{
      servicio_id: string;
      servicio_name?: string;
      peso_kg: string;
      costo_kilo: string;
      selectedOption?: SelectOption | null;
    }>
  };

  const [createForm, setCreateForm] = useState(initialCreateForm);


  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { search, page };
      if (estadoPagoFilter) params.estado_comprobante_id = estadoPagoFilter;
      if (estadoRopaFilter) params.estado_ropa_id = estadoRopaFilter;
      if (filterPreset?.id && !estadoPagoFilter && !estadoRopaFilter) {
        params.preset = filterPreset.id;
      }

      const [compRes, catRes] = await Promise.all([
        api.get('/comprobantes', { params }),
        api.get('/catalogos')
      ]);

      setComprobantesData(compRes.data);
      setCatalogos(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset filters when filterPreset changes from top navigation
  useEffect(() => {
    if (filterPreset) {
      setEstadoPagoFilter('');
      setEstadoRopaFilter('');
      setSearch('');
      setPage(1);
    }
  }, [filterPreset?.timestamp]);

  // Open modal when triggerCreateTicket changes (e.g. Ctrl+N or top menu)
  useEffect(() => {
    if (triggerCreateTicket && triggerCreateTicket > 0) {
      handleOpenCreateModal();
    }
  }, [triggerCreateTicket]);

  useEffect(() => {
    fetchData();
  }, [search, estadoPagoFilter, estadoRopaFilter, filterPreset?.timestamp, page]);

  // Loaders for Select2 with search & lazy loading
  const loadClienteOptions = useCallback(async (query: string, pageNum: number) => {
    const res = await api.get('/clientes', {
      params: { search: query, page: pageNum, per_page: 20 }
    });
    const items = res.data?.data || [];
    const hasMore = res.data ? res.data.current_page < res.data.last_page : false;
    return {
      data: items.map((c: any) => ({
        id: c.id,
        label: c.nombres,
        sublabel: c.dni ? `DNI: ${c.dni}` : 'Sin DNI',
        extraBadge: c.telefono ? `Tel: ${c.telefono}` : undefined,
        raw: c,
      })),
      hasMore,
    };
  }, []);

  const loadServicioOptions = useCallback(async (query: string, pageNum: number) => {
    const res = await api.get('/servicios', {
      params: { search: query, page: pageNum, per_page: 20, habilitado: true }
    });
    const items = res.data?.data || (Array.isArray(res.data) ? res.data : []);
    const hasMore = res.data?.current_page && res.data?.last_page
      ? res.data.current_page < res.data.last_page
      : false;
    return {
      data: items.map((s: any) => {
        const tipoLabel = s.tipo_servicio === 'k' || s.tipo_servicio === 'Kilo' ? 'Kilo' : s.tipo_servicio === 's' ? 'Servicio' : 'Prenda';
        const precio = Number(s.precio_kilo || s.precio_unidad || 0).toFixed(2);
        return {
          id: s.id,
          label: s.nom_servicio,
          sublabel: `Tipo: ${tipoLabel}`,
          extraBadge: `S/ ${precio}`,
          raw: s,
        };
      }),
      hasMore,
    };
  }, []);

  const handleOpenCreateModal = () => {
    setCreateForm(initialCreateForm);
    setSelectedClienteOption(null);
    setTempServicioId('');
    setTempServicioOption(null);
    setFechaOperacionCreate(toDateTimeLocal());
    setShowCreateModal(true);
  };

  const handleAddSelectedServicio = () => {
    if (!tempServicioId || !tempServicioOption) {
      alert('Por favor seleccione un servicio primero.');
      return;
    }
    const raw = tempServicioOption.raw;
    const precio = raw?.precio_kilo || raw?.precio_unidad || 0;
    const newDetalle = {
      servicio_id: String(tempServicioId),
      servicio_name: tempServicioOption.label,
      peso_kg: '1.00',
      costo_kilo: Number(precio).toFixed(2),
      selectedOption: tempServicioOption
    };

    setCreateForm(prev => {
      const updatedDetalles = [...prev.detalles, newDetalle];
      // If CANCELADO, recalculate monto_abonado automatically
      let newMonto = prev.monto_abonado;
      if (prev.estado_comprobante_id === '4') {
        let sub = 0;
        updatedDetalles.forEach(d => {
          sub += Number(d.peso_kg || 0) * Number(d.costo_kilo || 0);
        });
        const desc = Number(prev.descuento || 0);
        newMonto = Math.max(0, sub - desc).toFixed(2);
      }
      return {
        ...prev,
        detalles: updatedDetalles,
        monto_abonado: newMonto
      };
    });

    setTempServicioId('');
    setTempServicioOption(null);

    setTimeout(() => {
      if (tableScrollRef.current) {
        tableScrollRef.current.scrollTop = tableScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleRemoveDetalle = (index: number) => {
    setCreateForm(prev => {
      const updatedDetalles = prev.detalles.filter((_, i) => i !== index);
      let newMonto = prev.monto_abonado;
      if (prev.estado_comprobante_id === '4') {
        let sub = 0;
        updatedDetalles.forEach(d => {
          sub += Number(d.peso_kg || 0) * Number(d.costo_kilo || 0);
        });
        const desc = Number(prev.descuento || 0);
        newMonto = Math.max(0, sub - desc).toFixed(2);
      }
      return {
        ...prev,
        detalles: updatedDetalles,
        monto_abonado: newMonto
      };
    });
  };

  const calculateSubtotalRaw = () => {
    let subtotal = 0;
    createForm.detalles.forEach(d => {
      subtotal += Number(d.peso_kg || 0) * Number(d.costo_kilo || 0);
    });
    return subtotal;
  };

  const calculateTotal = () => {
    const raw = calculateSubtotalRaw();
    const desc = Number(createForm.descuento || 0);
    return Math.max(0, raw - desc);
  };

  const handleEstadoComprobanteChange = (val: string) => {
    const total = calculateTotal();
    if (val === '4') { // CANCELADO
      setCreateForm(prev => ({
        ...prev,
        estado_comprobante_id: val,
        monto_abonado: total.toFixed(2)
      }));
    } else if (val === '1') { // DEBE
      setCreateForm(prev => ({
        ...prev,
        estado_comprobante_id: val,
        monto_abonado: '0.00'
      }));
    } else { // ABONO
      setCreateForm(prev => ({
        ...prev,
        estado_comprobante_id: val,
        monto_abonado: ''
      }));
    }
  };

  const handleQuickClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClienteForm.nombres.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }
    try {
      const res = await api.post('/clientes', {
        ...quickClienteForm,
        codigo_pais: '+51'
      });
      const newClient = res.data;
      setCreateForm(prev => ({ ...prev, cliente_id: String(newClient.id) }));
      setSelectedClienteOption({
        id: newClient.id,
        label: newClient.nombres,
        sublabel: newClient.dni ? `DNI: ${newClient.dni}` : 'Sin DNI',
        extraBadge: newClient.telefono ? `Tel: ${newClient.telefono}` : undefined,
        raw: newClient
      });
      setShowQuickClienteModal(false);
      setQuickClienteForm({ nombres: '', dni: '', telefono: '', direccion: '' });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar cliente');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.detalles.length === 0) {
      alert('Favor ingrese servicios en el comprobante!');
      return;
    }
    if (!createForm.cliente_id) {
      alert('Favor de seleccionar un cliente.');
      return;
    }
    if (createForm.tipo_comprobante === 'F' && (!createForm.num_ruc || !createForm.razon_social)) {
      alert('Para Factura debe ingresar N° de RUC y Razón Social.');
      return;
    }

    const totalFinal = calculateTotal();
    let montoAbonadoReal = 0;

    if (createForm.estado_comprobante_id === '4') {
      montoAbonadoReal = totalFinal;
    } else if (createForm.estado_comprobante_id === '1') {
      montoAbonadoReal = 0;
    } else {
      montoAbonadoReal = Number(createForm.monto_abonado || 0);
      if (montoAbonadoReal <= 0 || montoAbonadoReal >= totalFinal) {
        alert('Para estado ABONO, el monto abonado debe ser mayor a 0 y menor al total.');
        return;
      }
    }

    try {
      const payload: any = {
        tipo_comprobante: createForm.tipo_comprobante,
        cliente_id: Number(createForm.cliente_id),
        metodo_pago_id: Number(createForm.metodo_pago_id || 4),
        descuento: Number(createForm.descuento || 0),
        monto_abonado: montoAbonadoReal,
        num_ruc: createForm.tipo_comprobante === 'F' ? createForm.num_ruc : null,
        razon_social: createForm.tipo_comprobante === 'F' ? createForm.razon_social : null,
        observaciones: createForm.observaciones ? createForm.observaciones.trim() : null,
        detalles: createForm.detalles.map(d => ({
          servicio_id: Number(d.servicio_id),
          peso_kg: Number(d.peso_kg),
          costo_kilo: Number(d.costo_kilo),
        }))
      };

      if (fechaOperacionCreate) {
        payload.fecha_operacion = fechaOperacionCreate;
      }

      const res = await api.post('/comprobantes', payload);
      const createdTicket = res.data;

      setShowCreateModal(false);
      setPage(1);
      fetchData();

      // Open WhatsApp sending dialog with the new ticket details
      setWhatsAppTicket(createdTicket);
      setWhatsAppActionType('ticket');
      setShowWhatsAppModal(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar comprobante');
    }
  };


  const handleAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      const payload: any = {
        monto_abonado: Number(abonoAmount),
        metodo_pago_id: Number(abonoMetodoPago)
      };

      if (isAdmin && fechaOperacionAbono) {
        payload.fecha_operacion = fechaOperacionAbono;
      }

      const res = await api.post(`/comprobantes/${selectedTicket.id}/abono`, payload);
      const updatedTicket = res.data;

      setShowAbonoModal(false);
      setAbonoAmount('');
      fetchData();

      // Offer WhatsApp receipt update
      setWhatsAppTicket(updatedTicket);
      setWhatsAppActionType('ticket');
      setShowWhatsAppModal(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar abono');
    }
  };

  const handleEstadoRopaChange = async (ticket: any, estadoRopaId: string) => {
    try {
      const numericEstado = Number(estadoRopaId);
      const res = await api.put(`/comprobantes/${ticket.id}/estado`, { estado_ropa_id: numericEstado });
      const updated = res.data;
      fetchData();

      // If marked as Listo (id=3) or Entregado/Recogido (id=4), prompt for WhatsApp notification
      if (numericEstado === 3) {
        setWhatsAppTicket(updated);
        setWhatsAppActionType('listo');
        setShowWhatsAppModal(true);
      } else if (numericEstado === 4) {
        setWhatsAppTicket(updated);
        setWhatsAppActionType('recogido');
        setShowWhatsAppModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resolvePdfUrl = (rawUrl?: string): string => {
    if (!rawUrl) return '';
    try {
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

  const handleDownloadPdf = async (ticketId: number) => {
    try {
      const res = await api.get(`/comprobantes/${ticketId}/pdf`);
      const targetUrl = resolvePdfUrl(res.data?.url);
      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'No se pudo generar el comprobante en PDF');
    }
  };

  const handleOpenPrintModal = async (ticket: any) => {
    setSelectedTicket(ticket);
    setShowPrintModal(true);
    setPrintPdfLoading(true);
    setPrintPdfError(null);
    setPrintPdfUrl(null);

    try {
      const res = await api.get(`/comprobantes/${ticket.id}/pdf`);
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

  const handlePrintPdfDocument = () => {
    if (!printPdfUrl) return;

    // Method 1: Try printing through iframe contentWindow
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
      .catch(() => {
        window.open(printPdfUrl, '_blank');
      });
  };

  const getBadgeClassPago = (nombre: string) => {
    switch (nombre?.toUpperCase()) {
      case 'CANCELADO': return 'badge-listo';
      case 'ABONO': return 'badge-proceso';
      case 'DEBE': return 'badge-pendiente';
      case 'ANULADO': return 'badge-cancelado';
      default: return 'badge-pendiente';
    }
  };

  return (
    <div className="page-container">
      {/* Active Filter Preset Notification from Top Menu CONSULTAR */}
      {filterPreset && !estadoPagoFilter && !estadoRopaFilter && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            padding: '10px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            color: '#3730a3',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color="#4f46e5" />
            <span>Filtro activo desde menú Consultar: <strong>{filterPreset.label}</strong></span>
          </div>
          {onClearFilterPreset && (
            <button
              type="button"
              onClick={onClearFilterPreset}
              style={{
                background: '#ffffff',
                border: '1px solid #c7d2fe',
                borderRadius: '6px',
                padding: '4px 10px',
                color: '#4f46e5',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <X size={14} /> Quitar filtro
            </button>
          )}
        </div>
      )}

      <div className="comprobantes-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', flex: '1 1 320px', flexWrap: 'wrap' }}>
          <div className="comprobantes-search-wrapper">
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '42px' }}
              placeholder="Buscar ticket, DNI, cliente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value.toUpperCase()); setPage(1); }}
            />
          </div>

          <div className="comprobantes-filters-wrapper">
            <select
              className="form-select"
              style={{ flex: 1, minWidth: 0 }}
              value={estadoPagoFilter}
              onChange={(e) => { setEstadoPagoFilter(e.target.value); setPage(1); }}
            >
              <option value="">Pago: Todos</option>
              {catalogos.estados_pago.map((ep: any) => (
                <option key={ep.id} value={ep.id}>{ep.nom_estado || ep.nombre}</option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ flex: 1, minWidth: 0 }}
              value={estadoRopaFilter}
              onChange={(e) => { setEstadoRopaFilter(e.target.value); setPage(1); }}
            >
              <option value="">Prendas: Todos</option>
              {catalogos.estados_ropa.map((er: any) => (
                <option key={er.id} value={er.id}>{er.nom_estado_ropa || er.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ flex: '0 0 auto' }}
          onClick={handleOpenCreateModal}
        >
          <Plus size={18} /> Registrar Comprobante
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '16px' }}>
        {loading ? (
          <LoadingSpinner text="Cargando comprobantes y tickets..." />
        ) : comprobantesData.data.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No se encontraron comprobantes con esos filtros.</p>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="table-responsive hide-on-mobile">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Estado Pago</th>
                    <th>Estado Ropa</th>
                    <th>Total</th>
                    <th>Abonado</th>
                    <th>Restante</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comprobantesData.data.map((t: any) => (
                    <tr key={t.id} className="row-item">
                      <td style={{ fontWeight: 700, color: '#4f46e5' }}>{t.cod_comprobante || `N° ${t.id}`}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.cliente?.nombres || 'Cliente Genérico'}</td>
                      <td>{new Date(t.fecha).toLocaleDateString('es-PE')}</td>
                      <td>
                        <span className={`badge ${getBadgeClassPago(t.estado_comprobante?.nom_estado || t.estado_comprobante?.nombre)}`}>
                          {t.estado_comprobante?.nom_estado || t.estado_comprobante?.nombre || 'DEBE'}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', fontWeight: 600 }}
                          value={t.estado_ropa_id || 1}
                          onChange={(e) => handleEstadoRopaChange(t, e.target.value)}
                        >
                          {catalogos.estados_ropa.map((er: any) => (
                            <option key={er.id} value={er.id}>{er.nom_estado_ropa || er.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>S/ {Number(t.costo_total).toFixed(2)}</td>
                      <td style={{ color: '#059669', fontWeight: 600 }}>S/ {Number(t.monto_abonado).toFixed(2)}</td>
                      <td style={{ color: Number(t.monto_restante) > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                        S/ {Number(t.monto_restante).toFixed(2)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {Number(t.monto_restante) > 0 && (
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                              title="Registrar Abono"
                              onClick={() => {
                                setSelectedTicket(t);
                                setFechaOperacionAbono(toDateTimeLocal());
                                setAbonoMetodoPago('4');
                                setShowAbonoModal(true);
                              }}
                            >
                              <DollarSign size={14} color="#059669" /> Abono
                            </button>
                          )}
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px', color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                            title="Enviar por WhatsApp"
                            onClick={() => {
                              setWhatsAppTicket(t);
                              setWhatsAppActionType('ticket');
                              setShowWhatsAppModal(true);
                            }}
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px', color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff' }}
                            title="Descargar / Ver PDF"
                            onClick={() => handleDownloadPdf(t.id)}
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 8px' }}
                            title="Imprimir / Vista Previa"
                            onClick={() => handleOpenPrintModal(t)}
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="hide-on-desktop">
              {comprobantesData.data.map((t: any) => (
                <div key={t.id} className="mobile-ticket-card">
                  <div className="mobile-ticket-card-header">
                    <div>
                      <div className="mobile-ticket-code">{t.cod_comprobante || `N° ${t.id}`}</div>
                      <span className="mobile-ticket-date">
                        {new Date(t.fecha).toLocaleDateString('es-PE')} • {new Date(t.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`badge ${getBadgeClassPago(t.estado_comprobante?.nom_estado || t.estado_comprobante?.nombre)}`}>
                      {t.estado_comprobante?.nom_estado || t.estado_comprobante?.nombre || 'DEBE'}
                    </span>
                  </div>

                  <div className="mobile-ticket-client">
                    <span>{t.cliente?.nombres || 'Cliente Genérico'}</span>
                    {t.cliente?.telefono && (
                      <span className="mobile-ticket-phone">Tel: {t.cliente.telefono}</span>
                    )}
                  </div>

                  <div className="mobile-ticket-stats-grid">
                    <div className="mobile-ticket-stat-item">
                      <span className="mobile-ticket-stat-label">Total</span>
                      <span className="mobile-ticket-stat-val">S/ {Number(t.costo_total).toFixed(2)}</span>
                    </div>
                    <div className="mobile-ticket-stat-item">
                      <span className="mobile-ticket-stat-label">Abonado</span>
                      <span className="mobile-ticket-stat-val" style={{ color: '#059669' }}>S/ {Number(t.monto_abonado).toFixed(2)}</span>
                    </div>
                    <div className="mobile-ticket-stat-item">
                      <span className="mobile-ticket-stat-label">Saldo</span>
                      <span className="mobile-ticket-stat-val" style={{ color: Number(t.monto_restante) > 0 ? '#dc2626' : '#059669' }}>
                        S/ {Number(t.monto_restante).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Prendas:</span>
                    <select
                      className="form-select"
                      style={{ padding: '6px 8px', fontSize: '0.82rem', fontWeight: 600, maxWidth: '200px' }}
                      value={t.estado_ropa_id || 1}
                      onChange={(e) => handleEstadoRopaChange(t, e.target.value)}
                    >
                      {catalogos.estados_ropa.map((er: any) => (
                        <option key={er.id} value={er.id}>{er.nom_estado_ropa || er.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mobile-ticket-actions">
                    {Number(t.monto_restante) > 0 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.82rem', fontWeight: 700, color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', flex: '1 1 auto' }}
                        title="Registrar Abono"
                        onClick={() => {
                          setSelectedTicket(t);
                          setFechaOperacionAbono(toDateTimeLocal());
                          setAbonoMetodoPago('4');
                          setShowAbonoModal(true);
                        }}
                      >
                        <DollarSign size={14} color="#059669" /> Abono
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '8px 12px', color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', flex: '1 1 auto' }}
                      title="Enviar por WhatsApp"
                      onClick={() => {
                        setWhatsAppTicket(t);
                        setWhatsAppActionType('ticket');
                        setShowWhatsAppModal(true);
                      }}
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '8px 12px', color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', flex: '1 1 auto' }}
                      title="Descargar / Ver PDF"
                      onClick={() => handleDownloadPdf(t.id)}
                    >
                      <FileText size={14} /> PDF
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', flex: '1 1 auto' }}
                      title="Imprimir / Vista Previa"
                      onClick={() => handleOpenPrintModal(t)}
                    >
                      <Printer size={14} /> Imprimir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Página {comprobantesData.current_page} de {comprobantesData.last_page} ({comprobantesData.total} tickets)
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  style={{ opacity: page <= 1 ? 0.5 : 1, padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <button
                  className="btn-secondary"
                  disabled={page >= comprobantesData.last_page}
                  onClick={() => setPage(prev => prev + 1)}
                  style={{ opacity: page >= comprobantesData.last_page ? 0.5 : 1, padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Registrar Comprobante Estilo Java / VJS */}
      {showCreateModal && (() => {
        const rawSubtotal = calculateSubtotalRaw();
        const descVal = Number(createForm.descuento || 0);
        const totalFinal = Math.max(0, rawSubtotal - descVal);
        const igvCalculado = totalFinal * 0.18;
        const opGravadas = totalFinal - igvCalculado;

        return (
          <div className="modal-overlay">
            <div className="modal-content-comprobante-vjs">
              {/* Header ventana */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '2px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.3px', textTransform: 'uppercase' }}>
                  REGISTRO DE COMPROBANTE
                </h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowCreateModal(false)}
                  title="Cerrar ventana"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="comprobante-vjs-grid">
                  {/* COLUMNA IZQUIERDA: Clientes, Estados, Servicios y Tabla */}
                  <div>
                    {/* Fila 1: Cliente + Añadir Nuevo Cliente */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          CLIENTE:
                        </label>
                        <AsyncSelect2
                          value={createForm.cliente_id}
                          initialOption={selectedClienteOption}
                          placeholder="-- SELECCIONAR CLIENTE --"
                          searchPlaceholder="Escriba nombre, DNI o teléfono..."
                          loadOptions={loadClienteOptions}
                          required
                          onChange={(val, opt) => {
                            setCreateForm({ ...createForm, cliente_id: String(val || '') });
                            setSelectedClienteOption(opt || null);
                          }}
                        />
                      </div>
                      <div style={{ paddingTop: '21px' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => setShowQuickClienteModal(true)}
                          style={{
                            padding: '9px 16px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            backgroundColor: '#0d6efd',
                            borderColor: '#0d6efd',
                            color: '#ffffff',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap',
                            height: '42px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Plus size={16} /> AÑADIR NUEVO CLIENTE
                        </button>
                      </div>
                    </div>

                    {/* Fila 2: Estado Comprobante + Tipo Comprobante (Segmented) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          ESTADO:
                        </label>
                        <select
                          className="form-select"
                          value={createForm.estado_comprobante_id}
                          onChange={(e) => handleEstadoComprobanteChange(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <option value="4">CANCELADO</option>
                          <option value="2">ABONO</option>
                          <option value="1">DEBE</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          TIPO DE COMPROBANTE:
                        </label>
                        <div style={{ display: 'flex', width: '100%' }}>
                          <button
                            type="button"
                            onClick={() => setCreateForm({ ...createForm, tipo_comprobante: 'N' })}
                            style={{
                              flex: 1,
                              padding: '9px 6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              border: '1px solid #0d6efd',
                              borderRadius: '6px 0 0 6px',
                              backgroundColor: createForm.tipo_comprobante === 'N' ? '#0d6efd' : '#ffffff',
                              color: createForm.tipo_comprobante === 'N' ? '#ffffff' : '#0d6efd',
                              cursor: 'pointer'
                            }}
                          >
                            NOTA DE VENTA
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreateForm({ ...createForm, tipo_comprobante: 'B' })}
                            style={{
                              flex: 1,
                              padding: '9px 6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              borderTop: '1px solid #0d6efd',
                              borderBottom: '1px solid #0d6efd',
                              borderLeft: 'none',
                              borderRight: 'none',
                              backgroundColor: createForm.tipo_comprobante === 'B' ? '#0d6efd' : '#ffffff',
                              color: createForm.tipo_comprobante === 'B' ? '#ffffff' : '#0d6efd',
                              cursor: 'pointer'
                            }}
                          >
                            BOLETA
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreateForm({ ...createForm, tipo_comprobante: 'F' })}
                            style={{
                              flex: 1,
                              padding: '9px 6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              border: '1px solid #0d6efd',
                              borderRadius: '0 6px 6px 0',
                              backgroundColor: createForm.tipo_comprobante === 'F' ? '#0d6efd' : '#ffffff',
                              color: createForm.tipo_comprobante === 'F' ? '#ffffff' : '#0d6efd',
                              cursor: 'pointer'
                            }}
                          >
                            FACTURA
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Fila 3: Condición de Pago */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                        CONDICIÓN DE PAGO:
                      </label>
                      <select
                        className="form-select"
                        value={createForm.metodo_pago_id}
                        disabled={createForm.estado_comprobante_id === '1'}
                        onChange={(e) => setCreateForm({ ...createForm, metodo_pago_id: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.88rem',
                          backgroundColor: createForm.estado_comprobante_id === '1' ? '#f1f5f9' : '#ffffff'
                        }}
                      >
                        {catalogos.metodos_pago.map((mp: any) => (
                          <option key={mp.id} value={mp.id}>{mp.nom_metodo_pago}</option>
                        ))}
                      </select>
                    </div>

                    {/* Fila 4: N° de RUC y Razón Social */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          N° DE RUC:
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="N° DE RUC"
                          value={createForm.num_ruc}
                          disabled={createForm.tipo_comprobante !== 'F'}
                          required={createForm.tipo_comprobante === 'F'}
                          onChange={(e) => setCreateForm({ ...createForm, num_ruc: e.target.value.toUpperCase() })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.88rem',
                            backgroundColor: createForm.tipo_comprobante === 'F' ? '#ffffff' : '#f1f5f9'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          RAZON SOCIAL:
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="RAZON SOCIAL"
                          value={createForm.razon_social}
                          disabled={createForm.tipo_comprobante !== 'F'}
                          required={createForm.tipo_comprobante === 'F'}
                          onChange={(e) => setCreateForm({ ...createForm, razon_social: e.target.value.toUpperCase() })}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.88rem',
                            backgroundColor: createForm.tipo_comprobante === 'F' ? '#ffffff' : '#f1f5f9'
                          }}
                        />
                      </div>
                    </div>

                    {/* Fila 5: Selector de Servicio + Botón Añadir */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          SELECCIONAR SERVICIO:
                        </label>
                        <AsyncSelect2
                          value={tempServicioId}
                          initialOption={tempServicioOption}
                          placeholder="-- SELECCIONAR SERVICIO --"
                          searchPlaceholder="Buscar por nombre de servicio..."
                          loadOptions={loadServicioOptions}
                          onChange={(val, opt) => {
                            setTempServicioId(val ? String(val) : '');
                            setTempServicioOption(opt || null);
                          }}
                        />
                      </div>
                      <div style={{ paddingTop: '21px' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handleAddSelectedServicio}
                          style={{
                            padding: '9px 20px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            backgroundColor: '#0d6efd',
                            borderColor: '#0d6efd',
                            color: '#ffffff',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap',
                            height: '42px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Plus size={16} /> AÑADIR
                        </button>
                      </div>
                    </div>

                    {/* Fila 6: Tabla de Servicios (Grilla fija con scroll vertical estilo Java/iframe) */}
                    <div ref={tableScrollRef} className="comprobante-vjs-table-container">
                      <table className="comprobante-vjs-table">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left' }}>SERVICIO</th>
                            <th style={{ textAlign: 'center', width: '120px' }}>PESO EN KG</th>
                            <th style={{ textAlign: 'center', width: '140px' }}>PRECIO POR KG (S/.)</th>
                            <th style={{ textAlign: 'center', width: '120px' }}>TOTAL (S/.)</th>
                            <th style={{ textAlign: 'center', width: '50px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {createForm.detalles.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '36px 14px', color: '#94a3b8', fontStyle: 'italic' }}>
                                No hay servicios agregados. Seleccione un servicio arriba y haga clic en AÑADIR.
                              </td>
                            </tr>
                          ) : (
                            createForm.detalles.map((det, idx) => {
                              const rowTotal = Number(det.peso_kg || 0) * Number(det.costo_kilo || 0);
                              return (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600, color: '#1e293b' }}>
                                    {det.servicio_name || det.selectedOption?.label || `Servicio #${det.servicio_id}`}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      className="form-input"
                                      value={det.peso_kg}
                                      onChange={(e) => {
                                        const newD = [...createForm.detalles];
                                        newD[idx].peso_kg = e.target.value;
                                        setCreateForm(prev => {
                                          let newM = prev.monto_abonado;
                                          if (prev.estado_comprobante_id === '4') {
                                            let s = 0;
                                            newD.forEach(d => { s += Number(d.peso_kg || 0) * Number(d.costo_kilo || 0); });
                                            newM = Math.max(0, s - Number(prev.descuento || 0)).toFixed(2);
                                          }
                                          return { ...prev, detalles: newD, monto_abonado: newM };
                                        });
                                      }}
                                      style={{ width: '5.5rem', textAlign: 'center', padding: '6px 8px', margin: '0 auto' }}
                                      required
                                    />
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="form-input"
                                      value={det.costo_kilo}
                                      onChange={(e) => {
                                        const newD = [...createForm.detalles];
                                        newD[idx].costo_kilo = e.target.value;
                                        setCreateForm(prev => {
                                          let newM = prev.monto_abonado;
                                          if (prev.estado_comprobante_id === '4') {
                                            let s = 0;
                                            newD.forEach(d => { s += Number(d.peso_kg || 0) * Number(d.costo_kilo || 0); });
                                            newM = Math.max(0, s - Number(prev.descuento || 0)).toFixed(2);
                                          }
                                          return { ...prev, detalles: newD, monto_abonado: newM };
                                        });
                                      }}
                                      style={{ width: '5.5rem', textAlign: 'center', padding: '6px 8px', margin: '0 auto' }}
                                      required
                                    />
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                                    S/. {rowTotal.toFixed(2)}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDetalle(idx)}
                                      style={{
                                        background: '#dc3545',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      title="Eliminar fila"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: Creación, Resumen Económico, Descuento, Abono y Registrar */}
                  <div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                      {/* Creación */}
                      <div style={{ marginBottom: '18px' }}>
                        <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                          CREACIÓN:
                        </h5>
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={fechaOperacionCreate}
                          onChange={(e) => setFechaOperacionCreate(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', fontSize: '0.9rem', backgroundColor: '#ffffff' }}
                          required
                        />
                      </div>

                      {/* Operaciones Gravadas e IGV */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', margin: 0 }}>OP. GRAVADAS:</h5>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>S/. {opGravadas.toFixed(2)}</h5>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', margin: 0 }}>IGV 18%:</h5>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>S/. {igvCalculado.toFixed(2)}</h5>
                      </div>

                      {/* Total a Pagar Prominente */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderTop: '2px dashed #cbd5e1', paddingTop: '12px' }}>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>TOTAL A PAGAR:</h4>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>S/. {totalFinal.toFixed(2)}</h3>
                      </div>

                      {/* Descuento */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          DESCUENTO (S/):
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          className="form-input"
                          value={createForm.descuento}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCreateForm(prev => {
                              const desc = Number(val || 0);
                              const sub = calculateSubtotalRaw();
                              const newTot = Math.max(0, sub - desc);
                              return {
                                ...prev,
                                descuento: val,
                                monto_abonado: prev.estado_comprobante_id === '4' ? newTot.toFixed(2) : prev.monto_abonado
                              };
                            });
                          }}
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem', backgroundColor: '#ffffff' }}
                        />
                      </div>

                      {/* Monto Abonado */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
                          MONTO ABONADO:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input"
                          value={createForm.estado_comprobante_id === '4' ? totalFinal.toFixed(2) : createForm.estado_comprobante_id === '1' ? '0.00' : createForm.monto_abonado}
                          disabled={createForm.estado_comprobante_id !== '2'}
                          onChange={(e) => setCreateForm({ ...createForm, monto_abonado: e.target.value })}
                          placeholder={createForm.estado_comprobante_id === '4' ? totalFinal.toFixed(2) : '0.00'}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            backgroundColor: createForm.estado_comprobante_id === '2' ? '#ffffff' : '#f1f5f9',
                            color: '#0f172a'
                          }}
                          required={createForm.estado_comprobante_id === '2'}
                        />
                      </div>

                      {/* Observaciones */}
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                          OBSERVACIONES:
                        </label>
                        <textarea
                          rows={3}
                          className="form-input"
                          value={createForm.observaciones}
                          onChange={(e) => setCreateForm({ ...createForm, observaciones: e.target.value.toUpperCase() })}
                          placeholder="OBSERVACIONES O NOTAS..."
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', resize: 'vertical', backgroundColor: '#ffffff' }}
                        />
                      </div>

                      {/* Botón REGISTRAR Verde */}
                      <button
                        type="submit"
                        style={{
                          width: '100%',
                          padding: '14px',
                          fontSize: '1.15rem',
                          fontWeight: 900,
                          backgroundColor: '#198754',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          letterSpacing: '0.04em',
                          boxShadow: '0 4px 14px rgba(25, 135, 84, 0.3)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        REGISTRAR
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal Rápido Añadir Nuevo Cliente */}
      {showQuickClienteModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', color: '#0f172a' }}>
                AÑADIR NUEVO CLIENTE
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowQuickClienteModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuickClienteSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">Nombres / Razón Social *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Nombres completos o razón social"
                    value={quickClienteForm.nombres}
                    onChange={(e) => setQuickClienteForm({ ...quickClienteForm, nombres: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="form-label">DNI / RUC</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="8 u 11 dígitos"
                    value={quickClienteForm.dni}
                    onChange={(e) => setQuickClienteForm({ ...quickClienteForm, dni: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Teléfono (WhatsApp)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="9 dígitos"
                    value={quickClienteForm.telefono}
                    onChange={(e) => setQuickClienteForm({ ...quickClienteForm, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Dirección (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Dirección..."
                    value={quickClienteForm.direccion}
                    onChange={(e) => setQuickClienteForm({ ...quickClienteForm, direccion: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowQuickClienteModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd', fontWeight: 700 }}
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal Abono */}
      {showAbonoModal && selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Registrar Abono a {selectedTicket.cod_comprobante}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAbonoModal(false)}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Monto pendiente por cobrar: <b style={{ color: '#dc2626' }}>S/ {Number(selectedTicket.monto_restante).toFixed(2)}</b>
            </p>

            <form onSubmit={handleAbonoSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Monto a Abonar (S/) *</label>
                <input
                  type="number"
                  step="0.10"
                  min="0.10"
                  className="form-input"
                  required
                  autoFocus
                  max={selectedTicket.monto_restante}
                  value={abonoAmount}
                  onChange={(e) => setAbonoAmount(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Método de Pago *</label>
                <select
                  className="form-select"
                  required
                  value={abonoMetodoPago}
                  onChange={(e) => setAbonoMetodoPago(e.target.value)}
                >
                  {catalogos.metodos_pago.map((mp: any) => (
                    <option key={mp.id} value={mp.id}>{mp.nom_metodo_pago}</option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5' }}>
                    <Calendar size={14} /> Fecha de Operación (Admin)
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={fechaOperacionAbono}
                    onChange={(e) => setFechaOperacionAbono(e.target.value)}
                  />
                </div>
              )}

              <div className="modal-actions-responsive" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAbonoModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ fontWeight: 700 }}>
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal PDF Preview & Print */}
      {showPrintModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div
            className="modal-content pdf-preview-modal"
            style={{
              maxWidth: '560px',
              width: '95%',
              height: '95dvh',
              maxHeight: '96dvh',
              padding: '0',
              overflow: 'hidden',
              borderRadius: '14px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary, #f8fafc)',
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
                    {selectedTicket.cod_comprobante || `Ticket #${selectedTicket.id}`}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                    {selectedTicket.cliente?.nombres || 'Cliente'} • {new Date(selectedTicket.fecha).toLocaleDateString('es-PE')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
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
                    onClick={() => handleOpenPrintModal(selectedTicket)}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {printPdfUrl && !printPdfLoading && (
                <iframe
                  ref={pdfIframeRef}
                  src={`${printPdfUrl}#view=FitH&toolbar=0&navpanes=0`}
                  title={`Comprobante ${selectedTicket.cod_comprobante}`}
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
                onClick={() => setShowPrintModal(false)}
              >
                Cerrar
              </button>

              <div className="pdf-modal-actions">
                {printPdfUrl && (
                  <a
                    href={printPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`${selectedTicket.cod_comprobante}.pdf`}
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
                    }}
                  >
                    <Download size={15} /> Descargar PDF
                  </a>
                )}
                <button
                  type="button"
                  className="btn-primary pdf-btn-print"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={handlePrintPdfDocument}
                  disabled={printPdfLoading || !printPdfUrl}
                >
                  <Printer size={16} /> Imprimir Comprobante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enviar por WhatsApp */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        ticket={whatsAppTicket}
        actionType={whatsAppActionType}
      />
    </div>
  );
};

