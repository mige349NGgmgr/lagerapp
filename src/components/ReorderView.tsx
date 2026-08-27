import { useState } from 'react';
import { Product, getStockStatus } from '../types';
import { 
  ShoppingCart, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  AlertTriangle, 
  AlertCircle,
  Scale, 
  Barcode, 
  Plus, 
  Minus,
  CheckCircle2
} from 'lucide-react';

interface ReorderViewProps {
  products: Product[];
  onOpenQuickEdit?: (product: Product) => void;
}

export function ReorderView({ products }: ReorderViewProps) {
  // Map of custom order quantities per product id
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [filterAll, setFilterAll] = useState(false);

  const lowStockProducts = products.filter(p => {
    const status = getStockStatus(p.quantity, p.minQuantity);
    return status === 'CRITICAL' || status === 'WARNING';
  });
  const displayProducts = filterAll ? products : lowStockProducts;

  // Initialize or get suggested quantity
  const getOrderQty = (p: Product) => {
    if (orderQuantities[p.id] !== undefined) {
      return orderQuantities[p.id];
    }
    // Default suggestion: fill up to 2x minQuantity
    return Math.max(1, (p.minQuantity * 2) - p.quantity);
  };

  const handleQtyChange = (id: string, delta: number) => {
    setOrderQuantities(prev => {
      const current = prev[id] !== undefined ? prev[id] : 1;
      return { ...prev, [id]: Math.max(1, current + delta) };
    });
  };

  // Calculations
  const totalPositions = displayProducts.length;
  const totalItemsCount = displayProducts.reduce((sum, p) => sum + getOrderQty(p), 0);
  const totalWeightGrams = displayProducts.reduce((sum, p) => {
    const qty = getOrderQty(p);
    return sum + (p.weightGrams || 0) * qty;
  }, 0);

  // CSV Export
  const handleExportCSV = () => {
    if (displayProducts.length === 0) return;

    const headers = [
      'Position',
      'Artikelbezeichnung',
      'Barcode / EAN',
      'Lagerfach',
      'Ist-Bestand',
      'Mindestbestand',
      'Status',
      'Bestellmenge',
      'Stückgewicht (g)',
      'Gewicht Gesamt (g)',
      'Kategorie',
      'Notizen'
    ];

    const rows = displayProducts.map((p, idx) => {
      const orderQty = getOrderQty(p);
      const itemWeight = p.weightGrams || 0;
      const status = getStockStatus(p.quantity, p.minQuantity);
      return [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.barcode}"`,
        `"${p.locationLetter}${p.locationNumber}"`,
        p.quantity,
        p.minQuantity,
        status === 'CRITICAL' ? 'KRITISCH (Rot)' : status === 'WARNING' ? 'KNAPP (Orange)' : 'OK',
        orderQty,
        itemWeight,
        itemWeight * orderQty,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        `"${(p.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bestellliste_Lager_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy as formatted table for email
  const handleCopyClipboard = () => {
    if (displayProducts.length === 0) return;

    const lines = [
      `BESTELLLISTE LAGER - ${new Date().toLocaleDateString('de-DE')}`,
      `Gesamt-Positionen: ${totalPositions} | Gesamt-Stückzahl: ${totalItemsCount} Stk.`,
      totalWeightGrams > 0 ? `Gesamt-Liefergewicht ca.: ${(totalWeightGrams / 1000).toFixed(2)} kg` : '',
      '---------------------------------------------------------------------------------',
      'Pos | Artikel | EAN / Barcode | Fach | Ist | Mind. | BESTELLEN',
      '---------------------------------------------------------------------------------',
    ];

    displayProducts.forEach((p, idx) => {
      lines.push(`${idx + 1}. ${p.name} | EAN: ${p.barcode} | Fach: ${p.locationLetter}${p.locationNumber} | Ist: ${p.quantity} | Mind: ${p.minQuantity} | BESTELLEN: ${getOrderQty(p)} Stk.`);
    });

    lines.push('---------------------------------------------------------------------------------');
    lines.push('Erstellt über Lager.App');

    navigator.clipboard.writeText(lines.filter(Boolean).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Top Banner / Summary Card */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Nachbestell- & Einkaufsliste
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {lowStockProducts.length} Artikel fällig
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Artikel mit Mindestbestand direkt als CSV Excel oder Druckliste exportieren
            </p>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyClipboard}
            disabled={displayProducts.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={displayProducts.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={displayProducts.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Drucken</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Positionen</span>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{totalPositions}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bestellmenge Gesamt</span>
          <span className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">{totalItemsCount} Stk.</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Liefergewicht Gesamt</span>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
            {totalWeightGrams >= 1000 
              ? `${(totalWeightGrams / 1000).toFixed(2)} kg` 
              : `${totalWeightGrams} g`}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-center">
          <button
            type="button"
            onClick={() => setFilterAll(!filterAll)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-left"
          >
            {filterAll ? '← Nur fällige Artikel zeigen' : 'Alle Artikel im Lager zeigen →'}
          </button>
        </div>
      </div>

      {/* Reorder Table / List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {displayProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 stroke-[1.75]" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">Alles aufgefüllt!</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Kein Artikel hat aktuell den Mindestbestand unterschritten.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {displayProducts.map((product, idx) => {
              const orderQty = getOrderQty(product);
              const status = getStockStatus(product.quantity, product.minQuantity);
              const isCritical = status === 'CRITICAL';
              const isWarning = status === 'WARNING';
              const unitWeight = product.weightGrams || 0;
              const totalLineWeight = unitWeight * orderQty;

              return (
                <div
                  key={product.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Index, Title, Location, EAN */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-400 w-5 pt-0.5">
                      #{idx + 1}
                    </span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {product.name}
                        </span>
                        {isCritical ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 flex items-center space-x-0.5">
                            <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                            <span>Mindestbestand erreicht (Rot)</span>
                          </span>
                        ) : isWarning ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center space-x-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                            <span>Knapp (Orange)</span>
                          </span>
                        ) : null}
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                          Fach {product.locationLetter}{product.locationNumber}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono flex items-center">
                          <Barcode className="w-3 h-3 mr-1 text-slate-400" />
                          {product.barcode}
                        </span>
                        <span>
                          Ist: <strong className="text-slate-800 dark:text-slate-200 font-mono">{product.quantity}</strong> / Mind: <strong className="text-slate-800 dark:text-slate-200 font-mono">{product.minQuantity}</strong>
                        </span>
                        {unitWeight > 0 && (
                          <span className="font-mono flex items-center text-slate-600 dark:text-slate-400">
                            <Scale className="w-3 h-3 mr-1 text-slate-400" />
                            {unitWeight} g/Stk.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Line Weight */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700">
                    {/* Stepper for Order Quantity */}
                    <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(product.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shadow-2xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center font-bold text-sm text-slate-900 dark:text-white font-mono">
                        {orderQty} Stk.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(product.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total Weight */}
                    {totalLineWeight > 0 && (
                      <div className="text-right min-w-[70px]">
                        <span className="text-[10px] text-slate-400 block uppercase">Gewicht</span>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          {totalLineWeight >= 1000 ? `${(totalLineWeight / 1000).toFixed(2)} kg` : `${totalLineWeight} g`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
