import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, User as UserIcon, CheckCircle2, XCircle, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export const UsuariosPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'roles'>('usuarios');

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
  const [roleForm, setRoleForm] = useState({
    nombre: '',
    habilitado: true,
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
    setRoleForm({ nombre: '', habilitado: true });
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (r: any) => {
    setEditingRoleId(r.id);
    setRoleForm({
      nombre: r.nom_rol || r.role_name || r.nombre || '',
      habilitado: Boolean(r.habilitado),
    });
    setShowRoleModal(true);
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
      if (editingRoleId) {
        await api.put(`/roles/${editingRoleId}`, roleForm);
      } else {
        await api.post('/roles', roleForm);
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
    if (upper.includes('CAJERO') || upper.includes('ASISTENTE')) {
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
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '42px' }}
                  placeholder="Buscar por nombre, usuario o email..."
                  value={searchUsers}
                  onChange={(e) => { setSearchUsers(e.target.value); setPageUsers(1); }}
                />
              </div>

              <select
                className="form-select"
                style={{ width: '180px' }}
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
                      <th>Usuarios con este Rol</th>
                      <th style={{ textAlign: 'center' }}>Estado</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((r: any) => {
                      const roleName = r.nombre || r.nom_rol || r.role_name;
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
                                title="Editar Rol"
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserIcon size={20} color="#4f46e5" />
              {editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>

            <form onSubmit={handleSubmitUser}>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: Juan Arana"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
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
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
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

              <div className="form-group">
                <label className="form-label">Correo Electrónico (opcional)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Opcional (ej: usuario@sepriet.com)"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
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
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="#4f46e5" />
              {editingRoleId ? 'Editar Rol' : 'Nuevo Rol'}
            </h3>

            <form onSubmit={handleSubmitRole}>
              <div className="form-group">
                <label className="form-label">Nombre del Rol *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Ej: Supervisor, Auditor, etc."
                  value={roleForm.nombre}
                  onChange={(e) => setRoleForm({ ...roleForm, nombre: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={roleForm.habilitado}
                    onChange={(e) => setRoleForm({ ...roleForm, habilitado: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>Rol Habilitado</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowRoleModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingRoleId ? 'Guardar Cambios' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
