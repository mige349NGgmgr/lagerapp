import React, { useState } from 'react';
import { Product, User } from '../types';
import { api } from '../api';
import { 
  Scale, 
  Tag, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Copy, 
  Check, 
  Search, 
  AlertCircle,
  PackageMinus,
  CheckCircle2,
  X,
  RotateCcw,
  Barcode as BarcodeIcon,
  MapPin
} from 'lucide-react';

interface ShippingCalculatorViewProps {
  products: Product[];
  currentUser?: User | null;
  onStockUpdated?: () => void;
}

interface PackageItem {
  productId: string;
  name: string;
  barcode: string;
  unitWeightGrams: number;
  quantity: number;
  location?: string;
  stockAvailable?: number;
}

export function ShippingCalculatorView({ products, currentUser, onStockUpdated }: ShippingCalculatorViewProps) {
  const [ticketSearch, setTicketSearch] = useState('');
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'package' | 'catalog'>('package');
  
  // Product Catalog Search State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  
  const [copied, setCopied] = useState(false);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');

  // Auto-deduct confirmation modal state
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [isDeducting, setIsDeducting] = useState(false);
  const [deductSuccessMessage, setDeductSuccessMessage] = useState('');

  // Load items from ticket history
  const handleLoadTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticketSearch.trim();
    if (!t) return;

    setIsLoadingTicket(true);
    setTicketError('');
    setTicketSuccess('');

    try {
      const history = await api.getHistory({ ticket: t, action: 'WITHDRAW' });
      if (history.length === 0) {
        setTicketError(`Keine Entnahmen für Ticket "${t}" im Protokoll gefunden.`);
        return;
      }

      // Group withdrawn items for this ticket
      const grouped: Record<string, PackageItem> = {};
      history.forEach(h => {
        const matchingProduct = products.find(p => p.id === h.productId || p.barcode === h.barcode);
        const unitWeight = h.weightGramsPerUnit || matchingProduct?.weightGrams || 0;
        const qty = Math.abs(h.quantityChanged);

        if (grouped[h.productId]) {
          grouped[h.productId].quantity += qty;
        } else {
          grouped[h.productId] = {
            productId: h.productId,
            name: h.productName,
            barcode: h.barcode,
            unitWeightGrams: unitWeight,
            quantity: qty,
            location: matchingProduct ? `${matchingProduct.locationLetter}${matchingProduct.locationNumber}` : undefined,
            stockAvailable: matchingProduct?.quantity
          };
        }
      });

      setPackageItems(Object.values(grouped));
      setTicketSuccess(`${Object.keys(grouped).length} Positionen aus Ticket "${t}" geladen.`);
    } catch (err: any) {
      setTicketError('Fehler beim Abrufen der Ticketdaten.');
    } finally {
      setIsLoadingTicket(false);
    }
  };

  const handleAddProductFromCatalog = (prod: Product) => {
    setPackageItems(prev => {
      const existing = prev.find(i => i.productId === prod.id);
      if (existing) {
        return prev.map(i => i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: prod.id,
        name: prod.name,
        barcode: prod.barcode,
        unitWeightGrams: prod.weightGrams || 0,
        quantity: 1,
        location: `${prod.locationLetter || 'A'}${prod.locationNumber || 1}`,
        stockAvailable: prod.quantity
      }];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setPackageItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleUpdateUnitWeight = (productId: string, weight: number) => {
    setPackageItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, unitWeightGrams: Math.max(0, weight) };
      }
      return item;
    }));
  };

  const handleRemoveItem = (productId: string) => {
    setPackageItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleClearAll = () => {
    if (packageItems.length > 0 && window.confirm('Möchtest du die Packliste wirklich leeren?')) {
      setPackageItems([]);
      setTicketSuccess('');
      setTicketError('');
    }
  };

  // Pure Weight Calculations
  const totalNetWeightGrams = packageItems.reduce((sum, i) => sum + (i.unitWeightGrams * i.quantity), 0);
  const totalItemCount = packageItems.reduce((sum, i) => sum + i.quantity, 0);

  const copyDataToClipboard = () => {
    const lines = [
      `VERSAND- & GEWICHTSÜBERSICHT - ${new Date().toLocaleDateString('de-DE')}`,
      ticketSearch ? `Ticket-Referenz: ${ticketSearch}` : 'Ticket-Referenz: Direktversand',
      `Gesamtgewicht: ${(totalNetWeightGrams / 1000).toFixed(2)} kg (${totalNetWeightGrams} g)`,
      `Gesamtanzahl Positionen: ${totalItemCount} Stück (${packageItems.length} verschiedene Artikel)`,
      '------------------------------------------------------------',
      'Packliste:',
      ...packageItems.map(i => {
        const lineWeight = i.unitWeightGrams * i.quantity;
        return `- ${i.quantity}x ${i.name} [Fach: ${i.location || '—'}] (EAN: ${i.barcode}) | Einzel: ${i.unitWeightGrams} g | Gesamt: ${lineWeight} g`;
      }),
      '------------------------------------------------------------'
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmDeductAndCopy = async (alsoDeductStock: boolean) => {
    copyDataToClipboard();

    if (!alsoDeductStock) {
      setIsDeductModalOpen(false);
      return;
    }

    setIsDeducting(true);
    try {
      const ticket = ticketSearch.trim() || 'VERSAND-PACKLISTE';
      const actorUser: User = currentUser || {
        id: 'usr_shipping',
        username: 'versand',
        name: 'Versand-Mitarbeiter',
        role: 'employee'
      };

      for (const item of packageItems) {
        await api.recordStockMovement(
          item.productId,
          -Math.abs(item.quantity),
          actorUser,
          ticket,
          `Aus Versand-Packrechner gebucht (${ticket})`
        );
      }

      if (onStockUpdated) {
        onStockUpdated();
      }

      setDeductSuccessMessage(`Erfolgreich: ${totalItemCount} Artikel wurden mit Ticket "${ticket}" aus dem Lagerbestand abgebucht!`);
      setTimeout(() => {
        setDeductSuccessMessage('');
        setIsDeductModalOpen(false);
      }, 2500);
    } catch (err: any) {
      alert('Fehler beim automatischen Ausbuchen der Artikel.');
    } finally {
      setIsDeducting(false);
    }
  };

  // Filter Catalog for adding items
  const catalogCategories = ['ALL', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const filteredCatalog = products.filter(p => {
    const term = catalogSearch.toLowerCase();
    const matchesTerm = !term || p.name.toLowerCase().includes(term) || p.barcode.toLowerCase().includes(term) || `${p.locationLetter}${p.locationNumber}`.toLowerCase().includes(term);
    const matchesCat = catalogCategory === 'ALL' || p.category === catalogCategory;
    return matchesTerm && matchesCat;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-700 border border-indigo-100 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Paket- & Versand-Gewichtsrechner
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Artikel nach Ticket oder Katalog zusammenstellen & exaktes Gesamtgewicht ermitteln
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          {packageItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-xl transition"
              title="Packliste leeren"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            disabled={packageItems.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Drucken</span>
          </button>

          <button
            type="button"
            onClick={copyDataToClipboard}
            disabled={packageItems.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Kopiert!' : 'Paketdaten kopieren'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Mode Switcher (Visible only on mobile < lg) */}
      <div className="flex lg:hidden bg-slate-200 dark:bg-slate-700/60 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMobileTab('package')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
            mobileTab === 'package'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Packliste & Gewicht</span>
          {packageItems.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-full font-bold">
              {packageItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
            mobileTab === 'catalog'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Artikel wählen / Ticket</span>
        </button>
      </div>

      {/* Main Grid: Left = Ticket Loader & Article Catalog, Right = Pure Weight Table & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Ticket Loader + Fast Catalog Selection (5 cols) */}
        <div className={`${mobileTab === 'catalog' ? 'block' : 'hidden lg:block'} lg:col-span-5 space-y-4`}>
          {/* 1. Ticket Loader */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Ticket-Nummer laden</span>
            </div>

            <form onSubmit={handleLoadTicket} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ticket-Nr. (z.B. TICK-2026-042)"
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono font-bold"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value.toUpperCase())}
                />
                <button
                  type="submit"
                  disabled={isLoadingTicket || !ticketSearch.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shrink-0"
                >
                  {isLoadingTicket ? 'Lade...' : 'Laden'}
                </button>
              </div>
            </form>

            {ticketError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{ticketError}</span>
              </div>
            )}

            {ticketSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{ticketSuccess}</span>
              </div>
            )}
          </div>

          {/* 2. Catalog Search & Direct Add */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Artikel aus Lager hinzufügen
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {products.length} Artikel
              </span>
            </div>

            <div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Artikel, EAN oder Fach (z.B. B2)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            {catalogCategories.length > 2 && (
              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
                {catalogCategories.slice(0, 5).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategory(cat || 'ALL')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 transition ${
                      catalogCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'Alle' : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Fast Product Pick List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 border border-slate-100 dark:border-slate-700 rounded-xl">
              {filteredCatalog.slice(0, 20).map(prod => {
                const isSelected = packageItems.some(i => i.productId === prod.id);
                const weight = prod.weightGrams || 0;
                const loc = `${prod.locationLetter || 'A'}${prod.locationNumber || 1}`;

                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      handleAddProductFromCatalog(prod);
                      setMobileTab('package');
                    }}
                    className={`p-2.5 flex items-center justify-between hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 cursor-pointer transition ${
                      isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300">
                          {loc}
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {prod.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono">{prod.barcode}</span>
                        {weight > 0 && (
                          <span>• {weight >= 1000 ? `${(weight/1000).toFixed(2)} kg` : `${weight} g`}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg transition"
                      title="Zur Packliste hinzufügen"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Pure Weight Summary & Detailed Items Table (7 cols) */}
        <div className={`${mobileTab === 'package' ? 'block' : 'hidden lg:block'} lg:col-span-7 space-y-4`}>
          {/* Big Pure Weight Card (No packaging, pure weight overview) */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-indigo-200 font-bold flex items-center">
                <Scale className="w-4 h-4 mr-1.5 text-indigo-300" />
                Ermitteltes Gesamtgewicht
              </span>
              <span className="text-xs text-indigo-200 font-mono">
                {packageItems.length} {packageItems.length === 1 ? 'Artikel' : 'Artikel'} ({totalItemCount} Stück)
              </span>
            </div>

            <div className="flex items-baseline space-x-3">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {(totalNetWeightGrams / 1000).toFixed(2)} kg
              </span>
              <span className="text-lg font-mono text-indigo-200">
                ({totalNetWeightGrams.toLocaleString('de-DE')} Gramm)
              </span>
            </div>

            <div className="pt-3 border-t border-indigo-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-indigo-200 font-medium">
                {ticketSearch ? (
                  <span>Referenz-Ticket: <strong className="text-white font-mono">{ticketSearch}</strong></span>
                ) : (
                  <span>Direktversand ohne Ticketreferenz</span>
                )}
              </div>

              {packageItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsDeductModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center space-x-1.5 transition text-xs shadow-xs"
                >
                  <PackageMinus className="w-3.5 h-3.5" />
                  <span>Jetzt aus Lager ausbuchen</span>
                </button>
              )}
            </div>
          </div>

          {/* Packliste Tabelle */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Packliste & Einzelgewichte
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {totalItemCount} Stk. gesamt
              </span>
            </div>

            {packageItems.length === 0 ? (
              <div className="p-8 sm:p-10 text-center text-slate-400 space-y-2">
                <Scale className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Noch keine Artikel in der Packliste</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Lade ein Ticket oder wähle Artikel links aus dem Lagerkatalog aus, um das genaue Gewicht zu berechnen.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards (< md) */}
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                  {packageItems.map((item) => {
                    const lineTotal = item.unitWeightGrams * item.quantity;
                    return (
                      <div key={item.productId} className="p-3.5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5 mb-1">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {item.location || '—'}
                              </span>
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {item.name}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              {item.barcode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title="Entfernen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Controls: Quantity Stepper + Weight Input */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          {/* Stepper with comfortable touch targets */}
                          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, -1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {item.quantity} Stk.
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.productId, 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Unit Weight + Total */}
                          <div className="text-right">
                            <div className="inline-flex items-center space-x-1 justify-end">
                              <span className="text-[10px] text-slate-400">je</span>
                              <input
                                type="number"
                                min="0"
                                value={item.unitWeightGrams || ''}
                                onChange={(e) => handleUpdateUnitWeight(item.productId, parseInt(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                              />
                              <span className="text-[10px] text-slate-400">g</span>
                            </div>
                            <div className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                              = {lineTotal >= 1000 ? `${(lineTotal / 1000).toFixed(2)} kg` : `${lineTotal} g`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Fach</th>
                        <th className="py-2.5 px-3">Artikel & EAN</th>
                        <th className="py-2.5 px-3 text-center">Menge</th>
                        <th className="py-2.5 px-3 text-right">Stückgewicht (inkl. OVP)</th>
                        <th className="py-2.5 px-3 text-right">Zeilengewicht</th>
                        <th className="py-2.5 px-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                      {packageItems.map((item) => {
                        const lineTotal = item.unitWeightGrams * item.quantity;

                        return (
                          <tr key={item.productId} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/50">
                            {/* Fach */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {item.location || '—'}
                              </span>
                            </td>

                            {/* Artikel & EAN */}
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[200px]" title={item.name}>
                                {item.name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {item.barcode}
                              </div>
                            </td>

                            {/* Menge Stepper */}
                            <td className="py-2.5 px-3 whitespace-nowrap text-center">
                              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(item.productId, -1)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 font-mono font-bold text-xs text-slate-900 dark:text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(item.productId, 1)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Stückgewicht Input */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono text-xs">
                              <div className="inline-flex items-center space-x-1 justify-end">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.unitWeightGrams || ''}
                                  onChange={(e) => handleUpdateUnitWeight(item.productId, parseInt(e.target.value) || 0)}
                                  className="w-16 px-1.5 py-0.5 text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                />
                                <span className="text-[10px] text-slate-400">g</span>
                              </div>
                            </td>

                            {/* Zeilengewicht */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {lineTotal >= 1000 ? `${(lineTotal / 1000).toFixed(2)} kg` : `${lineTotal} g`}
                            </td>

                            {/* Entfernen Button */}
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.productId)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Aus Liste entfernen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Deduct Confirmation Modal */}
      {isDeductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <PackageMinus className="w-5 h-5" />
                <h3 className="font-bold text-base">Artikel aus Lager ausbuchen</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeductModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {deductSuccessMessage ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{deductSuccessMessage}</span>
                </div>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Möchtest du die <strong className="text-slate-900 dark:text-white">{totalItemCount} Artikel</strong> dieser Packliste jetzt automatisch aus dem Lagerbestand abbuchen und im Verlauf protokollieren?
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Ticket-Nummer:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">{ticketSearch || 'VERSAND-PACKLISTE'}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Gesamtgewicht:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">{(totalNetWeightGrams / 1000).toFixed(2)} kg ({totalNetWeightGrams} g)</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmDeductAndCopy(false)}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition"
                    >
                      Nur Daten kopieren
                    </button>
                    <button
                      type="button"
                      disabled={isDeducting}
                      onClick={() => handleConfirmDeductAndCopy(true)}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs transition shadow-xs flex items-center justify-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isDeducting ? 'Buche aus...' : 'Jetzt ausbuchen & kopieren'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
