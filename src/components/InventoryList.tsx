import { useState } from 'react';
import { Product, User, getStockStatus } from '../types';
import { 
  Search, 
  AlertTriangle, 
  AlertCircle,
  Edit2, 
  Trash2, 
  Plus, 
  X, 
  Copy, 
  Check, 
  Filter, 
  Scale, 
  PackageMinus,
  Barcode as BarcodeIcon,
  Tag
} from 'lucide-react';

interface InventoryListProps {
  products: Product[];
  currentUser?: User | null;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onOpenMovement?: (product: Product, initialType?: 'WITHDRAW' | 'ADD') => void;
  onQuickQuantityChange?: (productId: string, delta: number) => void;
}

export function InventoryList({ 
  products, 
  currentUser, 
  onEdit, 
  onDelete, 
  onOpenMovement 
}: InventoryListProps) {
  const [search, setSearch] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState<'ALL' | 'WARNING' | 'CRITICAL'>('ALL');
  const [selectedColumnFilter, setSelectedColumnFilter] = useState<string>('ALL');
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);

  const criticalCount = products.filter(p => getStockStatus(p.quantity, p.minQuantity) === 'CRITICAL').length;
  const warningCount = products.filter(p => getStockStatus(p.quantity, p.minQuantity) === 'WARNING').length;

  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    const loc = `${p.locationLetter || 'A'}${p.locationNumber || 1}`.toLowerCase();
    const matchesSearch = 
      !term ||
      p.name.toLowerCase().includes(term) || 
      p.barcode.toLowerCase().includes(term) ||
      loc.includes(term) ||
      (p.serialNumber && p.serialNumber.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.notes && p.notes.toLowerCase().includes(term));

    const status = getStockStatus(p.quantity, p.minQuantity);
    const matchesStock = 
      filterStockStatus === 'ALL' ||
      (filterStockStatus === 'CRITICAL' && status === 'CRITICAL') ||
      (filterStockStatus === 'WARNING' && (status === 'WARNING' || status === 'CRITICAL'));

    const matchesColumn = selectedColumnFilter === 'ALL' || (p.locationLetter || 'A') === selectedColumnFilter;

    return matchesSearch && matchesStock && matchesColumn;
  });

  const handleCopyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedBarcode(barcode);
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  const columns = ['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
        {/* Search Input with clean placeholder */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Artikel, EAN-Barcode, Regalfach (z.B. A1) suchen..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm transition text-slate-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Chips (All vs Critical Red vs Warning Orange + Spalten) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterStockStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 ${
                filterStockStatus === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Alle ({products.length})
            </button>

            {/* Mindestbestand erreicht (ROT) */}
            <button
              type="button"
              onClick={() => setFilterStockStatus('CRITICAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1 transition shrink-0 ${
                filterStockStatus === 'CRITICAL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : criticalCount > 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              <span>Unter Mindestb. ({criticalCount})</span>
            </button>

            {/* Bestand knapp (ORANGE) */}
            {warningCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterStockStatus('WARNING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1 transition shrink-0 ${
                  filterStockStatus === 'WARNING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                <span>Knapp ({warningCount})</span>
              </button>
            )}
          </div>

          {/* Spalten-Filter A-H */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
            {columns.map(col => (
              <button
                key={col}
                type="button"
                onClick={() => setSelectedColumnFilter(col)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition shrink-0 ${
                  selectedColumnFilter === col
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {col === 'ALL' ? 'Alle Fächer' : col}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE CARDS VIEW (Visible on mobile screens < md) */}
      <div className="block md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-2">
            <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">Keine Artikel gefunden</p>
            <p className="text-xs text-slate-400">Passe die Suchbegriffe oder Filter an.</p>
          </div>
        ) : (
          filtered.map((product) => {
            const status = getStockStatus(product.quantity, product.minQuantity);
            const isCritical = status === 'CRITICAL';
            const isWarning = status === 'WARNING';
            const loc = `${product.locationLetter || 'A'}${product.locationNumber || 1}`;
            const weight = product.weightGrams || 0;

            return (
              <div
                key={product.id}
                className={`rounded-2xl p-4 border transition shadow-xs space-y-3 ${
                  isCritical
                    ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                    : isWarning
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Header: Fach Badge + Name + Stock status */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                    <span className="shrink-0 px-2.5 py-1 rounded-xl font-mono font-black text-xs bg-indigo-600 text-white shadow-2xs">
                      {loc}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                        {product.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {product.category && (
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {product.category}
                          </span>
                        )}
                        {product.serialNumber && (
                          <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded">
                            SN: {product.serialNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit & Delete (Top Right) */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {(!currentUser?.permissions || currentUser.permissions.canManageInventory !== false) && (
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                        title="Bearbeiten"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {(!currentUser || currentUser.role === 'admin' || currentUser.permissions?.canDeleteProducts) && (
                      <button
                        type="button"
                        onClick={() => onDelete(product.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-xl transition"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* EAN Barcode & Weight Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopyBarcode(product.barcode)}
                    className="inline-flex items-center space-x-1.5 font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg transition active:scale-95"
                  >
                    <BarcodeIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{product.barcode}</span>
                    {copiedBarcode === product.barcode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 inline" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400 opacity-60 inline" />
                    )}
                  </button>

                  {weight > 0 && (
                    <span className="font-mono text-slate-600 dark:text-slate-400 flex items-center">
                      <Scale className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                      {weight >= 1000 ? `${(weight / 1000).toFixed(2)} kg` : `${weight} g`}
                    </span>
                  )}
                </div>

                {/* Stock Level Display */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lagerbestand</span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className={`text-base font-black font-mono ${
                        isCritical
                          ? 'text-rose-600 dark:text-rose-400'
                          : isWarning
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-white'
                      }`}>
                        {product.quantity} Stk.
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (Min: {product.minQuantity})
                      </span>
                    </div>
                  </div>

                  {isCritical ? (
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-lg flex items-center">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      Unter Mindestb.
                    </span>
                  ) : isWarning ? (
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Auf Mindestb.
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      Bestand OK
                    </span>
                  )}
                </div>

                {/* Big Direct Action Buttons for Mobile */}
                {onOpenMovement && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenMovement(product, 'WITHDRAW')}
                      className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-98 shadow-2xs"
                    >
                      <PackageMinus className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      <span>Entnehmen</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => onOpenMovement(product, 'ADD')}
                      className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-98 shadow-2xs"
                    >
                      <Plus className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Zubuchen</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (Visible on md and larger) */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">Keine Artikel gefunden</p>
            <p className="text-xs text-slate-400">
              Passe die Suchbegriffe oder die Filteroptionen an.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-3 text-center w-16">Fach</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Artikel & Beschreibung</th>
                  <th className="py-3.5 px-3 min-w-[140px]">Barcode (EAN)</th>
                  <th className="py-3.5 px-3 text-right">Gewicht</th>
                  <th className="py-3.5 px-3 text-right">Mindestb.</th>
                  <th className="py-3.5 px-4 text-right">Lagerbestand</th>
                  <th className="py-3.5 px-4 text-center min-w-[240px]">Aktionen & Buchung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {filtered.map((product) => {
                  const status = getStockStatus(product.quantity, product.minQuantity);
                  const isCritical = status === 'CRITICAL'; // < minQuantity (Red)
                  const isWarning = status === 'WARNING';   // == minQuantity (Orange)
                  const loc = `${product.locationLetter || 'A'}${product.locationNumber || 1}`;
                  const weight = product.weightGrams || 0;

                  // Row background styling: slight tint for critical / warning
                  const rowBg = isCritical
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/30'
                    : isWarning
                      ? 'bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-50/60 dark:hover:bg-amber-950/25'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/50';

                  return (
                    <tr key={product.id} className={`transition-colors ${rowBg}`}>
                      {/* 1. Fach */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg font-black text-xs bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 font-mono shadow-2xs">
                          {loc}
                        </span>
                      </td>

                      {/* 2. Artikel & Beschreibung / Tags */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
                          {product.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {product.serialNumber && (
                            <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-1.5 py-0.2 rounded">
                              SN: {product.serialNumber}
                            </span>
                          )}
                          {product.category && (
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.2 rounded-full">
                              {product.category}
                            </span>
                          )}
                          {product.notes && (
                            <span className="text-[10px] text-slate-400 italic truncate max-w-[200px]" title={product.notes}>
                              „{product.notes}“
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Barcode (EAN) mit 1-Klick Kopie */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCopyBarcode(product.barcode)}
                          className="inline-flex items-center space-x-1 font-mono text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-700/80 px-2 py-1 rounded-md transition group"
                          title="Barcode kopieren"
                        >
                          <BarcodeIcon className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                          <span>{product.barcode}</span>
                          {copiedBarcode === product.barcode ? (
                            <Check className="w-3 h-3 text-emerald-600 inline ml-1" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 inline ml-0.5 opacity-60" />
                          )}
                        </button>
                      </td>

                      {/* 4. Gewicht */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-xs">
                        {weight > 0 ? (
                          <span className="inline-flex items-center text-slate-700 dark:text-slate-300">
                            <Scale className="w-3 h-3 mr-1 text-indigo-500 shrink-0" />
                            {weight >= 1000 ? `${(weight / 1000).toFixed(2)} kg` : `${weight} g`}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* 5. Mindestbestand */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                        {product.minQuantity} Stk.
                      </td>

                      {/* 6. Lagerbestand mit strikter Farbkodierung */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                        <div className="flex flex-col items-end">
                          <span className={`font-black text-sm sm:text-base ${
                            isCritical
                              ? 'text-rose-600 dark:text-rose-400'
                              : isWarning
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                          }`}>
                            {product.quantity} Stk.
                          </span>
                          {isCritical ? (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center">
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                              Unter Mindestbestand
                            </span>
                          ) : isWarning ? (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center">
                              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                              Auf Mindestbestand
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* 7. Aktionen: Nur Entnehmen & Zubuchen (keine Minus/Plus Stepper auf Basisbestand) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Entnehmen Button -> öffnet Entnahmefenster mit Ticket */}
                          {onOpenMovement && (
                            <button
                              type="button"
                              onClick={() => onOpenMovement(product, 'WITHDRAW')}
                              className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold transition active:scale-95 shadow-2xs"
                              title="Artikel entnehmen (mit Ticket-Nummer)"
                            >
                              <PackageMinus className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                              <span>Entnehmen</span>
                            </button>
                          )}

                          {/* Zubuchen Button -> öffnet Zubuchungsfenster */}
                          {onOpenMovement && (
                            <button
                              type="button"
                              onClick={() => onOpenMovement(product, 'ADD')}
                              className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition active:scale-95 shadow-2xs"
                              title="Bestand zubuchen"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                              <span>Zubuchen</span>
                            </button>
                          )}

                          {/* Bearbeiten Button */}
                          {(!currentUser?.permissions || currentUser.permissions.canManageInventory !== false) && (
                            <button
                              type="button"
                              onClick={() => onEdit(product)}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Artikeldaten bearbeiten"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Löschen Button */}
                          {(!currentUser || currentUser.role === 'admin' || currentUser.permissions?.canDeleteProducts) && (
                            <button
                              type="button"
                              onClick={() => onDelete(product.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Artikel löschen"
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
        )}
      </div>
    </div>
  );
}
