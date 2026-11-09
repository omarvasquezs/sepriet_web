import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Plus, Printer, DollarSign, Trash2, ChevronLeft, ChevronRight, MessageSquare, Calendar, X, Filter, Ban, RotateCcw } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AsyncSelect2, type SelectOption } from '../components/AsyncSelect2';
import { sendWhatsAppBotNotification } from '../services/whatsappBotService';
import { MultiSelectFilterDropdown, type FilterOption } from '../components/MultiSelectFilterDropdown';

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
  onResetTriggerCreateTicket?: () => void;
}

export const ComprobantesPage: React.FC<ComprobantesPageProps> = ({
  filterPreset,
  triggerCreateTicket,
  onClearFilterPreset,
  onResetTriggerCreateTicket,
}) => {
  const { user } = useAuth();
  const isAdmin = (user?.role_id === 1) || Boolean(user?.role && user.role.toLowerCase().includes('admin'));

  const [comprobantesData, setComprobantesData] = useState<any>({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [catalogos, setCatalogos] = useState<any>({ estados_pago: [], estados_ropa: [], metodos_pago: [] });

  const [search, setSearch] = useState('');
  const [selectedPagoIds, setSelectedPagoIds] = useState<number[]>([]);
  const [selectedRopaIds, setSelectedRopaIds] = useState<number[]>([]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [fechaHoyDia, setFechaHoyDia] = useState(false);
  const [dateStats, setDateStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showCheckboxesPanel, setShowCheckboxesPanel] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);


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
  const initialQuickClienteForm = {
    nombres: '',
    dni: '',
    codigo_pais: '+51',
    telefono: '',
    email: '',
    direccion: ''
  };
  const [quickClienteForm, setQuickClienteForm] = useState(initialQuickClienteForm);

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


  const getTodayDateStr = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const fetchDateStats = async (d1?: string, d2?: string) => {
    const from = d1 !== undefined ? d1 : fechaDesde;
    const to = d2 !== undefined ? d2 : fechaHasta;
    if (!from && !to) {
      setDateStats(null);
      return;
    }
    setLoadingStats(true);
    try {
      const res = await api.get('/comprobantes/estadisticas-fecha', {
        params: {
          fecha_desde: from || undefined,
          fecha_hasta: to || undefined,
        }
      });
      if (res.data?.success) {
        setDateStats(res.data);
      } else {
        setDateStats(null);
      }
    } catch (err) {
      console.error('Error fetching date stats:', err);
      setDateStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleToggleFechaHoy = (checked: boolean) => {
    setFechaHoyDia(checked);
    if (checked) {
      const today = getTodayDateStr();
      setFechaDesde(today);
      setFechaHasta(today);
    } else {
      setFechaDesde('');
      setFechaHasta('');
    }
    setPage(1);
  };

  const handleFechaDesdeChange = (val: string) => {
    setFechaDesde(val);
    const today = getTodayDateStr();
    if (fechaHoyDia && (val !== today || fechaHasta !== today)) {
      setFechaHoyDia(false);
    }
    setPage(1);
  };

  const handleFechaHastaChange = (val: string) => {
    setFechaHasta(val);
    const today = getTodayDateStr();
    if (fechaHoyDia && (fechaDesde !== today || val !== today)) {
      setFechaHoyDia(false);
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedPagoIds([]);
    setSelectedRopaIds([]);
    setFechaDesde('');
    setFechaHasta('');
    setFechaHoyDia(false);
    setDateStats(null);
    setPage(1);
    if (onClearFilterPreset) {
      onClearFilterPreset();
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { search, page };
      if (selectedPagoIds.length > 0) {
        params.estado_comprobante_id = selectedPagoIds.join(',');
      }
      if (selectedRopaIds.length > 0) {
        params.estado_ropa_id = selectedRopaIds.join(',');
      }
      if (fechaDesde) {
        params.fecha_desde = fechaDesde;
      }
      if (fechaHasta) {
        params.fecha_hasta = fechaHasta;
      }
      if (filterPreset?.id && selectedPagoIds.length === 0 && selectedRopaIds.length === 0 && !fechaDesde && !fechaHasta) {
        params.preset = filterPreset.id;
      }

      let compData = comprobantesData;
      let catData = catalogos;

      try {
        const compRes = await api.get('/comprobantes', { params });
        compData = compRes.data;
        setComprobantesData(compData);
      } catch (e) {
        console.error('Error fetching comprobantes:', e);
      }

      try {
        const catRes = await api.get('/catalogos');
        catData = catRes.data;
        setCatalogos(catData);
      } catch (e) {
        console.error('Error fetching catalogos:', e);
      }

      const validMetodos = (catData?.metodos_pago || []).filter((mp: any) => !mp.nom_metodo_pago?.includes('/') && mp.habilitado !== 0);
      if (validMetodos.length > 0) {
        setCreateForm(prev => {
          const exists = validMetodos.some((mp: any) => String(mp.id) === String(prev.metodo_pago_id));
          if (!exists) {
            const def = validMetodos.find((mp: any) => String(mp.nom_metodo_pago || '').toUpperCase().includes('EFECTIVO')) || validMetodos[0];
            return { ...prev, metodo_pago_id: String(def.id) };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sync preset selections when filterPreset changes from top navigation
  useEffect(() => {
    if (filterPreset) {
      if (filterPreset.id === 'no_cancelados') {
        setSelectedPagoIds([1, 2]); // DEBE (1), ABONO (2)
        setSelectedRopaIds([]);
      } else if (filterPreset.id === 'cancelados') {
        setSelectedPagoIds([4]); // CANCELADO (4)
        setSelectedRopaIds([]);
      } else if (filterPreset.id === 'activos') {
        setSelectedPagoIds([1, 2, 4]); // DEBE, ABONO, CANCELADO (exclude ANULADO 3)
        setSelectedRopaIds([1, 3]); // RECIBIDO (1), LISTO PARA RECOGER (3) (exclude RECOGIDO 4)
      } else if (filterPreset.id === 'recogidos_cancelados') {
        setSelectedPagoIds([4]);
        setSelectedRopaIds([4]);
      } else {
        setSelectedPagoIds([]);
        setSelectedRopaIds([]);
      }
      setSearch('');
      setPage(1);
    }
  }, [filterPreset?.timestamp]);

  // Open modal when triggerCreateTicket changes (e.g. from top menu)
  useEffect(() => {
    if (triggerCreateTicket && triggerCreateTicket > 0) {
      handleOpenCreateModal();
      if (onResetTriggerCreateTicket) {
        onResetTriggerCreateTicket();
      }
    }
  }, [triggerCreateTicket]);

  useEffect(() => {
    fetchData();
  }, [search, selectedPagoIds, selectedRopaIds, fechaDesde, fechaHasta, filterPreset?.timestamp, page]);

  useEffect(() => {
    if (fechaDesde || fechaHasta) {
      fetchDateStats(fechaDesde, fechaHasta);
    } else {
      setDateStats(null);
    }
  }, [fechaDesde, fechaHasta]);

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
    const validMetodos = (catalogos.metodos_pago || []).filter((mp: any) => !mp.nom_metodo_pago?.includes('/') && mp.habilitado !== 0);
    const defaultMetodo = validMetodos.find((mp: any) =>
      String(mp.nom_metodo_pago || '').toUpperCase().includes('EFECTIVO')
    ) || validMetodos[0];

    setCreateForm({
      ...initialCreateForm,
      metodo_pago_id: defaultMetodo ? String(defaultMetodo.id) : (initialCreateForm.metodo_pago_id || '4')
    });
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
      const res = await api.post('/clientes', quickClienteForm);
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
      setQuickClienteForm(initialQuickClienteForm);
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
      window.dispatchEvent(new CustomEvent('caja:updated'));

      setShowCreateModal(false);
      setPage(1);
      fetchData();
      if (fechaDesde || fechaHasta) {
        fetchDateStats(fechaDesde, fechaHasta);
      }

      // Automatically dispatch WhatsApp notification and PDF in background, showing 5s green top alert
      sendWhatsAppBotNotification(createdTicket, 'ticket');
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
      window.dispatchEvent(new CustomEvent('caja:updated'));

      setShowAbonoModal(false);
      setAbonoAmount('');
      fetchData();
      if (fechaDesde || fechaHasta) {
        fetchDateStats(fechaDesde, fechaHasta);
      }

      // Send WhatsApp receipt update in background with 5s green top alert
      sendWhatsAppBotNotification(updatedTicket, 'ticket');
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

      // If marked as Listo (id=3) or Entregado/Recogido (id=4), notify via WhatsApp Bot
      if (numericEstado === 3) {
        sendWhatsAppBotNotification(updated, 'listo');
      } else if (numericEstado === 4) {
        sendWhatsAppBotNotification(updated, 'recogido');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnular = async (ticket: any) => {
    if (!window.confirm(`¿Estás seguro de que deseas ANULAR el comprobante "${ticket.cod_comprobante}"?\nEsta acción revertirá los pagos registrados en caja y el comprobante pasará a estado ANULADO.`)) {
      return;
    }
    try {
      await api.put(`/comprobantes/${ticket.id}/estado`, { estado_comprobante_id: 3 });
      window.dispatchEvent(new CustomEvent('caja:updated'));
      fetchData();
      if (fechaDesde || fechaHasta) {
        fetchDateStats(fechaDesde, fechaHasta);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al anular comprobante');
    }
  };

  const handleOpenPrintModal = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowPrintModal(true);
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

  // Map catalog items to FilterOption for multi-select checkboxes
  const estadosPagoOptions: FilterOption[] = (catalogos.estados_pago || []).map((ep: any) => {
    let dotColor = '#64748b';
    const name = (ep.nom_estado || ep.nombre || '').toUpperCase();
    if (name.includes('CANCELADO')) dotColor = '#16a34a';
    else if (name.includes('ABONO')) dotColor = '#3b82f6';
    else if (name.includes('DEBE')) dotColor = '#eab308';
    else if (name.includes('ANULADO')) dotColor = '#ef4444';

    return {
      id: Number(ep.id),
      name: ep.nom_estado || ep.nombre,
      dotColor,
    };
  });

  const estadosRopaOptions: FilterOption[] = (catalogos.estados_ropa || []).map((er: any) => {
    let dotColor = '#64748b';
    const name = (er.nom_estado_ropa || er.nombre || '').toUpperCase();
    if (name.includes('RECIBIDO')) dotColor = '#3b82f6';
    else if (name.includes('LISTO')) dotColor = '#10b981';
    else if (name.includes('RECOGIDO')) dotColor = '#6b7280';

    return {
      id: Number(er.id),
      name: er.nom_estado_ropa || er.nombre,
      dotColor,
    };
  });

  return (
    <div className="page-container">
      {/* Active Filter Preset Notification from Top Menu CONSULTAR */}
      {filterPreset && selectedPagoIds.length === 0 && selectedRopaIds.length === 0 && (
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

      <div className="comprobantes-header-bar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
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

            <div className="comprobantes-filters-wrapper" style={{ display: 'flex', gap: '8px', flex: '1 1 360px', flexWrap: 'wrap' }}>
              {/* Multi-Select Dropdown: Estado de Pago */}
              <MultiSelectFilterDropdown
                labelPrefix="Pago"
                title="Estado de Pago (Comprobante)"
                options={estadosPagoOptions}
                selectedIds={selectedPagoIds}
                onChange={(ids) => {
                  setSelectedPagoIds(ids);
                  setPage(1);
                }}
              />

              {/* Multi-Select Dropdown: Estado de Ropa / Prendas */}
              <MultiSelectFilterDropdown
                labelPrefix="Prendas"
                title="Estado de Ropa (Prendas)"
                options={estadosRopaOptions}
                selectedIds={selectedRopaIds}
                onChange={(ids) => {
                  setSelectedRopaIds(ids);
                  setPage(1);
                }}
              />

              {/* Toggle Button for Java-Style Checkbox Panel */}
              <button
                type="button"
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 12px',
                  height: '42px',
                  flexShrink: 0,
                  background: showCheckboxesPanel ? '#e0e7ff' : '#ffffff',
                  borderColor: showCheckboxesPanel ? '#818cf8' : 'var(--border-color)',
                  color: showCheckboxesPanel ? '#3730a3' : '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => setShowCheckboxesPanel(prev => !prev)}
                title="Ver panel de checkboxes de filtros (Estilo Java)"
              >
                <Filter size={15} />
                <span>Panel Filtros</span>
                {(selectedPagoIds.length > 0 || selectedRopaIds.length > 0) && (
                  <span
                    style={{
                      background: '#4f46e5',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      padding: '1px 6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    {selectedPagoIds.length + selectedRopaIds.length}
                  </span>
                )}
              </button>
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

        {/* Date Range Toolbar (Desde, Hasta, FECHA HOY DÍA, Resetear) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '8px 14px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="#64748b" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Desde:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '4px 8px', fontSize: '0.82rem', width: 'auto' }}
              value={fechaDesde}
              onChange={(e) => handleFechaDesdeChange(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Hasta:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '4px 8px', fontSize: '0.82rem', width: 'auto' }}
              value={fechaHasta}
              onChange={(e) => handleFechaHastaChange(e.target.value)}
            />
          </div>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: fechaHoyDia ? '#1d4ed8' : '#475569',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '6px',
              background: fechaHoyDia ? '#eff6ff' : '#f8fafc',
              border: `1px solid ${fechaHoyDia ? '#3b82f6' : '#cbd5e1'}`,
              userSelect: 'none',
              transition: 'all 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={fechaHoyDia}
              onChange={(e) => handleToggleFechaHoy(e.target.checked)}
              style={{ width: '15px', height: '15px', accentColor: '#2563eb', cursor: 'pointer' }}
            />
            <span>FECHA HOY DÍA</span>
          </label>

          {(search || selectedPagoIds.length > 0 || selectedRopaIds.length > 0 || fechaDesde || fechaHasta || fechaHoyDia) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                color: '#dc2626',
                borderColor: '#fca5a5',
                background: '#fef2f2',
                marginLeft: 'auto',
              }}
              title="Resetear todos los filtros"
            >
              <RotateCcw size={13} />
              <span>Resetear</span>
            </button>
          )}
        </div>
      </div>

      {/* Java-Style Checkbox Filter Panel */}
      {showCheckboxesPanel && (
        <div
          className="glass-panel"
          style={{
            padding: '14px 18px',
            marginBottom: '16px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            animation: 'modalSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={17} color="#4f46e5" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                Filtros Multiselección con Checkboxes (Estilo Sistema Java)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={handleResetFilters}
              >
                Resetear Filtros
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Columna Estado Ropa */}
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Estado Ropa:</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b' }}>
                  {selectedRopaIds.length === 0 ? 'Todos' : `${selectedRopaIds.length} seleccionados`}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                {estadosRopaOptions.map((er) => {
                  const isChecked = selectedRopaIds.includes(er.id);
                  return (
                    <label
                      key={er.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        background: isChecked ? '#dcfce7' : 'transparent',
                        fontWeight: isChecked ? 700 : 500,
                        fontSize: '0.84rem',
                        color: isChecked ? '#14532d' : '#475569',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedRopaIds(selectedRopaIds.filter(id => id !== er.id));
                          } else {
                            setSelectedRopaIds([...selectedRopaIds, er.id]);
                          }
                          setPage(1);
                        }}
                        style={{ width: '16px', height: '16px', accentColor: '#16a34a', cursor: 'pointer' }}
                      />
                      {er.dotColor && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: er.dotColor }} />}
                      <span>{er.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Columna Estado Comprobante (Pago) */}
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Estado Comprobante:</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b' }}>
                  {selectedPagoIds.length === 0 ? 'Todos' : `${selectedPagoIds.length} seleccionados`}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                {estadosPagoOptions.map((ep) => {
                  const isChecked = selectedPagoIds.includes(ep.id);
                  return (
                    <label
                      key={ep.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        background: isChecked ? '#dcfce7' : 'transparent',
                        fontWeight: isChecked ? 700 : 500,
                        fontSize: '0.84rem',
                        color: isChecked ? '#14532d' : '#475569',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedPagoIds(selectedPagoIds.filter(id => id !== ep.id));
                          } else {
                            setSelectedPagoIds([...selectedPagoIds, ep.id]);
                          }
                          setPage(1);
                        }}
                        style={{ width: '16px', height: '16px', accentColor: '#16a34a', cursor: 'pointer' }}
                      />
                      {ep.dotColor && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ep.dotColor }} />}
                      <span>{ep.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Statistics Panel (matching Java frmConsultarComprobantes updateDateStats) */}
      {dateStats && (
        <div
          className="glass-panel"
          style={{
            padding: '12px 18px',
            marginBottom: '16px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            fontSize: '0.86rem',
            lineHeight: '1.65',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          }}
        >
          {loadingStats ? (
            <div style={{ color: '#64748b', fontSize: '0.84rem' }}>Actualizando estadísticas...</div>
          ) : (
            <>
              <div style={{ color: '#006400', fontWeight: 600 }}>
                Comprobantes generados {dateStats.fechaStr}: {dateStats.cantidad}
              </div>
              <div style={{ color: '#000096', fontWeight: 600 }}>
                Total abonado en los comprobantes {dateStats.fechaStr}: S/. {Number(dateStats.totalAbonos).toFixed(2)}
              </div>
              <div style={{ color: '#960000', fontWeight: 600 }}>
                Total abonado {dateStats.fechaStr}: S/. {Number(dateStats.totalIngresos).toFixed(2)}
              </div>
              <div style={{ color: '#643200', fontWeight: 600 }}>
                Suma del costo total de los comprobantes {dateStats.fechaStr}: S/. {Number(dateStats.sumaCostoTotal).toFixed(2)}
              </div>
              <div style={{ color: '#008000', fontWeight: 600 }}>
                Total abonado en efectivo {dateStats.fechaStr}: S/. {Number(dateStats.totalEfectivo).toFixed(2)}
              </div>
              <div style={{ color: '#800080', fontWeight: 600 }}>
                Total abonado en YAPE/PLIN {dateStats.fechaStr}: S/. {Number(dateStats.totalYapePlin).toFixed(2)}
              </div>
              <div style={{ color: '#228b22', fontWeight: 600 }}>
                Total abonado en efectivo en los comprobantes generados {dateStats.fechaStr}: S/. {Number(dateStats.compEfectivo).toFixed(2)}
              </div>
              <div style={{ color: '#9400d3', fontWeight: 600 }}>
                Total abonado en YAPE/PLIN en los comprobantes generados {dateStats.fechaStr}: S/. {Number(dateStats.compYapePlin).toFixed(2)}
              </div>
              {dateStats.cajaApertura && (
                <div style={{ color: '#0066cc', fontWeight: 600 }}>
                  {dateStats.cajaApertura}
                </div>
              )}
              {dateStats.cajaCierre && (
                <div style={{ color: '#cc6600', fontWeight: 600 }}>
                  {dateStats.cajaCierre}
                </div>
              )}
              {Number(dateStats.deudaTotal) > 0 && (
                <div style={{ color: '#b40000', fontWeight: 700, marginTop: '2px', fontSize: '0.9rem' }}>
                  DEUDA TOTAL: S/. {Number(dateStats.deudaTotal).toFixed(2)}
                </div>
              )}
            </>
          )}
        </div>
      )}

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
                    <th style={{ whiteSpace: 'nowrap', minWidth: '95px' }}>Código</th>
                    <th style={{ minWidth: '160px' }}>Cliente</th>
                    <th style={{ whiteSpace: 'nowrap', minWidth: '95px' }}>Fecha</th>
                    <th style={{ whiteSpace: 'nowrap', minWidth: '105px' }}>Estado Pago</th>
                    <th style={{ whiteSpace: 'nowrap', minWidth: '130px' }}>Estado Ropa</th>
                    <th style={{ whiteSpace: 'nowrap', minWidth: '105px' }}>Total</th>
                    <th style={{ whiteSpace: 'nowrap', minWidth: '105px' }}>Abonado</th>
                    <th style={{ whiteSpace: 'nowrap', minWidth: '105px' }}>Restante</th>
                    <th style={{ whiteSpace: 'nowrap', minWidth: '220px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comprobantesData.data.map((t: any) => (
                    <tr key={t.id} className="row-item">
                      <td style={{ fontWeight: 700, color: '#4f46e5', whiteSpace: 'nowrap' }}>{t.cod_comprobante || `N° ${t.id}`}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{t.cliente?.nombres || 'Cliente Genérico'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(t.fecha).toLocaleDateString('es-PE')}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`badge ${getBadgeClassPago(t.estado_comprobante?.nom_estado || t.estado_comprobante?.nombre)}`}>
                          {t.estado_comprobante?.nom_estado || t.estado_comprobante?.nombre || 'DEBE'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
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
                      <td style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>S/ {Number(t.costo_total).toFixed(2)}</td>
                      <td style={{ color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>S/ {Number(t.monto_abonado).toFixed(2)}</td>
                      <td style={{ color: Number(t.monto_restante) > 0 ? '#dc2626' : '#059669', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        S/ {Number(t.monto_restante).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap', minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}>
                          {Number(t.monto_restante) > 0 && (
                            <button
                              className="btn-secondary"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#059669',
                                borderColor: '#a7f3d0',
                                background: '#ecfdf5',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                minHeight: '34px',
                                flex: '0 0 auto',
                              }}
                              title="Registrar Abono"
                              onClick={() => {
                                setSelectedTicket(t);
                                setFechaOperacionAbono(toDateTimeLocal());
                                setAbonoMetodoPago('4');
                                setShowAbonoModal(true);
                              }}
                            >
                              <DollarSign size={15} color="#059669" /> Abono
                            </button>
                          )}
                          <button
                            className="btn-primary"
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              minHeight: '34px',
                              width: Number(t.monto_restante) > 0 ? 'auto' : '100%',
                              flex: 1,
                            }}
                            title="Ver Comprobante, Imprimir, Descargar o Enviar por WhatsApp"
                            onClick={() => handleOpenPrintModal(t)}
                          >
                            <Printer size={15} /> Ver / Imprimir
                          </button>
                          <button
                            type="button"
                            style={{
                              padding: '6px 9px',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              minHeight: '34px',
                              background: '#25D366',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              flex: '0 0 auto',
                            }}
                            title="Enviar notificación por WhatsApp (Bot)"
                            onClick={() => {
                              const action = Number(t.estado_ropa_id) === 3 ? 'listo' : (Number(t.estado_ropa_id) === 4 ? 'recogido' : 'ticket');
                              sendWhatsAppBotNotification(t, action);
                            }}
                          >
                            <MessageSquare size={14} /> WhatsApp
                          </button>
                          {t.estado_comprobante_id !== 3 && (
                            <button
                              className="btn-secondary"
                              style={{
                                padding: '6px 8px',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: '#dc2626',
                                borderColor: '#fecaca',
                                background: '#fef2f2',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                minHeight: '34px',
                                flex: '0 0 auto',
                              }}
                              title="Anular comprobante"
                              onClick={() => handleAnular(t)}
                            >
                              <Ban size={15} color="#dc2626" />
                            </button>
                          )}
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

                  <div className="mobile-ticket-actions" style={{ display: 'flex', gap: '8px' }}>
                    {Number(t.monto_restante) > 0 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#059669',
                          borderColor: '#a7f3d0',
                          background: '#ecfdf5',
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          minHeight: '40px',
                        }}
                        title="Registrar Abono"
                        onClick={() => {
                          setSelectedTicket(t);
                          setFechaOperacionAbono(toDateTimeLocal());
                          setAbonoMetodoPago('4');
                          setShowAbonoModal(true);
                        }}
                      >
                        <DollarSign size={16} color="#059669" /> Abono
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary"
                      style={{
                        padding: '10px 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        flex: 1,
                        minHeight: '40px',
                      }}
                      title="Ver Comprobante, Imprimir, Descargar o Enviar por WhatsApp"
                      onClick={() => handleOpenPrintModal(t)}
                    >
                      <Printer size={16} /> Ver / Imprimir
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '10px 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: '#25D366',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        minHeight: '40px',
                        flex: '0 0 auto',
                      }}
                      title="Enviar notificación por WhatsApp (Bot)"
                      onClick={() => {
                        const action = Number(t.estado_ropa_id) === 3 ? 'listo' : (Number(t.estado_ropa_id) === 4 ? 'recogido' : 'ticket');
                        sendWhatsAppBotNotification(t, action);
                      }}
                    >
                      <MessageSquare size={16} /> WhatsApp
                    </button>
                    {t.estado_comprobante_id !== 3 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{
                          padding: '10px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#dc2626',
                          borderColor: '#fecaca',
                          background: '#fef2f2',
                          minHeight: '40px',
                          flex: '0 0 auto',
                        }}
                        title="Anular comprobante"
                        onClick={() => handleAnular(t)}
                      >
                        <Ban size={16} color="#dc2626" /> Anular
                      </button>
                    )}
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
                          onClick={() => {
                            setQuickClienteForm(initialQuickClienteForm);
                            setShowQuickClienteModal(true);
                          }}
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
                        {(!catalogos.metodos_pago || catalogos.metodos_pago.length === 0) ? (
                          <option value="">Cargando métodos de pago...</option>
                        ) : (
                          catalogos.metodos_pago
                            .filter((mp: any) => !mp.nom_metodo_pago?.includes('/') && mp.habilitado !== 0)
                            .map((mp: any) => (
                              <option key={mp.id} value={mp.id}>
                                {String(mp.nom_metodo_pago || '').toUpperCase()}
                              </option>
                            ))
                        )}
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

      {/* MODAL HOMOLOGADO: REGISTRAR NUEVO CLIENTE (Rápido desde Comprobante) */}
      {showQuickClienteModal && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 100050,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowQuickClienteModal(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '580px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Registrar Nuevo Cliente
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowQuickClienteModal(false)}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickClienteSubmit}>
              <div className="form-group">
                <label className="form-label">Nombres y Apellidos *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={quickClienteForm.nombres}
                  onChange={(e) => setQuickClienteForm({ ...quickClienteForm, nombres: e.target.value.toUpperCase() })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">DNI / Documento</label>
                  <input
                    type="text"
                    className="form-input"
                    value={quickClienteForm.dni}
                    onChange={(e) => setQuickClienteForm({ ...quickClienteForm, dni: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Código País</label>
                  <select
                    className="form-select"
                    value={quickClienteForm.codigo_pais}
                    onChange={(e) => setQuickClienteForm({ ...quickClienteForm, codigo_pais: e.target.value })}
                  >
                    <option value="+51">+51 (Perú)</option>
                    <option value="+54">+54 (Argentina)</option>
                    <option value="+56">+56 (Chile)</option>
                    <option value="+57">+57 (Colombia)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="text"
                    className="form-input"
                    value={quickClienteForm.telefono}
                    onChange={(e) => setQuickClienteForm({ ...quickClienteForm, telefono: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={quickClienteForm.email}
                    onChange={(e) => setQuickClienteForm({ ...quickClienteForm, email: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-input"
                  value={quickClienteForm.direccion}
                  onChange={(e) => setQuickClienteForm({ ...quickClienteForm, direccion: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="modal-actions-responsive" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowQuickClienteModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Cliente
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
                  {catalogos.metodos_pago
                    .filter((mp: any) => !mp.nom_metodo_pago?.includes('/') && mp.habilitado !== 0)
                    .map((mp: any) => (
                      <option key={mp.id} value={mp.id}>
                        {String(mp.nom_metodo_pago || '').toUpperCase()}
                      </option>
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

      {/* Modal Vista Previa / Impresión de Comprobante */}
      <PrintPreviewModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        ticket={selectedTicket}
        onOpenWhatsApp={(ticket, actionType) => {
          setShowPrintModal(false);
          sendWhatsAppBotNotification(ticket, actionType || 'ticket');
        }}
      />
    </div>
  );
};

