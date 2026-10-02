'use client';

import { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Lock,
  Shield,
  KeyRound,
  X,
  Trash2,
  Edit2,
  ShoppingCart,
  DollarSign,
  Users,
  Settings,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Sliders,
  Check,
  Layers,
  HelpCircle,
  AlertCircle,
  FileText,
  Boxes,
  Truck,
  PieChart,
  RotateCcw
} from 'lucide-react';
import { SYSTEM_PERMISSIONS, DEFAULT_ROLES } from '@/lib/permissions-data';

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'roles' | 'matrix'
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'cashier',
    phone: ''
  });

  // User Custom Permissions Modal
  const [permUserModal, setPermUserModal] = useState(null); // staff object being edited
  const [selectedUserPerms, setSelectedUserPerms] = useState([]);

  // Role Permissions Modal
  const [roleModal, setRoleModal] = useState(null); // role object being edited
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] });
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bazarpos_user');
    if (saved) {
      const u = JSON.parse(saved);
      loadData(u.storeId || 'default');
    } else {
      loadData('default');
    }
  }, []);

  const loadData = async (storeId) => {
    try {
      setLoading(true);
      const [staffRes, rolesRes, vouchRes] = await Promise.all([
        fetch(`/api/staff?storeId=${storeId}`),
        fetch(`/api/roles?storeId=${storeId}`),
        fetch(`/api/vouchers?storeId=${storeId}`)
      ]);

      const staffData = await staffRes.json();
      const rolesData = await rolesRes.json();
      const vouchData = await vouchRes.json();

      if (staffData.success) setStaff(staffData.staff || []);
      if (rolesData.success && rolesData.roles) setRoles(rolesData.roles);
      if (vouchData.success) setVouchers(vouchData.vouchers || []);
    } catch (err) {
      console.error('Failed loading staff & roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text, isError = false) => {
    if (isError) {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setMsg(text);
      setTimeout(() => setMsg(''), 3500);
    }
  };

  // ----------------- STAFF HANDLERS -----------------
  const handleOpenAddStaff = () => {
    setEditStaff(null);
    setStaffForm({ name: '', username: '', email: '', password: '', role: 'cashier', phone: '' });
    setShowStaffModal(true);
  };

  const handleOpenEditStaff = (st) => {
    setEditStaff(st);
    setStaffForm({
      name: st.name || '',
      username: st.username || '',
      email: st.email || '',
      password: '',
      role: st.role || 'cashier',
      phone: st.phone || ''
    });
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const method = editStaff ? 'PUT' : 'POST';
      const body = editStaff
        ? { storeId: u.storeId || 'default', id: editStaff.id, ...staffForm }
        : { storeId: u.storeId || 'default', ...staffForm };

      const res = await fetch('/api/staff', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setShowStaffModal(false);
        showNotification(editStaff ? 'Staff account updated!' : 'Staff account created successfully!');
        loadData(u.storeId || 'default');
      } else {
        showNotification(data.message || 'Error saving staff account', true);
      }
    } catch (err) {
      showNotification('Error saving staff account', true);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!confirm('Are you sure you want to delete this staff account?')) return;
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch(`/api/staff?id=${id}&storeId=${u.storeId || 'default'}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setStaff(staff.filter(s => s.id !== id));
        showNotification('Staff member removed.');
      } else {
        showNotification(data.message || 'Failed to delete staff', true);
      }
    } catch (err) {
      showNotification('Delete error', true);
    }
  };

  // ----------------- USER PERMISSIONS OVERRIDE HANDLERS -----------------
  const handleOpenUserPerms = (st) => {
    setPermUserModal(st);
    // If user has custom permissions, pre-populate them, otherwise load role default permissions
    if (Array.isArray(st.customPermissions) && st.customPermissions.length > 0) {
      setSelectedUserPerms([...st.customPermissions]);
    } else {
      const rObj = roles.find(r => r.id === st.role);
      setSelectedUserPerms(rObj ? [...rObj.permissions] : []);
    }
  };

  const handleToggleUserPerm = (permId) => {
    setSelectedUserPerms(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSaveUserPerms = async () => {
    if (!permUserModal) return;
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: u.storeId || 'default',
          id: permUserModal.id,
          customPermissions: selectedUserPerms
        })
      });
      const data = await res.json();
      if (data.success) {
        setPermUserModal(null);
        showNotification(`Individual permissions customized for @${permUserModal.username}!`);
        loadData(u.storeId || 'default');
      } else {
        showNotification(data.message || 'Failed to update user permissions', true);
      }
    } catch (err) {
      showNotification('Error saving custom user permissions', true);
    }
  };

  const handleResetUserPermsToRole = async () => {
    if (!permUserModal) return;
    if (!confirm(`Reset @${permUserModal.username}'s permissions to inherit directly from their assigned Role (${permUserModal.role})?`)) return;
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch('/api/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: u.storeId || 'default',
          id: permUserModal.id,
          customPermissions: null // reset override
        })
      });
      const data = await res.json();
      if (data.success) {
        setPermUserModal(null);
        showNotification(`Permissions for @${permUserModal.username} reset to Role default.`);
        loadData(u.storeId || 'default');
      }
    } catch (err) {
      showNotification('Error resetting permissions', true);
    }
  };

  // ----------------- ROLE & PERMISSION HANDLERS -----------------
  const handleOpenEditRole = (role) => {
    setIsCreatingRole(false);
    setRoleModal(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: [...(role.permissions || [])]
    });
  };

  const handleOpenCreateRole = () => {
    setIsCreatingRole(true);
    setRoleModal({ id: '' });
    setRoleForm({
      name: '',
      description: '',
      permissions: ['pos_terminal', 'view_invoices']
    });
  };

  const handleToggleRolePerm = (permId) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return;

    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const roleId = isCreatingRole
        ? roleForm.name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
        : roleModal.id;

      const payload = {
        storeId: u.storeId || 'default',
        role: {
          id: roleId,
          name: roleForm.name.trim(),
          description: roleForm.description,
          permissions: roleForm.permissions
        }
      };

      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setRoleModal(null);
        showNotification(isCreatingRole ? 'New role created!' : 'Role permissions updated successfully!');
        loadData(u.storeId || 'default');
      } else {
        showNotification(data.message || 'Failed to save role', true);
      }
    } catch (err) {
      showNotification('Error saving role permissions', true);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Are you sure you want to delete this custom role?')) return;
    try {
      const saved = localStorage.getItem('bazarpos_user');
      const u = saved ? JSON.parse(saved) : {};
      const res = await fetch(`/api/roles?id=${roleId}&storeId=${u.storeId || 'default'}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Role deleted successfully.');
        loadData(u.storeId || 'default');
      } else {
        showNotification(data.message || 'Failed to delete role', true);
      }
    } catch (err) {
      showNotification('Delete error', true);
    }
  };

  // Group system permissions by category
  const permissionGroups = SYSTEM_PERMISSIONS.reduce((acc, perm) => {
    acc[perm.group] = acc[perm.group] || [];
    acc[perm.group].push(perm);
    return acc;
  }, {});

  const getStaffStats = (staffMember) => {
    const matched = vouchers.filter(v =>
      v.salerName === staffMember.name ||
      v.salerName === staffMember.username ||
      v.createdBy === staffMember.username
    );
    const totalSales = matched.reduce((acc, v) => acc + (Number(v.totalAmount) || 0), 0);
    return {
      orderCount: matched.length,
      totalSales
    };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Shield className="text-blue-600" size={24} />
            <span>User Accounts, Roles & Granular Permissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage store staff users, configure role-level capabilities, or assign custom permission overrides per user.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'users' && (
            <button
              onClick={handleOpenAddStaff}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-sm text-xs"
            >
              <Plus size={16} />
              <span>Create Staff Account</span>
            </button>
          )}

          {activeTab === 'roles' && (
            <button
              onClick={handleOpenCreateRole}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-sm text-xs"
            >
              <Plus size={16} />
              <span>Create Custom Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Notifications */}
      {msg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'users'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users size={16} />
          <span>Staff Accounts ({staff.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'roles'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield size={16} />
          <span>Roles &amp; Default Permissions ({roles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'matrix'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers size={16} />
          <span>Full Permissions Matrix</span>
        </button>
      </div>

      {/* TAB 1: STAFF USERS */}
      {activeTab === 'users' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading staff members...</div>
          ) : staff.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <UserCheck size={40} className="mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-700 text-base">No staff accounts created yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Add cashiers, managers, and accountants so they can log into POS and be recorded on transactions.
              </p>
              <button
                onClick={handleOpenAddStaff}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs"
              >
                + Create First Staff
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {staff.map((st) => {
                const stats = getStaffStats(st);
                const roleObj = roles.find(r => r.id === st.role);
                const isCustomized = st.hasCustomPermissions;
                const permCount = st.effectivePermissions?.length || 0;

                return (
                  <div key={st.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                          {st.name?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{st.name}</h3>
                          <p className="text-[11px] text-slate-400 font-mono truncate">@{st.username}</p>
                          {st.email && <p className="text-[10px] text-blue-600 font-mono truncate">{st.email}</p>}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {roleObj?.name || st.role}
                        </span>
                        {isCustomized ? (
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md mt-1 flex items-center space-x-1">
                            <span>⚡ Customized ({permCount})</span>
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 mt-1">Role Default ({permCount})</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px] border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Total Sales:</span>
                        <span className="font-mono font-bold text-blue-600">৳{stats.totalSales.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Invoices Created:</span>
                        <span className="font-bold text-slate-800">{stats.orderCount}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleOpenUserPerms(st)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center space-x-1 transition"
                        title="Edit individual user permissions"
                      >
                        <Sliders size={13} className="text-blue-600" />
                        <span>Permissions</span>
                      </button>

                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleOpenEditStaff(st)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Staff Account"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(st.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Staff"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROLES & DEFAULT PERMISSIONS */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {roles.map((r) => {
            const isOwner = r.id === 'owner';
            const assignedCount = staff.filter(s => s.role === r.id).length;
            const permsList = r.permissions || [];

            return (
              <div key={r.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:border-indigo-300 transition">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 text-base">{r.name}</h3>
                        {r.isSystem ? (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border">System</span>
                        ) : (
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">Custom</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{r.description || 'Custom role definition.'}</p>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-xl text-slate-700 shrink-0">
                      {assignedCount} User{assignedCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Permissions Summary Badges */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Permissions ({isOwner ? 'All Unrestricted' : `${permsList.length} of ${SYSTEM_PERMISSIONS.length}`})
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1 bg-slate-50 rounded-xl border border-slate-100">
                      {isOwner ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                          ⭐ Full System Super Authority (All modules unlocked)
                        </span>
                      ) : permsList.length === 0 ? (
                        <span className="text-xs text-slate-400 italic p-1">No permissions assigned yet</span>
                      ) : (
                        permsList.map(pKey => {
                          const pDef = SYSTEM_PERMISSIONS.find(sp => sp.id === pKey);
                          return (
                            <span key={pKey} className="text-[10px] font-medium bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                              ✓ {pDef?.name || pKey}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {!isOwner ? (
                    <button
                      onClick={() => handleOpenEditRole(r)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
                    >
                      <Edit2 size={13} />
                      <span>Edit Role Permissions</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Owner permissions cannot be restricted</span>
                  )}

                  {!r.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(r.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Delete Custom Role"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: FULL PERMISSION MATRIX EXPLORER */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Layers size={16} className="text-blue-600" />
              <span>System Role Permissions Matrix</span>
            </h3>
            <span className="text-xs text-slate-500">Live matrix comparing all roles against system capabilities</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3.5 min-w-[220px]">Permission Name &amp; Capability</th>
                  <th className="p-3.5 min-w-[140px]">Module</th>
                  {roles.map(r => (
                    <th key={r.id} className="p-3.5 text-center min-w-[120px]">
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {Object.entries(permissionGroups).map(([groupName, perms]) => (
                  perms.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 text-slate-900">
                        <span className="font-bold block">{p.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">{p.desc}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                          {groupName}
                        </span>
                      </td>
                      {roles.map(r => {
                        const has = r.id === 'owner' || (r.permissions && r.permissions.includes(p.id));
                        return (
                          <td key={r.id} className="p-3.5 text-center">
                            {has ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 font-bold text-xs">
                                ✕
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- MODALS ----------------- */}

      {/* 1. Add / Edit Staff Account Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-base">
                {editStaff ? 'Edit Staff Account' : 'Create Staff Login & Seller Account'}
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-5 overflow-y-auto space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Rahim Cashier"
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Email Address * (For Password Recovery)</label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="staff@example.com"
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Username *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.username}
                    onChange={e => setStaffForm({ ...staffForm, username: e.target.value })}
                    placeholder="cashier1"
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">
                    {editStaff ? 'New Password (Optional)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editStaff}
                    value={staffForm.password}
                    onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                    placeholder={editStaff ? 'Leave empty to keep' : 'Password'}
                    className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Assigned Role *</label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 font-bold text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  {roles.filter(r => r.id !== 'owner').map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.description || 'Standard permissions'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={staffForm.phone}
                  onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="01700000000"
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md transition"
                >
                  {editStaff ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. User-Specific Permissions Override Modal */}
      {permUserModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                  <Sliders size={18} className="text-blue-600" />
                  <span>Customize Permissions for {permUserModal.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned Role: <strong className="text-blue-600">{permUserModal.role}</strong> • Overriding permissions for this user specifically.
                </p>
              </div>
              <button onClick={() => setPermUserModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">
                Selected: <strong className="text-blue-600">{selectedUserPerms.length}</strong> of {SYSTEM_PERMISSIONS.length} permissions
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserPerms(SYSTEM_PERMISSIONS.map(p => p.id))}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-semibold text-[11px]"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserPerms([])}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-semibold text-[11px]"
                >
                  Clear All
                </button>
                {permUserModal.hasCustomPermissions && (
                  <button
                    type="button"
                    onClick={handleResetUserPermsToRole}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg text-[11px] flex items-center space-x-1"
                  >
                    <RotateCcw size={12} />
                    <span>Reset to Role Default</span>
                  </button>
                )}
              </div>
            </div>

            {/* Permissions Checkbox Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
              {Object.entries(permissionGroups).map(([groupName, perms]) => (
                <div key={groupName} className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-[11px]">{groupName}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map(p => {
                      const isChecked = selectedUserPerms.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                            isChecked
                              ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/20'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleUserPerm(p.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block text-xs">{p.name}</span>
                            <span className="text-[10px] text-slate-500 block leading-tight">{p.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t flex space-x-3">
              <button
                type="button"
                onClick={() => setPermUserModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUserPerms}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md transition text-xs flex items-center justify-center space-x-1.5"
              >
                <Check size={16} />
                <span>Save User Permissions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Role Permissions & Custom Role Modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                  <Shield size={18} className="text-indigo-600" />
                  <span>{isCreatingRole ? 'Create New Custom Role' : `Edit Role: ${roleForm.name}`}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All staff assigned to this role will inherit these default permissions.
                </p>
              </div>
              <button onClick={() => setRoleModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold text-xs">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="e.g. Senior Cashier"
                    className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold text-xs">Description</label>
                  <input
                    type="text"
                    value={roleForm.description}
                    onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                    placeholder="Role responsibilities and scope"
                    className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Permissions Header */}
              <div className="flex items-center justify-between p-2 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                <span className="font-semibold text-indigo-950">
                  Role Permissions: <strong className="text-indigo-600">{roleForm.permissions.length}</strong> active
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setRoleForm({ ...roleForm, permissions: SYSTEM_PERMISSIONS.map(p => p.id) })}
                    className="px-2 py-0.5 bg-white border border-indigo-200 rounded-lg text-indigo-700 text-[10px] font-bold"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                    className="px-2 py-0.5 bg-white border border-indigo-200 rounded-lg text-slate-600 text-[10px] font-bold"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Checkboxes grouped */}
              <div className="space-y-3">
                {Object.entries(permissionGroups).map(([groupName, perms]) => (
                  <div key={groupName} className="p-3 bg-slate-50/60 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{groupName}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map(p => {
                        const isChecked = roleForm.permissions.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start space-x-2.5 p-2 rounded-xl border cursor-pointer transition text-xs ${
                              isChecked
                                ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-400/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleRolePerm(p.id)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block text-xs">{p.name}</span>
                              <span className="text-[10px] text-slate-500 block leading-tight">{p.desc}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t flex space-x-3">
                <button
                  type="button"
                  onClick={() => setRoleModal(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition text-xs"
                >
                  {isCreatingRole ? 'Create Role' : 'Save Role Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
