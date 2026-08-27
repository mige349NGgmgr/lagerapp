import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { api } from '../api';
import { 
  Save, 
  X, 
  Plus, 
  Minus, 
  MapPin, 
  Barcode as BarcodeIcon, 
  Tag, 
  FileText, 
  Database, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface ProductFormProps {
  initialData?: Product | null;
  scannedBarcode?: string;
  defaultLocation?: { letter: string; number: number } | null;
  onSave: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const NUMBERS = [1, 2, 3, 4, 5];

export function ProductForm({ initialData, scannedBarcode, defaultLocation, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    barcode: '',
    locationLetter: defaultLocation?.letter || 'A',
    locationNumber: defaultLocation?.number || 1,
    quantity: 0,
    minQuantity: 5,
    weightGrams: 0,
    serialNumber: '',
    category: '',
  });

  const [isSearchingEan, setIsSearchingEan] = useState<boolean>(false);
  const [eanResult, setEanResult] = useState<{ success: boolean; name?: string; weightGrams?: number; source?: string; message?: string } | null>(null);

  const fetchEanInfo = useCallback(async (codeToLookup: string, isAuto = false) => {
    const cleanCode = codeToLookup.trim();
    if (!cleanCode || cleanCode.length < 5) {
      if (!isAuto) {
        setEanResult({ success: false, message: 'Barcode ist zu kurz (mind. 5 Ziffern erforderlich).' });
      }
      return;
    }

    setIsSearchingEan(true);
    setEanResult(null);

    try {
      const res = await api.lookupEan(cleanCode);
      if (res.success && res.name) {
        setFormData(prev => ({
          ...prev,
          name: res.name || prev.name,
          category: res.category || prev.category,
          weightGrams: res.weightGrams ?? prev.weightGrams ?? 0,
        }));
        setEanResult({
          success: true,
          name: res.name,
          weightGrams: res.weightGrams,
          source: res.source || 'EAN-Datenbank',
        });
      } else {
        setEanResult({
          success: false,
          message: res.message || 'Kein passender Eintrag in der EAN-Datenbank gefunden.',
        });
      }
    } catch (e: any) {
      setEanResult({
        success: false,
        message: 'Fehler bei der Online-EAN-Abfrage.',
      });
    } finally {
      setIsSearchingEan(false);
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        barcode: initialData.barcode || '',
        locationLetter: initialData.locationLetter || 'A',
        locationNumber: initialData.locationNumber || 1,
        quantity: initialData.quantity ?? 0,
        minQuantity: initialData.minQuantity ?? 5,
        weightGrams: initialData.weightGrams ?? 0,
        serialNumber: initialData.serialNumber || '',
        category: initialData.category || '',
      });
      setEanResult(null);
    } else if (scannedBarcode) {
      setFormData(prev => ({
        ...prev,
        barcode: scannedBarcode,
        locationLetter: defaultLocation?.letter || prev.locationLetter || 'A',
        locationNumber: defaultLocation?.number || prev.locationNumber || 1,
      }));
      fetchEanInfo(scannedBarcode, true);
    } else if (defaultLocation) {
      setFormData(prev => ({
        ...prev,
        locationLetter: defaultLocation.letter,
        locationNumber: defaultLocation.number,
      }));
      setEanResult(null);
    }
  }, [initialData, scannedBarcode, defaultLocation, fetchEanInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  const adjustQty = (field: 'quantity' | 'minQuantity', delta: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, (prev[field] || 0) + delta)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
              {formData.locationLetter}{formData.locationNumber}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {initialData ? 'Produkt bearbeiten' : 'Neuen Artikel anlegen'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Regalfach: {formData.locationLetter}{formData.locationNumber}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCancel} 
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Clean and Focused */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. Barcode / EAN with Instant Lookup */}
          <div className="bg-indigo-50/60 dark:bg-slate-900/60 p-3.5 rounded-xl border border-indigo-100 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-300 flex items-center">
                <BarcodeIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 mr-1.5" />
                Barcode / EAN-Nummer *
              </label>
              {scannedBarcode && (
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Gescannter Code
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                required
                type="text"
                placeholder=""
                className="flex-1 min-w-0 px-3.5 py-2.5 text-base sm:text-sm border border-indigo-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono transition"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
              <button
                type="button"
                onClick={() => fetchEanInfo(formData.barcode)}
                disabled={isSearchingEan || !formData.barcode.trim()}
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 transition shadow-xs shrink-0"
                title="EAN-Datenbank online abfragen"
              >
                {isSearchingEan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden xs:inline">Suche...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>EAN suchen</span>
                  </>
                )}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block px-1">
              Beispiel: 4006381333931 oder KABEL-001
            </span>

            {/* Status Message from EAN Lookup */}
            {eanResult && !isSearchingEan && (
              <div className={`p-2.5 rounded-lg text-xs flex items-start space-x-2 border ${
                eanResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {eanResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Artikel live erkannt: "{eanResult.name}"</p>
                      {eanResult.source && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                          Quelle: {eanResult.source} {eanResult.weightGrams ? `• ${eanResult.weightGrams} g` : ''}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-800 dark:text-amber-300">{eanResult.message}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 2. Produktname */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Produktname *
            </label>
            <input
              required
              type="text"
              placeholder=""
              className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 px-1">
              Beispiel: M6 Zylinderschrauben oder Stabilo Boss
            </span>
          </div>

          {/* 3. Lagerort (Regalfach A-H, 1-5) */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 mr-1" />
                Lagerort / Regalfach
              </label>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-slate-600">
                Fach {formData.locationLetter}{formData.locationNumber}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Spalte (A bis H):</span>
              <div className="grid grid-cols-8 gap-1">
                {LETTERS.map(letter => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setFormData({ ...formData, locationLetter: letter })}
                    className={`py-1.5 text-xs sm:text-sm font-bold rounded-lg border transition active:scale-95 ${
                      formData.locationLetter === letter
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Ebene (1 bis 5):</span>
              <div className="grid grid-cols-5 gap-1.5">
                {NUMBERS.map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({ ...formData, locationNumber: num })}
                    className={`py-1.5 text-xs sm:text-sm font-bold rounded-lg border transition active:scale-95 ${
                      formData.locationNumber === num
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Aktueller Bestand & Mindestbestand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bestand */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Aktueller Bestand (Stk.)
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => adjustQty('quantity', -1)}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 shadow-2xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  required
                  type="number"
                  min="0"
                  className="flex-1 min-w-0 text-center font-bold text-base py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                />
                <button
                  type="button"
                  onClick={() => adjustQty('quantity', 1)}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mindestbestand */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Mindestbestand (Alarm)
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => adjustQty('minQuantity', -1)}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 shadow-2xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  required
                  type="number"
                  min="0"
                  className="flex-1 min-w-0 text-center font-bold text-base py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: Math.max(0, parseInt(e.target.value) || 0) })}
                />
                <button
                  type="button"
                  onClick={() => adjustQty('minQuantity', 1)}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold hover:bg-slate-100 active:scale-95 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Bruttogewicht (inkl. Produktverpackung / OVP) */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Gewicht inkl. Produktverpackung / OVP (g)</span>
              {formData.weightGrams && formData.weightGrams >= 1000 ? (
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {(formData.weightGrams / 1000).toFixed(2)} kg
                </span>
              ) : null}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                step="1"
                placeholder=""
                className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                value={formData.weightGrams || ''}
                onChange={(e) => setFormData({ ...formData, weightGrams: Math.max(0, parseInt(e.target.value) || 0) })}
              />
              <span className="text-xs font-semibold text-slate-500">Gramm</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block px-1">
              Bruttogewicht der Verkaufseinheit (inkl. Originalverpackung, Schachtel & Zubehör) für präzise Versand- und Paketberechnung.
            </span>
          </div>

          {/* 6. Seriennummer / Chargennummer (anstelle von Ticketnummer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Seriennummer / Charge (optional)
              </label>
              <input
                type="text"
                placeholder=""
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase"
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value.toUpperCase() })}
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 px-1">
                Beispiel: SN-98421 oder LOT-2026
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Kategorie (optional)
              </label>
              <input
                type="text"
                placeholder=""
                className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 px-1">
                Beispiel: Schrauben, Kabel, Werkzeug
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-800 pb-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium text-xs sm:text-sm transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Änderungen speichern' : 'Artikel speichern'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
