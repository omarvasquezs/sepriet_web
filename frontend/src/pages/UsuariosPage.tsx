import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, User as UserIcon, CheckCircle2, XCircle, KeyRound, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export interface UsuariosPageProps {
  initialTab?: 'usuarios' | 'roles';
}

interface PermissionItem {
  id: string;
  name: string;
  desc: string;
}

interface PermissionGroup {
  module: string;
  title: string;
  iconColor: string;
  items: PermissionItem[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: 'comprobantes',
    title: 'Comprobantes y Ventas',
    iconColor: '#4f46e5',
    items: [
      { id: 'dashboard', name: 'Panel Principal (Dashboard)', desc: 'Visualizar métricas clave, estadísticas y tickets recientes' },
      { id: 'comprobantes_crear', name: 'Registrar Nuevo Comprobante', desc: 'Emitir comprobantes (Boletas, Facturas, Notas de Venta)' },
      { id: 'comprobantes_consultar', name: 'Consultar e Imprimir', desc: 'Filtrar listado, ver comprobante, imprimir ticket térmico y enviar WhatsApp' },
      { id: 'comprobantes_abono', name: 'Registrar Abonos y Cobros', desc: 'Cobrar saldos pendientes de tickets emitidos' },
      { id: 'comprobantes_anular', name: 'Anular Comprobantes', desc: 'Cancelar tickets y revertir movimientos de cobro en caja' },
    ]
  },
  {
    module: 'clientes',
    title: 'Clientes',
    iconColor: '#0284c7',
    items: [
      { id: 'clientes', name: 'Gestión de Clientes', desc: 'Registrar, consultar y modificar clientes en el directorio' },
    ]
  },
  {
    module: 'servicios',
    title: 'Servicios y Tarifas',
    iconColor: '#10b981',
    items: [
      { id: 'servicios', name: 'Tarifario de Servicios', desc: 'Crear, editar precios y habilitar servicios por kilo/prenda' },
    ]
  },
  {
    module: 'caja',
    title: 'Caja Chica y Turnos',
    iconColor: '#059669',
    items: [
      { id: 'caja_apertura', name: 'Apertura de Caja', desc: 'Iniciar turno con monto inicial en efectivo' },
      { id: 'caja_cierre', name: 'Cierre de Caja y Arqueo', desc: 'Finalizar turno con cuadre físico, teórico y live indicators' },
      { id: 'caja_egresos', name: 'Registrar Gastos / Egresos', desc: 'Registrar salidas de dinero en efectivo o transferencias' },
      { id: 'caja_historial', name: 'Historial de Cajas', desc: 'Consultar turnos de cajas cerradas en fechas anteriores' },
    ]
  },
  {
    module: 'reportes',
    title: 'Reportes',
    iconColor: '#8b5cf6',
    items: [
      { id: 'reportes', name: 'Reportes Financieros y de Trabajo', desc: 'Ver balances de ingresos, egresos, ganancia neta y volumen de prendas' },
    ]
  },
  {
    module: 'sistemas',
    title: 'Sistemas y Seguridad',
    iconColor: '#d97706',
    items: [
      { id: 'sistemas', name: 'Gestión de Usuarios y Perfiles', desc: 'Crear usuarios, configurar roles y asignar permisos en el sistema' },
    ]
  },
];

const ALL_PERMISSION_IDS = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.id));

const ROLE_PRESETS: Record<string, string[]> = {
  'ATENCION AL CLIENTE': [
    'dashboard',
    'comprobantes_crear',
    'comprobantes_consultar',
    'comprobantes_abono',
    'clientes',
    'caja_apertura',
    'caja_egresos'
  ],
  'SUPERVISOR': [
    'dashboard',
    'comprobantes_crear',
    'comprobantes_consultar',
    'comprobantes_abono',
    'comprobantes_anular',
    'clientes',
    'servicios',
    'caja_apertura',
    'caja_cierre',
    'caja_egresos',
    'caja_historial',
    'reportes'
  ],
  'ADMINISTRADOR': ALL_PERMISSION_IDS,
};

export const UsuariosPage: React.FC<UsuariosPageProps> = ({ initialTab = 'usuarios' }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'roles'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // --- State Usuarios ---
  const [usersData, setUsersData] = useState<any>({ data: [], current_page: 1, last_page: 1, total: 0 });
  const [searchUsers, setSearchUsers] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [pageUsers, setPageUsers] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role_id: '',
    habilitado: true,
  });

  // --- State Roles ---
  const [roles, setRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [roleForm, setRoleForm] = useState<{
    nombre: string;
    habilitado: boolean;
    permisos: string[];
  }>({
    nombre: '',
    habilitado: true,
    permisos: [],
  });

  // --- Fetch Data ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/users', {
        params: {
          search: searchUsers,
          role_id: selectedRoleFilter || undefined,
          page: pageUsers,
          per_page: 15,
        },
      });
      setUsersData(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchUsers, selectedRoleFilter, pageUsers]);

  useEffect(() => {
    fetchRoles();
  }, []);

  // --- Handlers Usuarios ---
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserForm({
      name: '',
      username: '',
      email: '',
      password: '',
      role_id: roles.length > 0 ? String(roles[0].id) : '',
      habilitado: true,
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: any) => {
    setEditingUserId(u.id);
    setUserForm({
      name: u.name || '',
      username: u.username || '',
      email: u.email || '',
      password: '', // blank by default (only filled if changing password)
      role_id: u.role_id ? String(u.role_id) : '',
      habilitado: Boolean(u.habilitado),
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (u: any) => {
    if (currentUser?.id === u.id) {
      alert('No puedes eliminar tu propia cuenta de usuario.');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${u.name || u.username}"?`)) {
      return;
    }

    try {
      await api.delete(`/users/${u.id}`);
      fetchUsers();
      fetchRoles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: userForm.name,
        username: userForm.username,
        email: userForm.email.trim() ? userForm.email.trim() : null,
        role_id: Number(userForm.role_id),
        habilitado: userForm.habilitado,
      };

      if (editingUserId) {
        if (userForm.password.trim()) {
          payload.password = userForm.password;
        }
        await api.put(`/users/${editingUserId}`, payload);
      } else {
        payload.password = userForm.password;
        await api.post('/users', payload);
      }

      setShowUserModal(false);
      fetchUsers();
      fetchRoles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al procesar usuario');
    }
  };

  // --- Handlers Roles ---
  const handleOpenCreateRole = () => {
    setEditingRoleId(null);
    setRoleForm({
      nombre: '',
      habilitado: true,
      permisos: [...ROLE_PRESETS['ATENCION AL CLIENTE']],
    });
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (r: any) => {
    setEditingRoleId(r.id);
    let permisosList: string[] = [];
    if (Array.isArray(r.permisos)) {
      permisosList = r.permisos;
    } else if (typeof r.permisos === 'string') {
      try {
        permisosList = JSON.parse(r.permisos);
      } catch {}
    } else if (!r.permisos) {
      const upper = (r.nombre || r.nom_rol || r.role_name || '').toUpperCase();
      if (upper.includes('ADMIN')) permisosList = ROLE_PRESETS['ADMINISTRADOR'];
      else if (upper.includes('SUPERVISOR')) permisosList = ROLE_PRESETS['SUPERVISOR'];
      else permisosList = ROLE_PRESETS['ATENCION AL CLIENTE'];
    }

    setRoleForm({
      nombre: r.nombre || r.nom_rol || r.role_name || '',
      habilitado: r.habilitado !== false,
      permisos: permisosList,
    });
    setShowRoleModal(true);
  };

  const handleTogglePermiso = (permId: string) => {
    setRoleForm(prev => {
      const exists = prev.permisos.includes(permId);
      const updated = exists
        ? prev.permisos.filter(p => p !== permId)
        : [...prev.permisos, permId];
      return { ...prev, permisos: updated };
    });
  };

  const handleApplyPreset = (presetName: string) => {
    const list = ROLE_PRESETS[presetName] || [];
    setRoleForm(prev => ({
      ...prev,
      nombre: prev.nombre || presetName,
      permisos: [...list]
    }));
  };

  const handleSelectAllPermisos = () => {
    setRoleForm(prev => ({ ...prev, permisos: [...ALL_PERMISSION_IDS] }));
  };

  const handleClearAllPermisos = () => {
    setRoleForm(prev => ({ ...prev, permisos: [] }));
  };

  const handleDeleteRole = async (r: any) => {
    if (r.users_count > 0) {
      alert(`No se puede eliminar el rol "${r.nombre || r.nom_rol || r.role_name}" porque tiene ${r.users_count} usuario(s) asignado(s).`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar el rol "${r.nombre || r.nom_rol || r.role_name}"?`)) {
      return;
    }

    try {
      await api.delete(`/roles/${r.id}`);
      fetchRoles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar rol');
    }
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: roleForm.nombre,
        habilitado: roleForm.habilitado,
        permisos: roleForm.permisos,
      };

      if (editingRoleId) {
        await api.put(`/roles/${editingRoleId}`, payload);
      } else {
        await api.post('/roles', payload);
      }
      setShowRoleModal(false);
      fetchRoles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar rol');
    }
  };

  const getRoleBadgeStyle = (roleName: string) => {
    const upper = (roleName || '').toUpperCase();
    if (upper.includes('ADMIN')) {
      return { background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' };
    }
    if (upper.includes('SUPERVISOR')) {
      return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
    }
    if (upper.includes('ATENCION') || upper.includes('CLIENTE') || upper.includes('ASISTENTE')) {
      return { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' };
    }
    return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
  };

  return (
    <div className="page-container">
      {/* Header and Tab Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Gestión de Usuarios y Roles</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Control de acceso, cuentas del personal y roles del sistema
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('usuarios')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeTab === 'usuarios' ? '#fff' : 'transparent',
              color: activeTab === 'usuarios' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'usuarios' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <UserIcon size={16} /> Usuarios ({usersData.total || 0})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeTab === 'roles' ? '#fff' : 'transparent',
              color: activeTab === 'roles' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'roles' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Shield size={16} /> Roles ({roles.length})
          </button>
        </div>
      </div>

      {/* TAB 1: USUARIOS */}
      {activeTab === 'usuarios' && (
        <div>
          {/* Filters & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: '1 1 300px' }}>
              <div style={{ position: 'relative', width: 'min(320px, 100%)', flex: '1 1 220px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '42px' }}
                  placeholder="Buscar por nombre, usuario o email..."
                  value={searchUsers}
                  onChange={(e) => { setSearchUsers(e.target.value.toUpperCase()); setPageUsers(1); }}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'min(180px, 100%)', flex: '1 1 140px' }}
                value={selectedRoleFilter}
                onChange={(e) => { setSelectedRoleFilter(e.target.value); setPageUsers(1); }}
              >
                <option value="">Todos los Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre || r.nom_rol || r.role_name}</option>
                ))}
              </select>
            </div>

            <button className="btn-primary" onClick={handleOpenCreateUser}>
              <Plus size={18} />
              Nuevo Usuario
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            {loadingUsers ? (
              <LoadingSpinner text="Cargando usuarios del sistema..." />
            ) : usersData.data.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No se encontraron usuarios.</p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th style={{ textAlign: 'center' }}>Estado</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.data.map((u: any) => {
                      const roleName = u.role?.nombre || u.role?.nom_rol || u.role?.role_name || 'Sin Rol';
                      const badgeStyle = getRoleBadgeStyle(roleName);
                      const isSelf = currentUser?.id === u.id;

                      return (
                        <tr key={u.id} className="row-item">
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                  flexShrink: 0,
                                }}
                              >
                                {(u.name || u.username || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {u.name || u.username}
                                  {isSelf && (
                                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px' }}>
                                      Tú
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>@{u.username}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: '#475569' }}>{u.email || '-'}</td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                ...badgeStyle,
                              }}
                            >
                              <Shield size={12} /> {roleName}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {u.habilitado ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
                                <CheckCircle2 size={14} /> Activo
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>
                                <XCircle size={14} /> Inactivo
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                              <button
                                className="btn-secondary"
                                style={{ padding: '4px 8px', color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
                                title="Editar Usuario / Contraseña"
                                onClick={() => handleOpenEditUser(u)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="btn-secondary"
                                disabled={isSelf}
                                style={{
                                  padding: '4px 8px',
                                  color: isSelf ? '#94a3b8' : '#ef4444',
                                  borderColor: isSelf ? '#e2e8f0' : '#fecaca',
                                  background: isSelf ? '#f8fafc' : '#fef2f2',
                                  cursor: isSelf ? 'not-allowed' : 'pointer',
                                }}
                                title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar Usuario'}
                                onClick={() => !isSelf && handleDeleteUser(u)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Página {usersData.current_page} de {usersData.last_page} ({usersData.total} usuarios registrados)
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-secondary"
                      disabled={pageUsers <= 1}
                      onClick={() => setPageUsers(prev => Math.max(1, prev - 1))}
                      style={{ opacity: pageUsers <= 1 ? 0.5 : 1 }}
                    >
                      <ChevronLeft size={16} /> Anterior
                    </button>
                    <button
                      className="btn-secondary"
                      disabled={pageUsers >= usersData.last_page}
                      onClick={() => setPageUsers(prev => prev + 1)}
                      style={{ opacity: pageUsers >= usersData.last_page ? 0.5 : 1 }}
                    >
                      Siguiente <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ROLES */}
      {activeTab === 'roles' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button className="btn-primary" onClick={handleOpenCreateRole}>
              <Plus size={18} />
              Nuevo Rol
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            {loadingRoles ? (
              <LoadingSpinner text="Cargando roles del sistema..." />
            ) : roles.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No hay roles registrados.</p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre del Rol</th>
                      <th style={{ minWidth: '240px' }}>Permisos Asignados</th>
                      <th>Usuarios con este Rol</th>
                      <th style={{ textAlign: 'center' }}>Estado</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((r: any) => {
                      const roleName = r.nombre || r.nom_rol || r.role_name;
                      let rolePerms: string[] = [];
                      if (Array.isArray(r.permisos)) {
                        rolePerms = r.permisos;
                      } else if (typeof r.permisos === 'string') {
                        try { rolePerms = JSON.parse(r.permisos); } catch {}
                      }

                      const isAll = rolePerms.length >= ALL_PERMISSION_IDS.length;

                      return (
                        <tr key={r.id} className="row-item">
                          <td style={{ fontWeight: 600, color: '#64748b' }}>#{r.id}</td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Shield size={16} color="#4f46e5" />
                              {roleName}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: isAll ? '#ecfdf5' : '#eff6ff',
                                  color: isAll ? '#059669' : '#2563eb',
                                  border: isAll ? '1px solid #a7f3d0' : '1px solid #bfdbfe'
                                }}>
                                  {rolePerms.length} de {ALL_PERMISSION_IDS.length} módulos
                                </span>
                                {isAll && (
                                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Acceso Total</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '360px' }}>
                                {rolePerms.slice(0, 3).map((pId: string) => {
                                  const item = PERMISSION_GROUPS.flatMap(g => g.items).find(i => i.id === pId);
                                  return (
                                    <span key={pId} style={{
                                      fontSize: '0.7rem',
                                      background: '#f8fafc',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '4px',
                                      padding: '1px 6px',
                                      color: '#475569'
                                    }}>
                                      {item ? item.name.split('(')[0].trim() : pId}
                                    </span>
                                  );
                                })}
                                {rolePerms.length > 3 && (
                                  <span style={{ fontSize: '0.7rem', color: '#64748b', alignSelf: 'center', fontWeight: 600 }}>
                                    +{rolePerms.length - 3} más
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ padding: '3px 10px', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                              {r.users_count || 0} usuario(s)
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {r.habilitado !== false ? (
                              <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>Activo</span>
                            ) : (
                              <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>Inactivo</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                              <button
                                className="btn-secondary"
                                style={{ padding: '4px 8px', color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
                                title="Editar Rol y Permisos"
                                onClick={() => handleOpenEditRole(r)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="btn-secondary"
                                style={{
                                  padding: '4px 8px',
                                  color: (r.users_count || 0) > 0 ? '#94a3b8' : '#dc2626',
                                  borderColor: (r.users_count || 0) > 0 ? '#e2e8f0' : '#fecaca',
                                  background: (r.users_count || 0) > 0 ? '#f8fafc' : '#fef2f2',
                                  cursor: (r.users_count || 0) > 0 ? 'not-allowed' : 'pointer'
                                }}
                                title={(r.users_count || 0) > 0 ? 'No se puede eliminar: tiene usuarios asignados' : 'Eliminar Rol'}
                                disabled={(r.users_count || 0) > 0}
                                onClick={() => handleDeleteRole(r)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL USUARIO */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserIcon size={20} color="#4f46e5" />
                {editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowUserModal(false)}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitUser}>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: Juan Arana"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="grid-responsive-2">
                <div className="form-group">
                  <label className="form-label">Nombre de Usuario *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ej: jarana"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol Asignado *</label>
                  <select
                    className="form-select"
                    required
                    value={userForm.role_id}
                    onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                  >
                    <option value="">Selecciona un Rol</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre || r.nom_rol || r.role_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview card of selected role */}
              {userForm.role_id && (() => {
                const selectedRole = roles.find(r => String(r.id) === String(userForm.role_id));
                if (!selectedRole) return null;
                const rName = selectedRole.nombre || selectedRole.nom_rol || selectedRole.role_name;
                const bStyle = getRoleBadgeStyle(rName);
                let pList: string[] = [];
                if (Array.isArray(selectedRole.permisos)) pList = selectedRole.permisos;
                else if (typeof selectedRole.permisos === 'string') {
                  try { pList = JSON.parse(selectedRole.permisos); } catch {}
                }
                const isAll = pList.length >= ALL_PERMISSION_IDS.length;

                return (
                  <div style={{
                    marginBottom: '16px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.825rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', ...bStyle }}>
                        {rName}
                      </span>
                      <span style={{ color: isAll ? '#059669' : '#4f46e5', fontSize: '0.75rem', fontWeight: 700 }}>
                        {isAll ? 'Acceso Total (Todos los módulos)' : `${pList.length} de ${ALL_PERMISSION_IDS.length} permisos`}
                      </span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.75rem', lineHeight: '1.4' }}>
                      {rName.toUpperCase().includes('ADMIN') ? (
                        'Este rol posee control total del sistema, incluyendo configuración de seguridad y gestión de usuarios.'
                      ) : rName.toUpperCase().includes('SUPERVISOR') ? (
                        'Este rol puede emitir y anular comprobantes, administrar clientes, servicios, arqueo/cierre de caja y reportes financieros.'
                      ) : (
                        'Este rol puede emitir comprobantes de venta, registrar abonos/cobros, consultar clientes y apertura/gastos de caja.'
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="form-group">
                <label className="form-label">Correo Electrónico (opcional)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Opcional (ej: usuario@sepriet.com)"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <KeyRound size={14} color="#64748b" />
                  {editingUserId ? 'Cambiar Contraseña (opcional)' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  required={!editingUserId}
                  placeholder={editingUserId ? 'Dejar en blanco para conservar la actual' : 'Mínimo 6 caracteres'}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={userForm.habilitado}
                    disabled={editingUserId === currentUser?.id}
                    onChange={(e) => setUserForm({ ...userForm, habilitado: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>Usuario Habilitado</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {editingUserId === currentUser?.id ? 'No puedes deshabilitar tu propio usuario activo' : 'Permite iniciar sesión en el sistema'}
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowUserModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ROL */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '840px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={22} color="#4f46e5" />
                  {editingRoleId ? 'Editar Rol y Permisos' : 'Crear Nuevo Rol y Permisos'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                  Configura el perfil de acceso y asigna las opciones del sistema habilitadas para este rol.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowRoleModal(false)}
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitRole} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Scrollable Body */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                {/* Preset Toolbar */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} color="#4f46e5" /> Cargar Plantilla Predefinida:
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={handleSelectAllPermisos}
                        style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600, color: '#334155' }}
                      >
                        Marcar Todos
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllPermisos}
                        style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}
                      >
                        Desmarcar Todos
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('ATENCION AL CLIENTE')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        color: '#0369a1',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Plantilla Atención al Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('SUPERVISOR')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        color: '#b45309',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Plantilla Supervisor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('ADMINISTRADOR')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#ede9fe',
                        border: '1px solid #ddd6fe',
                        color: '#6d28d9',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Plantilla Administrador (Total)
                    </button>
                  </div>
                </div>

                {/* Role Name & Enabled */}
                <div className="role-header-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Nombre del Rol *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Ej: ATENCION AL CLIENTE, SUPERVISOR, etc."
                      value={roleForm.nombre}
                      onChange={(e) => setRoleForm({ ...roleForm, nombre: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div style={{ paddingTop: '22px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={roleForm.habilitado}
                        onChange={(e) => setRoleForm({ ...roleForm, habilitado: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>Rol Habilitado</span>
                    </label>
                  </div>
                </div>

                {/* Permissions Matrix Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
                    Matriz de Permisos por Opciones del Sistema
                  </h4>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: roleForm.permisos.length > 0 ? '#4f46e5' : '#dc2626' }}>
                    {roleForm.permisos.length} de {ALL_PERMISSION_IDS.length} permisos habilitados
                  </span>
                </div>

                {/* Permission Groups */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {PERMISSION_GROUPS.map((group) => {
                    const groupAllChecked = group.items.every(item => roleForm.permisos.includes(item.id));
                    const checkedCount = group.items.filter(i => roleForm.permisos.includes(i.id)).length;

                    const toggleGroup = () => {
                      if (groupAllChecked) {
                        const toRemove = new Set(group.items.map(i => i.id));
                        setRoleForm(prev => ({ ...prev, permisos: prev.permisos.filter(id => !toRemove.has(id)) }));
                      } else {
                        const toAdd = group.items.map(i => i.id);
                        setRoleForm(prev => ({ ...prev, permisos: Array.from(new Set([...prev.permisos, ...toAdd])) }));
                      }
                    };

                    return (
                      <div
                        key={group.module}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#ffffff'
                        }}
                      >
                        {/* Group Header */}
                        <div
                          style={{
                            padding: '8px 14px',
                            background: '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: group.iconColor }} />
                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>{group.title}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>({checkedCount}/{group.items.length})</span>
                          </div>
                          <button
                            type="button"
                            onClick={toggleGroup}
                            style={{
                              fontSize: '0.75rem',
                              color: '#4f46e5',
                              fontWeight: 600,
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            {groupAllChecked ? 'Desmarcar sección' : 'Marcar sección'}
                          </button>
                        </div>

                        {/* Group Checkbox Items */}
                        <div className="role-matrix-group-grid" style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                          {group.items.map((item) => {
                            const isChecked = roleForm.permisos.includes(item.id);
                            return (
                              <label
                                key={item.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleTogglePermiso(item.id);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '10px',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: isChecked ? '1px solid #c7d2fe' : '1px solid #f1f5f9',
                                  background: isChecked ? '#f5f7ff' : '#fafafa',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  style={{ marginTop: '2px', width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.825rem', color: isChecked ? '#1e1b4b' : '#334155' }}>
                                    {item.name}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>
                                    {item.desc}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                  Permisos activos: <strong style={{ color: '#0f172a' }}>{roleForm.permisos.length}</strong> de {ALL_PERMISSION_IDS.length}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowRoleModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingRoleId ? 'Guardar Cambios' : 'Crear Rol'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
