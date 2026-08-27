import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPermissions, HistoryEntry, ViewTab } from '../types';
import { api } from '../api';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Key, 
  Building, 
  Search, 
  Download, 
  Sliders, 
  PackageMinus, 
  Moon, 
  Sun, 
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Layers,
  LayoutGrid,
  List,
  Scan,
  RefreshCw,
  Truck,
  History,
  QrCode
} from 'lucide-react';

interface AdminSettingsViewProps {
  currentUser: User | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSwitchUser?: (user: User) => void;
}

const ALL_APP_TABS: { id: ViewTab; label: string; desc: string; icon: any }[] = [
  { id: 'shelf', label: 'Regal-Grafik', desc: 'Visuelle Regalfächer & Bestände', icon: LayoutGrid },
  { id: 'list', label: 'Artikelliste', desc: 'Suchbare Übersicht aller Artikel', icon: List },
  { id: 'scanner', label: 'Barcode-Scanner', desc: 'Kamera- & Handscanner', icon: Scan },
  { id: 'reorder', label: 'Nachbestellung', desc: 'Bestellliste für Mindestbestände', icon: RefreshCw },
  { id: 'shipping', label: 'Paket & Versand', desc: 'Gewichtsrechner & Kartons', icon: Truck },
  { id: 'history', label: 'Verlauf', desc: 'Buchungsprotokoll & Audit-Trail', icon: History },
  { id: 'generator', label: 'Barcodes', desc: 'Etiketten & Barcode-Druck', icon: QrCode },
  { id: 'settings', label: 'Admin-Einstellungen', desc: 'Rechte- & Systemsteuerung', icon: ShieldCheck },
];

const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  canScanIn: true,
  canScanOut: true,
  canManageInventory: true,
  canDeleteProducts: true,
  canViewHistory: true,
  canExportData: true,
  canManageUsers: true,
  allowedTabs: ['shelf', 'list', 'scanner', 'reorder', 'shipping', 'history', 'generator', 'settings'],
};

const DEFAULT_EMPLOYEE_PERMISSIONS: UserPermissions = {
  canScanIn: true,
  canScanOut: true,
  canManageInventory: true,
  canDeleteProducts: false,
  canViewHistory: true,
  canExportData: false,
  canManageUsers: false,
  allowedTabs: ['shelf', 'list', 'scanner', 'reorder', 'shipping', 'history', 'generator'],
};

export function AdminSettingsView({
  currentUser,
  darkMode,
  onToggleDarkMode,
  onSwitchUser
}: AdminSettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'withdrawals' | 'system'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Withdrawals Log State
  const [withdrawals, setWithdrawals] = useState<HistoryEntry[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');

  // Edit/Create User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('employee');
  const [formDepartment, setFormDepartment] = useState('Lager & Versand');
  const [formActive, setFormActive] = useState(true);
  const [formPermissions, setFormPermissions] = useState<UserPermissions>(DEFAULT_EMPLOYEE_PERMISSIONS);
  const [formAllowedTabs, setFormAllowedTabs] = useState<ViewTab[]>(DEFAULT_EMPLOYEE_PERMISSIONS.allowedTabs || []);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await api.getUsers();
      setUsers(list);
    } catch (e) {
      console.error('Fehler beim Laden der Benutzer:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const history = await api.getHistory({ action: 'WITHDRAW' });
      setWithdrawals(history);
    } catch (e) {
      console.error('Fehler beim Laden des Entnahme-Verlaufs:', e);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadWithdrawals();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormName('');
    setFormPassword('');
    setFormRole('employee');
    setFormDepartment('Lager & Versand');
    setFormActive(true);
    setFormPermissions(DEFAULT_EMPLOYEE_PERMISSIONS);
    setFormAllowedTabs(DEFAULT_EMPLOYEE_PERMISSIONS.allowedTabs || ['shelf', 'list', 'scanner', 'reorder', 'shipping', 'history', 'generator']);
    setFormError('');
    setIsUserModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormName(u.name);
    setFormPassword('');
    setFormRole(u.role);
    setFormDepartment(u.department || 'Lager');
    setFormActive(u.active !== false);
    const perms = u.permissions || (u.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_EMPLOYEE_PERMISSIONS);
    setFormPermissions(perms);
    setFormAllowedTabs(perms.allowedTabs || (u.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS.allowedTabs! : DEFAULT_EMPLOYEE_PERMISSIONS.allowedTabs!));
    setFormError('');
    setIsUserModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole);
    if (newRole === 'admin') {
      setFormPermissions(DEFAULT_ADMIN_PERMISSIONS);
      setFormAllowedTabs(DEFAULT_ADMIN_PERMISSIONS.allowedTabs!);
    } else {
      setFormPermissions(DEFAULT_EMPLOYEE_PERMISSIONS);
      setFormAllowedTabs(DEFAULT_EMPLOYEE_PERMISSIONS.allowedTabs!);
    }
  };

  const toggleAllowedTab = (tabId: ViewTab) => {
    setFormAllowedTabs(prev => {
      if (prev.includes(tabId)) {
        return prev.filter(t => t !== tabId);
      } else {
        return [...prev, tabId];
      }
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formName.trim()) {
      setFormError('Bitte Benutzername und Name angeben.');
      return;
    }

    if (!editingUser && !formPassword.trim()) {
      setFormError('Bitte ein Kennwort für das neue Mitarbeiterkonto festlegen.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      const finalPermissions: UserPermissions = {
        ...formPermissions,
        allowedTabs: formAllowedTabs
      };

      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name: formName.trim(),
          role: formRole,
          department: formDepartment.trim(),
          active: formActive,
          permissions: finalPermissions,
          password: formPassword.trim() || undefined
        });
        setToastMessage(`Mitarbeiter "${formName}" erfolgreich aktualisiert.`);
      } else {
        await api.createUser({
          username: formUsername.trim().toLowerCase(),
          password: formPassword.trim(),
          name: formName.trim(),
          role: formRole,
          department: formDepartment.trim(),
          active: formActive,
          permissions: finalPermissions
        });
        setToastMessage(`Mitarbeiter "${formName}" erfolgreich angelegt.`);
      }

      await loadUsers();
      setIsUserModalOpen(false);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Fehler beim Speichern des Benutzers.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.username === 'admin') {
      alert('Der Haupt-Administrator kann nicht gelöscht werden.');
      return;
    }

    if (confirm(`Möchtest du den Benutzer "${u.name}" (@${u.username}) wirklich löschen?`)) {
      try {
        const res = await api.deleteUser(u.id);
        if (res.error) {
          alert(res.error);
        } else {
          await loadUsers();
          setToastMessage(`Benutzer "${u.name}" wurde gelöscht.`);
          setTimeout(() => setToastMessage(''), 3000);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const exportWithdrawalsCSV = () => {
    if (withdrawals.length === 0) {
      alert('Keine Entnahmen zum Exportieren vorhanden.');
      return;
    }

    const headers = ['Datum & Uhrzeit', 'Mitarbeiter', 'Benutzername', 'Rolle', 'Artikel', 'Barcode', 'Fach', 'Entnommene Menge', 'Ticket-Nummer', 'Gewicht pro Stk (g)', 'Gesamtgewicht (g)'];
    const rows = filteredWithdrawals.map(w => [
      `"${new Date(w.timestamp).toLocaleString('de-DE')}"`,
      `"${w.userFullName || w.username}"`,
      `"${w.username}"`,
      `"${w.userRole}"`,
      `"${w.productName}"`,
      `"${w.barcode}"`,
      `"${w.location}"`,
      `"${Math.abs(w.quantityChanged)}"`,
      `"${w.ticketNumber || '-'}"`,
      `"${w.weightGramsPerUnit || 0}"`,
      `"${w.totalWeightGrams || 0}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Entnahmeprotokoll_Lager_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch =
      w.productName.toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
      w.barcode.toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
      (w.ticketNumber && w.ticketNumber.toLowerCase().includes(withdrawalSearch.toLowerCase())) ||
      (w.userFullName && w.userFullName.toLowerCase().includes(withdrawalSearch.toLowerCase())) ||
      w.username.toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
      w.location.toLowerCase().includes(withdrawalSearch.toLowerCase());

    const matchesUser = selectedUserFilter === 'ALL' || w.username === selectedUserFilter || w.userId === selectedUserFilter;
    return matchesSearch && matchesUser;
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Admin Settings Header */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              <span>Administrator-Einstellungen & Rechteverwaltung</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 font-bold uppercase">
                Admin
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Benutzerkonten anlegen, Fenster-/Tab-Zugriffsrechte festlegen & Entnahmeverlauf einsehen
            </p>
          </div>
        </div>

        {/* Global Dark Mode Toggle in Admin */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          <span>{darkMode ? 'Heller Modus' : 'Dunkler Modus'}</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs: Flexible & Responsive */}
      <div className="flex sm:grid sm:grid-cols-3 gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 p-1.5 sm:p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          className={`flex-1 min-w-[100px] sm:min-w-0 flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl transition text-xs sm:text-sm font-bold shrink-0 ${
            activeSubTab === 'users'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>
            <span className="sm:hidden">1. Benutzer</span>
            <span className="hidden sm:inline">1. Benutzer & Rechte</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('withdrawals'); loadWithdrawals(); }}
          className={`flex-1 min-w-[100px] sm:min-w-0 flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl transition text-xs sm:text-sm font-bold shrink-0 ${
            activeSubTab === 'withdrawals'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <PackageMinus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>
            <span className="sm:hidden">2. Entnahmen</span>
            <span className="hidden sm:inline">2. Entnahmeverlauf</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('system')}
          className={`flex-1 min-w-[100px] sm:min-w-0 flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl transition text-xs sm:text-sm font-bold shrink-0 ${
            activeSubTab === 'system'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>
            <span className="sm:hidden">3. System</span>
            <span className="hidden sm:inline">3. Einstellungen</span>
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: BENUTZER & FENSTER-ZUGRIFFSRECHTE                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Action Bar */}
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Mitarbeiter suchen..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Neuen Benutzer anlegen</span>
            </button>
          </div>

          {/* Users View: Mobile Cards (<md) vs Full Table (>=md) */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
                Keine Mitarbeiter gefunden.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const perms = u.permissions || (u.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_EMPLOYEE_PERMISSIONS);
                const allowedTabs = perms.allowedTabs || (u.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS.allowedTabs! : DEFAULT_EMPLOYEE_PERMISSIONS.allowedTabs!);
                const isCurrent = currentUser?.id === u.id || currentUser?.username === u.username;

                return (
                  <div
                    key={u.id}
                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
                          u.role === 'admin' ? 'bg-purple-600' : 'bg-indigo-600'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate text-sm">
                            <span className="truncate">{u.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                Du
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-400 truncate">
                            @{u.username}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {u.active !== false ? (
                          <span className="inline-flex items-center text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            Aktiv
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            Inaktiv
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/80 text-xs">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        u.role === 'admin' 
                          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800' 
                          : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      }`}>
                        {u.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        {u.department || 'Lager'}
                      </span>
                    </div>

                    {/* Allowed Tabs chips */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Erlaubte Fenster ({allowedTabs.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {allowedTabs.map(tabKey => {
                          const tabInfo = ALL_APP_TABS.find(t => t.id === tabKey);
                          return (
                            <span
                              key={tabKey}
                              className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-medium"
                            >
                              {tabInfo?.label || tabKey}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions on Mobile */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/80 gap-2">
                      {onSwitchUser && !isCurrent ? (
                        <button
                          type="button"
                          onClick={() => onSwitchUser(u)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
                        >
                          Als @{u.username} anmelden
                        </button>
                      ) : <div />}

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-xs font-bold transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Rechte</span>
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-950/60 rounded-xl transition"
                            title="Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Users Desktop Table (Hidden on mobile) */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Mitarbeiter</th>
                    <th className="py-3 px-3">Rolle & Abteilung</th>
                    <th className="py-3 px-3">Erlaubte Fenster & Bereiche</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredUsers.map((u) => {
                    const perms = u.permissions || (u.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_EMPLOYEE_PERMISSIONS);
                    const allowedTabs = perms.allowedTabs || (u.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS.allowedTabs! : DEFAULT_EMPLOYEE_PERMISSIONS.allowedTabs!);
                    const isCurrent = currentUser?.id === u.id || currentUser?.username === u.username;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-3 px-4">
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

                        <td className="py-3 px-3">
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

                        {/* Allowed tabs pill badges */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {allowedTabs.map(tabKey => {
                              const tabInfo = ALL_APP_TABS.find(t => t.id === tabKey);
                              return (
                                <span
                                  key={tabKey}
                                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium"
                                >
                                  {tabInfo?.label || tabKey}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-2 text-center">
                          {u.active !== false ? (
                            <span className="inline-flex items-center text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              Aktiv
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                              Inaktiv
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {onSwitchUser && !isCurrent && (
                              <button
                                type="button"
                                onClick={() => onSwitchUser(u)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold transition"
                                title="Als dieser Benutzer anmelden"
                              >
                                Anmelden
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Rechte bearbeiten"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: GESAMT-ENTNAHMEVERLAUF (ÜBERSICHTLICH MIT TICKET & BENUTZER)   */}
      {/* ========================================================================= */}
      {activeSubTab === 'withdrawals' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Artikel, Ticket oder Barcode..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                  value={withdrawalSearch}
                  onChange={(e) => setWithdrawalSearch(e.target.value)}
                />
              </div>

              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none text-slate-900 dark:text-white"
              >
                <option value="ALL">Alle Mitarbeiter</option>
                {users.map(u => (
                  <option key={u.id} value={u.username}>{u.name} (@{u.username})</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={exportWithdrawalsCSV}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Entnahmen als CSV</span>
            </button>
          </div>

          {/* Withdrawals: Mobile Cards (<md) vs Desktop Table (>=md) */}
          <div className="md:hidden space-y-3">
            {filteredWithdrawals.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                Keine Entnahme-Einträge gefunden.
              </div>
            ) : (
              filteredWithdrawals.map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-rose-600 dark:text-rose-400 font-mono text-sm bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                      -{Math.abs(w.quantityChanged)} Stk.
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(w.timestamp).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {w.productName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                      <span className="font-mono">{w.barcode}</span>
                      <span>•</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">Fach {w.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/80 text-xs">
                    <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-300">
                      <span>Mitarbeiter:</span>
                      <strong className="text-slate-900 dark:text-white">{w.userFullName || w.username}</strong>
                    </div>

                    {w.ticketNumber ? (
                      <span className="font-mono font-bold text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                        #{w.ticketNumber}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Withdrawals Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Datum & Uhrzeit</th>
                    <th className="py-3 px-3">Mitarbeiter</th>
                    <th className="py-3 px-3">Artikel & Fach</th>
                    <th className="py-3 px-3 text-center">Menge</th>
                    <th className="py-3 px-3">Ticket-Referenz</th>
                    <th className="py-3 px-3 text-right">Gewicht</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                        {new Date(w.timestamp).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {w.userFullName || w.username}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          @{w.username}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {w.productName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                          <span className="font-mono">{w.barcode}</span>
                          <span>•</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">Fach {w.location}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-black text-rose-600 dark:text-rose-400 font-mono text-sm bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                          -{Math.abs(w.quantityChanged)} Stk.
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {w.ticketNumber ? (
                          <span className="font-mono font-bold text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            #{w.ticketNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Ohne Ticket</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {w.totalWeightGrams ? `${w.totalWeightGrams} g` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredWithdrawals.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <PackageMinus className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300 text-xs">Keine Entnahme-Einträge gefunden</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SYSTEM & EINSTELLUNGEN                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'system' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center">
              <Sliders className="w-4 h-4 mr-2 text-purple-600" />
              Lager-Regeln & Farblogik
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                <span className="font-bold text-rose-700 dark:text-rose-300 block mb-1">Rot (Kritisch)</span>
                <p className="text-slate-600 dark:text-slate-300">
                  Bestand ist <strong>unter</strong> Mindestbestand (z.B. &lt; 15). Sofortiger Bestellbedarf!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">Orange (Warnung)</span>
                <p className="text-slate-600 dark:text-slate-300">
                  Bestand ist <strong>exakt</strong> auf dem Mindestbestand (z.B. genau 15).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Normal / Schwarz</span>
                <p className="text-slate-600 dark:text-slate-300">
                  Bestand ist <strong>über</strong> dem Mindestbestand (z.B. &gt; 15).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: User Edit / Create */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col">
            <div className="bg-purple-600 p-4 sm:p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight">
                    {editingUser ? `Mitarbeiterrechte anpassen` : 'Neues Mitarbeiterkonto anlegen'}
                  </h3>
                  <p className="text-xs text-purple-100">
                    Zugang zu einzelnen Fenstern & Aktionen konfigurieren
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-white/80 hover:text-white text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 p-3 rounded-xl flex items-center space-x-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
                    placeholder=""
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 px-1">
                    Beispiel: Dennis Müller
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Benutzername (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    placeholder=""
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-purple-500 dark:text-white disabled:opacity-60"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 px-1">
                    Beispiel: d.mueller
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center">
                    <Key className="w-3 h-3 mr-1 text-slate-400" />
                    {editingUser ? 'Neues Kennwort (leer = unverändert)' : 'Kennwort *'}
                  </label>
                  <input
                    type="password"
                    placeholder=""
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center">
                    <Building className="w-3 h-3 mr-1 text-slate-400" />
                    Abteilung / Team
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 px-1">
                    Beispiel: IT-Support, Versand, Lager
                  </span>
                </div>
              </div>

              {/* Role */}
              <div className="grid grid-cols-2 gap-2 pt-1">
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
                  <span className="text-[10px] opacity-80 block mt-0.5">Scannen, Entnehmen & Zubuchen</span>
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
                  <span className="text-[10px] opacity-80 block mt-0.5">Vollzugriff inkl. Einstellungen</span>
                </button>
              </div>

              {/* Window & Tab Access Matrix */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                  Auf welche Fenster & Tabs darf dieser Benutzer zugreifen?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_APP_TABS.map(tab => {
                    const isAllowed = formAllowedTabs.includes(tab.id);
                    return (
                      <label
                        key={tab.id}
                        className={`flex items-start space-x-2.5 p-2 rounded-xl border cursor-pointer transition ${
                          isAllowed
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAllowed}
                          onChange={() => toggleAllowedTab(tab.id)}
                          className="w-4 h-4 text-purple-600 rounded mt-0.5"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white block leading-tight">
                            {tab.label}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                            {tab.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-2.5 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
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
                  <span>{isSaving ? 'Speichere...' : 'Benutzerrechte speichern'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
