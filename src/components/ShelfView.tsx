import React, { useState } from 'react';
import { Product, getStockStatus } from '../types';
import { 
  Package, 
  Plus, 
  Minus, 
  Edit2, 
  AlertTriangle, 
  AlertCircle,
  ChevronRight, 
  Layers, 
  LayoutGrid,
  PackageMinus
} from 'lucide-react';

interface ShelfViewProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onAddNewToLocation?: (locationLetter: string, locationNumber: number) => void;
  onQuickQuantityChange?: (productId: string, delta: number) => void;
  onOpenMovement?: (product: Product, initialType?: 'WITHDRAW' | 'ADD') => void;
}

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROWS = [1, 2, 3, 4, 5];

export function ShelfView({ 
  products, 
  onEdit, 
  onAddNewToLocation, 
  onQuickQuantityChange,
  onOpenMovement 
}: ShelfViewProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>('A1');
  const [mobileMode, setMobileMode] = useState<'columns' | 'grid'>('columns');
  const [activeColumn, setActiveColumn] = useState<string>('A');

  // Map products by shelf location (e.g. "A1", "B2")
  const locationMap = new Map<string, Product[]>();
  let criticalCount = 0;
  let warningCount = 0;
  let occupiedCount = 0;

  products.forEach(p => {
    const letter = (p.locationLetter || 'A').toUpperCase();
    const number = p.locationNumber || 1;
    const key = `${letter}${number}`;
    if (!locationMap.has(key)) locationMap.set(key, []);
    locationMap.get(key)!.push(p);

    const status = getStockStatus(p.quantity, p.minQuantity);
    if (status === 'CRITICAL') {
      criticalCount++;
    } else if (status === 'WARNING') {
      warningCount++;
    }
  });

  COLUMNS.forEach(c => {
    ROWS.forEach(r => {
      const items = locationMap.get(`${c}${r}`);
      if (items && items.length > 0) occupiedCount++;
    });
  });

  const selectedProducts = selectedCell ? locationMap.get(selectedCell) || [] : [];
  const selectedLetter = selectedCell ? selectedCell.charAt(0) : 'A';
  const selectedNumber = selectedCell ? parseInt(selectedCell.slice(1)) || 1 : 1;

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Top Stats Banner: Compact on Mobile, Full Grid on Desktop */}
      <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
              <span className="text-slate-400 font-normal">Fächer:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">{occupiedCount}</span>
              <span className="text-slate-400 font-normal">/ 40 belegt</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
              <span className="text-slate-400 font-normal">Artikel:</span>
              <span className="font-mono font-black">{products.length}</span>
              <span className="text-slate-400 font-normal">Pos.</span>
            </div>
          </div>

          {(criticalCount > 0 || warningCount > 0) && (
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />
                  {criticalCount} unter Mindestb.
                </span>
              )}
              {warningCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  {warningCount} knapp
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile View Switcher (Säulen vs 8x5 Raster) */}
      <div className="flex sm:hidden items-center bg-slate-200/80 dark:bg-slate-700/80 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMobileMode('columns')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
            mobileMode === 'columns' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Säulen-Ansicht</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMode('grid')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
            mobileMode === 'grid' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>8×5 Regal-Raster</span>
        </button>
      </div>

      {/* MOBILE MODE: Direct Säulen View with in-place shelf cards */}
      <div className={`${mobileMode === 'columns' ? 'block sm:hidden' : 'hidden'} space-y-3`}>
        {/* Horizontal Column Selectors A-H */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {COLUMNS.map(col => {
            let colItemCount = 0;
            let colHasCritical = false;
            let colHasWarning = false;
            ROWS.forEach(r => {
              const items = locationMap.get(`${col}${r}`) || [];
              colItemCount += items.length;
              items.forEach(p => {
                const s = getStockStatus(p.quantity, p.minQuantity);
                if (s === 'CRITICAL') colHasCritical = true;
                if (s === 'WARNING') colHasWarning = true;
              });
            });

            const isActive = activeColumn === col;

            return (
              <button
                key={col}
                type="button"
                onClick={() => {
                  setActiveColumn(col);
                  setSelectedCell(`${col}1`);
                }}
                className={`relative px-3.5 py-1.5 rounded-xl font-bold text-xs flex flex-col items-center min-w-[62px] transition shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 active:scale-95'
                }`}
              >
                <span>Spalte {col}</span>
                <span className={`text-[10px] font-normal ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-400'}`}>
                  {colItemCount} {colItemCount === 1 ? 'Art.' : 'Art.'}
                </span>
                {colHasCritical ? (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                ) : colHasWarning ? (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* The 5 Shelf Levels for the Active Column (A1 to A5) */}
        <div className="space-y-3">
          {ROWS.map(row => {
            const cellId = `${activeColumn}${row}`;
            const cellProducts = locationMap.get(cellId) || [];
            const hasCritical = cellProducts.some(p => getStockStatus(p.quantity, p.minQuantity) === 'CRITICAL');
            const hasWarning = cellProducts.some(p => getStockStatus(p.quantity, p.minQuantity) === 'WARNING');

            return (
              <div
                key={cellId}
                className={`rounded-2xl border transition shadow-2xs overflow-hidden ${
                  hasCritical
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20'
                    : hasWarning
                      ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                {/* Level Header Bar */}
                <div className="p-3 bg-slate-50/90 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2.5 py-1 rounded-xl font-mono font-black text-xs bg-indigo-600 text-white shadow-2xs">
                      {cellId}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ebene {row} {row === 1 ? '(Ganz oben)' : row === 5 ? '(Ganz unten)' : ''}
                    </span>
                  </div>

                  {onAddNewToLocation && (
                    <button
                      type="button"
                      onClick={() => onAddNewToLocation(activeColumn, row)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 rounded-lg transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Einlagern</span>
                    </button>
                  )}
                </div>

                {/* Items in this shelf level */}
                {cellProducts.length === 0 ? (
                  <div className="p-4 text-center">
                    <span className="text-xs text-slate-400">Fach {cellId} ist noch leer.</span>
                  </div>
                ) : (
                  <div className="p-3 space-y-2.5">
                    {cellProducts.map(product => {
                      const status = getStockStatus(product.quantity, product.minQuantity);
                      const isCritical = status === 'CRITICAL';
                      const isWarning = status === 'WARNING';

                      return (
                        <div
                          key={product.id}
                          className={`p-3 rounded-xl border transition space-y-2.5 ${
                            isCritical
                              ? 'bg-rose-50/70 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800'
                              : isWarning
                                ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                                : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                                {product.name}
                              </h4>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>{product.barcode}</span>
                                {product.category && (
                                  <>
                                    <span>•</span>
                                    <span>{product.category}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onEdit(product)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                              title="Bearbeiten"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quantity and Status */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">Bestand:</span>
                              <span className={`font-mono font-black text-xs ${
                                isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-900 dark:text-white'
                              }`}>
                                {product.quantity} Stk.
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                (Min: {product.minQuantity})
                              </span>
                            </div>

                            {isCritical ? (
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded">
                                Mindestbestand!
                              </span>
                            ) : isWarning ? (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                                Knapp
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                OK
                              </span>
                            )}
                          </div>

                          {/* Fast Action Buttons: Entnehmen & Zubuchen */}
                          {onOpenMovement && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => onOpenMovement(product, 'WITHDRAW')}
                                className="py-2 px-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-98 shadow-2xs"
                              >
                                <PackageMinus className="w-3.5 h-3.5 text-white" />
                                <span>Entnehmen</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenMovement(product, 'ADD')}
                                className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-98 shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5 text-white" />
                                <span>Zubuchen</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL 8x5 RASTER */}
      <div className={`${mobileMode === 'grid' ? 'block' : 'hidden sm:block'} bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden`}>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">8×5 Regal-Gitter</h3>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>Rot = Mindestbestand erreicht</span>
            </div>
            <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Orange = Knapp</span>
            </div>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="min-w-[620px] sm:min-w-full">
            {/* Header Columns A to H */}
            <div className="grid grid-cols-[28px_repeat(8,1fr)] gap-2 mb-2">
              <div className="w-7"></div>
              {COLUMNS.map(c => (
                <div 
                  key={c} 
                  className={`text-center font-bold text-xs sm:text-sm uppercase py-1 rounded-md transition ${
                    activeColumn === c ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-700 font-black' : 'text-slate-400'
                  }`}
                >
                  {c}
                </div>
              ))}
            </div>

            {/* Grid Rows 1 to 5 */}
            <div className="bg-slate-100/70 dark:bg-slate-900/60 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-[28px_repeat(8,1fr)] gap-2 items-center">
              {ROWS.map(row => (
                <React.Fragment key={row}>
                  {/* Row Indicator */}
                  <div className="flex items-center justify-center font-bold text-slate-400 text-xs sm:text-sm h-full">
                    {row}
                  </div>

                  {/* 8 Columns for this row */}
                  {COLUMNS.map(col => {
                    const cellId = `${col}${row}`;
                    const cellProducts = locationMap.get(cellId) || [];
                    const isSelected = selectedCell === cellId;
                    const hasCritical = cellProducts.some(p => getStockStatus(p.quantity, p.minQuantity) === 'CRITICAL');
                    const hasWarning = cellProducts.some(p => getStockStatus(p.quantity, p.minQuantity) === 'WARNING');
                    const totalQty = cellProducts.reduce((sum, p) => sum + p.quantity, 0);

                    return (
                      <button
                        key={cellId}
                        type="button"
                        onClick={() => {
                          setSelectedCell(cellId);
                          setActiveColumn(col);
                        }}
                        className={`
                          relative aspect-square rounded-lg border-2 transition flex flex-col items-center justify-between p-1.5
                          ${isSelected 
                            ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/70 shadow-md ring-2 ring-indigo-400/30 scale-102 z-10' 
                            : hasCritical
                              ? 'border-rose-400 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40 hover:border-rose-500'
                              : hasWarning
                                ? 'border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/30 hover:border-amber-500'
                                : cellProducts.length > 0
                                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'
                                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 text-slate-300 dark:text-slate-600'
                          }
                        `}
                      >
                        {/* Cell Tag */}
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-bold ${
                            isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-400'
                          }`}>
                            {cellId}
                          </span>
                          {hasCritical ? (
                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" title="Mindestbestand erreicht (Rot)" />
                          ) : hasWarning ? (
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" title="Bestand knapp (Orange)" />
                          ) : null}
                        </div>

                        {/* Cell Content Icon & Quantity */}
                        {cellProducts.length > 0 ? (
                          <div className="flex flex-col items-center justify-center my-auto">
                            <Package className={`w-4 h-4 sm:w-5 sm:h-5 ${
                              hasCritical 
                                ? 'text-rose-500' 
                                : hasWarning 
                                  ? 'text-amber-500' 
                                  : 'text-indigo-500 dark:text-indigo-400'
                            }`} />
                            <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 leading-none mt-1">
                              {totalQty} <span className="text-[8px] font-normal text-slate-400">Stk</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-600 font-medium my-auto">—</span>
                        )}

                        {/* Bottom product count pill */}
                        {cellProducts.length > 1 && (
                          <span className="text-[8px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1 rounded-sm">
                            {cellProducts.length} Art.
                          </span>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SELECTED CELL DETAILS (Visible on desktop or when in 8x5 grid mode) */}
      {selectedCell && (
        <div className={`${mobileMode === 'columns' ? 'hidden sm:block' : 'block'} bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 animate-in fade-in duration-200`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                {selectedCell}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center space-x-2">
                  <span>Regalfach {selectedCell}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {selectedProducts.length} {selectedProducts.length === 1 ? 'Position' : 'Positionen'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Spalte {selectedLetter}, Ebene {selectedNumber}
                </p>
              </div>
            </div>

            {/* Quick Add To This Shelf Button */}
            {onAddNewToLocation && (
              <button
                type="button"
                onClick={() => onAddNewToLocation(selectedLetter, selectedNumber)}
                className="flex items-center justify-center space-x-1.5 py-2 px-3.5 bg-indigo-50 dark:bg-slate-700 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm rounded-xl transition self-stretch sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Produkt in Fach {selectedCell} legen</span>
              </button>
            )}
          </div>

          {/* Product list in selected cell */}
          {selectedProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 flex items-center justify-center mx-auto mb-2.5">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Dieses Regalfach ist derzeit leer</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Klicke auf den Button oben, um einen Artikel hier einzulagern.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-4">
              {selectedProducts.map(product => {
                const status = getStockStatus(product.quantity, product.minQuantity);
                const isCritical = status === 'CRITICAL';
                const isWarning = status === 'WARNING';

                return (
                    <div
                      key={product.id}
                      className={`rounded-2xl p-4 border transition flex flex-col justify-between space-y-3.5 ${
                        isCritical
                          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40 shadow-xs'
                          : isWarning
                            ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/30 shadow-xs' 
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
                      }`}
                    >
                      {/* Card Header: Product Name, EAN, and Edit/Status Badges */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                            {product.name}
                          </div>
                          <div className="flex items-center space-x-1 shrink-0">
                            {isCritical ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                                Min: {product.minQuantity} (Rot)
                              </span>
                            ) : isWarning ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                Min: {product.minQuantity} (Orange)
                              </span>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => onEdit(product)}
                              className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Artikeldaten bearbeiten"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {product.barcode}
                        </div>

                        {product.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1">
                            „{product.notes}“
                          </div>
                        )}
                      </div>

                      {/* Stock & Meta Row */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Lagerbestand:</span>
                          <span className={`font-black text-sm ${
                            isCritical 
                              ? 'text-rose-600 dark:text-rose-400' 
                              : isWarning 
                                ? 'text-amber-600 dark:text-amber-400' 
                                : 'text-slate-900 dark:text-white'
                          }`}>
                            {product.quantity} Stk.
                          </span>
                        </div>

                        {product.weightGrams ? (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            {product.weightGrams >= 1000 ? `${(product.weightGrams/1000).toFixed(2)} kg` : `${product.weightGrams} g`}
                          </span>
                        ) : null}
                      </div>

                      {/* Actions: Entnehmen & Zubuchen (2 equal-sized clear buttons in a grid) */}
                      {onOpenMovement && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onOpenMovement(product, 'WITHDRAW')}
                            className="w-full py-2 px-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-98 shadow-2xs"
                            title="Artikel entnehmen (mit Ticket-Nummer)"
                          >
                            <PackageMinus className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                            <span className="truncate">Entnehmen</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => onOpenMovement(product, 'ADD')}
                            className="w-full py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-98 shadow-2xs"
                            title="Bestand zubuchen"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">Zubuchen</span>
                          </button>
                        </div>
                      )}
                    </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
