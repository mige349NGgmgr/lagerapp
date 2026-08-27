import { useState, useEffect } from 'react';
import { HistoryEntry, User } from '../types';
import { api } from '../api';
import { 
  History, 
  Search, 
  Filter, 
  Tag, 
  User as UserIcon, 
  ArrowDownRight, 
  ArrowUpRight, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Download, 
  Printer, 
  Scale, 
  Clock,
  X,
  RefreshCw
} from 'lucide-react';

interface HistoryViewProps {
  currentUser: User | null;
  onFilterByTicket?: (ticket: string) => void;
}

export function HistoryView({ currentUser }: HistoryViewProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory({
        ticket: selectedTicket || undefined,
        userId: selectedUserId || undefined,
        action: selectedAction !== 'ALL' ? selectedAction : undefined,
        search: search || undefined
      });
      setHistory(data);
    } catch (e) {
      console.error("Fehler beim Laden des Verlaufs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getUsers().then(setAllUsers).catch(console.error);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [selectedTicket, selectedUserId, selectedAction, search]);

  const handleExportCSV = () => {
    if (history.length === 0) return;

    const headers = [
      'Datum & Uhrzeit',
      'Mitarbeiter Name',
      'Benutzername',
      'Rolle',
      'Aktion',
      'Artikelname',
      'Barcode / EAN',
      'Fach',
      'Menge Änderung',
      'Vorher',
      'Nachher',
      'Ticket-Nummer',
      'Stückgewicht (g)',
      'Gesamtgewicht (g)',
      'Notizen'
    ];

    const rows = history.map(h => [
      `"${new Date(h.timestamp).toLocaleString('de-DE')}"`,
      `"${(h.userFullName || '').replace(/"/g, '""')}"`,
      `"${(h.username || '').replace(/"/g, '""')}"`,
      `"${h.userRole || 'employee'}"`,
      `"${h.action}"`,
      `"${(h.productName || '').replace(/"/g, '""')}"`,
      `"${h.barcode || ''}"`,
      `"${h.location || ''}"`,
      h.quantityChanged,
      h.previousQuantity ?? '',
      h.newQuantity ?? '',
      `"${(h.ticketNumber || '').replace(/"/g, '""')}"`,
      h.weightGramsPerUnit ?? 0,
      h.totalWeightGrams ?? 0,
      `"${(h.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lager-Verlauf_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Action badge helpers
  const getActionBadge = (action: string, delta: number) => {
    switch (action) {
      case 'WITHDRAW':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <ArrowDownRight className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>Entnahme ({delta})</span>
          </span>
        );
      case 'ADD':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Zubuchung (+{Math.abs(delta)})</span>
          </span>
        );
      case 'CREATE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <PlusCircle className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
            <span>Neu</span>
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Edit3 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>Geändert</span>
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Trash2 className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
            <span>Gelöscht</span>
          </span>
        );
      default:
        return <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{action}</span>;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-700 border border-indigo-100 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Lager-Verlauf & Buchungsprotokoll
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lückenlose tabellarische Nachverfolgung aller Entnahmen, Mitarbeiter & Ticket-Nummern
            </p>
          </div>
        </div>

        {/* Action Buttons (Export / Print) */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={loadHistory}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition"
            title="Neu laden"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={history.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition border border-indigo-200 dark:border-indigo-800"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Drucken</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Nach Ticket-Nummer, Artikel, Barcode oder Mitarbeiter filtern..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition text-slate-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns / Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Mitarbeiter Filter */}
            <div className="flex items-center space-x-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Alle Mitarbeiter</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Aktions Filter */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Alle Aktionen</option>
                <option value="WITHDRAW">Nur Entnahmen (-)</option>
                <option value="ADD">Nur Zubuchungen (+)</option>
                <option value="CREATE">Neu angelegt</option>
                <option value="UPDATE">Aktualisierungen</option>
                <option value="DELETE">Löschungen</option>
              </select>
            </div>

            {/* Active Ticket Filter Badge */}
            {selectedTicket && (
              <div className="flex items-center space-x-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-800 dark:text-indigo-300">
                <Tag className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Ticket: {selectedTicket}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTicket('')}
                  className="hover:text-indigo-950 dark:hover:text-white ml-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {history.length} {history.length === 1 ? 'Eintrag' : 'Einträge'} protokolliert
          </div>
        </div>
      </div>

      {/* History Records: Responsive View */}
      {/* MOBILE FEED VIEW (< md) */}
      <div className="block md:hidden space-y-3">
        {history.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Keine Buchungseinträge gefunden</p>
            <p className="text-xs text-slate-400">Sobald Buchungen vorgenommen werden, erscheinen sie hier.</p>
          </div>
        ) : (
          history.map((entry) => {
            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
            const formattedTime = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5 shadow-2xs"
              >
                {/* Top Row: User + Action Badge + Time */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 ${
                      entry.userRole === 'admin' ? 'bg-purple-600' : 'bg-indigo-600'
                    }`}>
                      {(entry.userFullName || entry.username || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate block">
                        {entry.userFullName || entry.username}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {getActionBadge(entry.action, entry.quantityChanged)}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formattedTime}
                    </span>
                  </div>
                </div>

                {/* Middle: Product & Location */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                      {entry.productName}
                    </h4>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {entry.barcode}
                    </div>
                    {entry.notes && (
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        „{entry.notes}“
                      </div>
                    )}
                  </div>

                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 shrink-0">
                    {entry.location || '—'}
                  </span>
                </div>

                {/* Bottom Row: Delta / Quantity and Ticket Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-[11px] text-slate-400">Bestand:</span>
                    <span className="text-slate-400 text-xs">{entry.previousQuantity}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{entry.newQuantity} Stk.</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {entry.ticketNumber && (
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(entry.ticketNumber || '')}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      >
                        <Tag className="w-3 h-3 text-indigo-500" />
                        <span>{entry.ticketNumber}</span>
                      </button>
                    )}
                    {entry.totalWeightGrams ? (
                      <span className="text-[10px] font-mono text-slate-500 flex items-center">
                        <Scale className="w-3 h-3 mr-0.5 text-indigo-500" />
                        {entry.totalWeightGrams >= 1000 ? `${(entry.totalWeightGrams / 1000).toFixed(2)} kg` : `${entry.totalWeightGrams} g`}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABULAR VIEW (>= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {history.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Keine Buchungseinträge gefunden</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Sobald Artikel über den Scanner oder die Regale entnommen oder zugebucht werden, erscheint hier das tabellarische Protokoll.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Zeitpunkt</th>
                  <th className="py-3 px-3">Mitarbeiter</th>
                  <th className="py-3 px-3">Aktion</th>
                  <th className="py-3 px-3">Artikel & EAN</th>
                  <th className="py-3 px-2 text-center">Fach</th>
                  <th className="py-3 px-3 text-right">Menge</th>
                  <th className="py-3 px-3 text-right">Bestand</th>
                  <th className="py-3 px-3">Ticket / Grund</th>
                  <th className="py-3 px-3 text-right">Gewicht</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {history.map((entry) => {
                  const date = new Date(entry.timestamp);
                  const formattedDate = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
                  const formattedTime = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                      {/* Zeitpunkt */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                          {formattedTime}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Mitarbeiter */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                            entry.userRole === 'admin' ? 'bg-purple-600' : 'bg-indigo-600'
                          }`}>
                            {(entry.userFullName || entry.username || 'M').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {entry.userFullName || entry.username || 'Mitarbeiter'}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              @{entry.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Aktion */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getActionBadge(entry.action, entry.quantityChanged)}
                      </td>

                      {/* Artikel & EAN */}
                      <td className="py-3 px-3 max-w-[220px]">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate" title={entry.productName}>
                          {entry.productName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {entry.barcode}
                        </div>
                        {entry.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5 truncate" title={entry.notes}>
                            „{entry.notes}“
                          </div>
                        )}
                      </td>

                      {/* Fach */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-slate-600 font-mono">
                          {entry.location || '—'}
                        </span>
                      </td>

                      {/* Menge Änderung */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className={`font-bold font-mono text-xs ${
                          entry.quantityChanged < 0 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : entry.quantityChanged > 0 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-slate-500'
                        }`}>
                          {entry.quantityChanged > 0 ? `+${entry.quantityChanged}` : entry.quantityChanged}
                        </span>
                      </td>

                      {/* Vorher -> Nachher Bestand */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-xs">
                        <span className="text-slate-400">{entry.previousQuantity}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className="font-bold text-slate-900 dark:text-white">{entry.newQuantity}</span>
                      </td>

                      {/* Ticket-Nummer / Grund */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {entry.ticketNumber ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(entry.ticketNumber || '')}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition"
                            title="Nach diesem Ticket filtern"
                          >
                            <Tag className="w-3 h-3 text-indigo-500" />
                            <span>{entry.ticketNumber}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Kein Ticket</span>
                        )}
                      </td>

                      {/* Gewicht */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {entry.totalWeightGrams ? (
                          <span className="flex items-center justify-end text-indigo-700 dark:text-indigo-400 font-semibold">
                            <Scale className="w-3 h-3 mr-1 text-indigo-500" />
                            {entry.totalWeightGrams >= 1000 
                              ? `${(entry.totalWeightGrams / 1000).toFixed(2)} kg` 
                              : `${entry.totalWeightGrams} g`}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
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
  );
}
