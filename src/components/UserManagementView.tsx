import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPermissions } from '../types';
import { api } from '../api';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Key, 
  Building, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Info
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser: User | null;
  onSwitchUser?: (user: User) => void;
}

const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  canScanIn: true,
  canScanOut: true,
  canManageInventory: true,
  canDeleteProducts: true,
  canViewHistory: true,
  canExportData: true,
  canManageUsers: true,
};

const DEFAULT_EMPLOYEE_PERMISSIONS: UserPermissions = {
  canScanIn: true,
  canScanOut: true,
  canManageInventory: true,
  canDeleteProducts: false,
  canViewHistory: true,
  canExportData: false,
  canManageUsers: false,
};

export function UserManagementView({ currentUser, onSwitchUser }: UserManagementViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form State
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('employee');
  const [formDepartment, setFormDepartment] = useState('Lager & Versand');
  const [formActive, setFormActive] = useState(true);
  const [formPermissions, setFormPermissions] = useState<UserPermissions>(DEFAULT_EMPLOYEE_PERMISSIONS);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (e) {
      console.error("Fehler beim Laden der Benutzer:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormName('');
    setFormPassword('');
    setFormRole('employee');
    setFormDepartment('Lager & Kommissionierung');
    setFormActive(true);
    setFormPermissions(DEFAULT_EMPLOYEE_PERMISSIONS);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormName(u.name);
    setFormPassword('');
    setFormRole(u.role);
    setFormDepartment(u.department || (u.role === 'admin' ? 'Lagerleitung' : 'Lager'));
    setFormActive(u.active !== false);
    setFormPermissions(u.permissions || (u.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_EMPLOYEE_PERMISSIONS));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole);
    if (newRole === 'admin') {
      setFormPermissions(DEFAULT_ADMIN_PERMISSIONS);
    } else {
      setFormPermissions(DEFAULT_EMPLOYEE_PERMISSIONS);
    }
  };

  const handleTogglePermission = (key: keyof UserPermissions) => {
    setFormPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formName.trim()) {
      setFormError('Bitte Benutzername und Name ausfüllen.');
      return;
    }

    if (!editingUser && !formPassword.trim()) {
      setFormError('Bitte ein Passwort für den neuen Benutzer festlegen.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name: formName.trim(),
          role: formRole,
          department: formDepartment.trim(),
          active: formActive,
          permissions: formPermissions,
          password: formPassword.trim() || undefined
        });
        setSuccessToast(`Benutzer "${formName}" erfolgreich aktualisiert!`);
      } else {
        await api.createUser({
          username: formUsername.trim().toLowerCase(),
          password: formPassword.trim(),
          name: formName.trim(),
          role: formRole,
          department: formDepartment.trim(),
          active: formActive,
          permissions: formPermissions
        });
        setSuccessToast(`Benutzer "${formName}" erfolgreich angelegt!`);
      }

      await loadUsers();
      setIsModalOpen(false);
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Fehler beim Speichern des Benutzers.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.username === 'admin') {
      alert('Der Standard-Administrator kann nicht gelöscht werden.');
      return;
    }

    if (confirm(`Möchtest du den Benutzer "${u.name}" (@${u.username}) wirklich löschen?`)) {
      try {
        const res = await api.deleteUser(u.id);
        if (res.error) {
          alert(res.error);
        } else {
          await loadUsers();
          setSuccessToast(`Benutzer "${u.name}" gelöscht.`);
          setTimeout(() => setSuccessToast(''), 3000);
        }
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(search.toLowerCase())) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              <span>Personen- & Rechteverwaltung</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 uppercase font-black tracking-wider">
                Admin
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Steuerung aller Mitarbeiterkonten, Lager-Zugriffsrechte und Berechtigungen
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Neuen Mitarbeiter anlegen</span>
        </button>
      </div>

      {/* Search & Overview Stats */}
      <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Mitarbeiter oder Abteilung suchen..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
          <span>Gesamt: <strong className="text-slate-900 dark:text-white">{users.length} Benutzer</strong></span>
          <span>•</span>
          <span>Admins: <strong className="text-purple-600 dark:text-purple-400">{users.filter(u => u.role === 'admin').length}</strong></span>
          <span>•</span>
          <span>Lageristen: <strong className="text-indigo-600 dark:text-indigo-400">{users.filter(u => u.role === 'employee').length}</strong></span>
        </div>
      </div>

      {/* Users & Permissions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Mitarbeiter & Konto</th>
                <th className="py-3 px-3">Rolle & Bereich</th>
                <th className="py-3 px-2 text-center" title="Einbuchen / Zubuchen">Einbuchen (+)</th>
                <th className="py-3 px-2 text-center" title="Ausbuchen / Entnahme">Ausbuchen (-)</th>
                <th className="py-3 px-2 text-center" title="Artikel verwalten">Artikel pflegen</th>
                <th className="py-3 px-2 text-center" title="Artikel löschen">Löschen</th>
                <th className="py-3 px-2 text-center" title="Verlauf einsehen">Verlauf</th>
                <th className="py-3 px-2 text-center" title="CSV Export">Export</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map((u) => {
                const perms = u.permissions || (u.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_EMPLOYEE_PERMISSIONS);
                const isCurrent = currentUser?.id === u.id || currentUser?.username === u.username;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                    {/* User name & username */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                          u.role === 'admin' ? 'bg-purple-600' : 'bg-indigo-600'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-full">
                                Du
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Department */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        u.role === 'admin' 
                          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800' 
                          : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      }`}>
                        {u.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                      </span>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {u.department || 'Lager'}
                      </div>
                    </td>

                    {/* Permissions Checkmarks */}
                    <td className="py-3.5 px-2 text-center">
                      {perms.canScanIn !== false ? (
                        <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 mx-auto text-slate-300 dark:text-slate-600" />
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      {perms.canScanOut !== false ? (
                        <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 mx-auto text-slate-300 dark:text-slate-600" />
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      {perms.canManageInventory ? (
                        <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 mx-auto text-slate-300 dark:text-slate-600" />
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      {perms.canDeleteProducts ? (
                        <Check className="w-4 h-4 mx-auto text-rose-600 dark:text-rose-400" />
                      ) : (
                        <X className="w-4 h-4 mx-auto text-slate-300 dark:text-slate-600" />
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      {perms.canViewHistory !== false ? (
                        <Check className="w-4 h-4 mx-auto text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="w-4 h-4 mx-auto text-slate-300 dark:text-slate-600" />
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-center">
                      {perms.canExportData ? (
                        <Check className="w-4 h-4 mx-auto text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <X className="w-4 h-4 mx-auto text-slate-300 dark:text-slate-600" />
                      )}
                    </td>

                    {/* Active Status */}
                    <td className="py-3.5 px-3 text-center">
                      {u.active !== false ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Aktiv</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          <span>Inaktiv</span>
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {onSwitchUser && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => onSwitchUser(u)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold transition"
                            title="Als dieser Benutzer einloggen"
                          >
                            Einloggen
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Benutzer und Rechte bearbeiten"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition"
                            title="Benutzer löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card explaining permissions */}
      <div className="bg-indigo-50/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700 text-xs text-indigo-950 dark:text-indigo-200 space-y-1 flex items-start space-x-3">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Hinweis zur Rechtevergabe im Lager:</strong>
          <span>
            Mitarbeiter mit <strong>„Ausbuchen (-)“</strong>-Rechten können Artikel entnehmen und müssen dabei optional Ticket-Nummern angeben. 
            <strong>„Löschen“</strong> und <strong>„Rechteverwaltung“</strong> sind standardmäßig Administratoren vorbehalten.
          </span>
        </div>
      </div>

      {/* Modal: Create / Edit User & Permissions */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-purple-600 p-4 sm:p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight">
                    {editingUser ? `Mitarbeiter bearbeiten` : 'Neuen Mitarbeiter anlegen'}
                  </h3>
                  <p className="text-xs text-purple-100">
                    Zugangsdaten, Rolle und individuelle Berechtigungen festlegen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 p-3 rounded-xl flex items-center space-x-2 font-medium">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basis-Daten */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Vollständiger Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Lukas Becker"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Benutzername (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    placeholder="z.B. l.becker"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-purple-500 dark:text-white disabled:opacity-60"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center">
                    <Key className="w-3 h-3 mr-1 text-slate-400" />
                    {editingUser ? 'Neues Kennwort (leer lassen für unverändert)' : 'Kennwort *'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingUser ? '••••••••' : 'Sicheres Kennwort'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center">
                    <Building className="w-3 h-3 mr-1 text-slate-400" />
                    Abteilung / Bereich
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. IT-Support, Versand, Werkstatt"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                  />
                </div>
              </div>

              {/* Role selection & Active toggle */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Rolle & Profil</span>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Konto ist aktiv</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('employee')}
                    className={`p-2.5 rounded-xl text-left border transition ${
                      formRole === 'employee'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-bold ring-1 ring-indigo-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="block font-bold">Lagerist / Mitarbeiter</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">Scannen, Entnahmen mit Ticket & Zubuchungen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`p-2.5 rounded-xl text-left border transition ${
                      formRole === 'admin'
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-950 dark:text-purple-200 font-bold ring-1 ring-purple-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="block font-bold">Administrator</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">Vollzugriff inkl. Rechteverwaltung & Löschen</span>
                  </button>
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                    Individuelle Zugriffsrechte & Funktionen
                  </label>
                  <span className="text-[10px] text-slate-400">Nach Bedarf anpassbar</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={formPermissions.canScanIn}
                      onChange={() => handleTogglePermission('canScanIn')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block leading-tight">Wareneingang / Zubuchen (+)</span>
                      <span className="text-[10px] text-slate-500">Artikel einscannen & Bestand aufstocken</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={formPermissions.canScanOut}
                      onChange={() => handleTogglePermission('canScanOut')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block leading-tight">Warenausgang / Entnehmen (-)</span>
                      <span className="text-[10px] text-slate-500">Artikel mit/ohne Ticket-Nummer entnehmen</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageInventory}
                      onChange={() => handleTogglePermission('canManageInventory')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block leading-tight">Artikel anlegen & bearbeiten</span>
                      <span className="text-[10px] text-slate-500">Stammdaten, Gewichte & Mindestbestände</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={formPermissions.canDeleteProducts}
                      onChange={() => handleTogglePermission('canDeleteProducts')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block leading-tight">Artikel aus Lager löschen</span>
                      <span className="text-[10px] text-rose-500">Kritische Aktion (nur für Berechtigte)</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={formPermissions.canViewHistory}
                      onChange={() => handleTogglePermission('canViewHistory')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block leading-tight">Verlauf & Protokoll einsehen</span>
                      <span className="text-[10px] text-slate-500">Audit-Trail und Buchungs-Historie</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={formPermissions.canExportData}
                      onChange={() => handleTogglePermission('canExportData')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block leading-tight">CSV-Export & Berichte</span>
                      <span className="text-[10px] text-slate-500">Datenexporte für Einkauf & Controlling</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex gap-2.5 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Speichere...' : 'Benutzer speichern'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
