import React, { useState, useEffect } from 'react';
import { Product, EanLookupResult, User } from '../types';
import { api } from '../api';
import { 
  PackagePlus, 
  MapPin, 
  Barcode, 
  Loader2, 
  Check, 
  AlertCircle, 
  Tag,
  Edit3,
  Database
} from 'lucide-react';

interface NewEanPromptModalProps {
  scannedBarcode: string;
  currentUser: User | null;
  onSaveNew: (productData: Omit<Product, 'id'>) => Promise<void>;
  onOpenFullForm: (barcode: string, initialInfo?: Partial<Product>) => void;
  onClose: () => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const NUMBERS = [1, 2, 3, 4, 5];

export function NewEanPromptModal({
  scannedBarcode,
  onSaveNew,
  onOpenFullForm,
  onClose
}: NewEanPromptModalProps) {
  const [loading, setLoading] = useState(true);
  const [eanData, setEanData] = useState<EanLookupResult | null>(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [weightGrams, setWeightGrams] = useState<number>(0);
  const [locationLetter, setLocationLetter] = useState('A');
  const [locationNumber, setLocationNumber] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [minQuantity, setMinQuantity] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function lookup() {
      setLoading(true);
      try {
        const res = await api.lookupEan(scannedBarcode);
        if (isMounted) {
          setEanData(res);
          if (res.success && res.name) {
            setName(res.name);
            setCategory(res.category || '');
            setWeightGrams(res.weightGrams || 0);
          } else {
            setName(`Neuer Artikel (${scannedBarcode})`);
          }
        }
      } catch (e) {
        if (isMounted) {
          setName(`Neuer Artikel (${scannedBarcode})`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    lookup();
    return () => { isMounted = false; };
  }, [scannedBarcode]);

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSaveNew({
        name: name.trim(),
        barcode: scannedBarcode,
        locationLetter,
        locationNumber,
        quantity: Math.max(0, quantity),
        minQuantity: Math.max(0, minQuantity),
        weightGrams: Math.max(0, weightGrams),
        serialNumber: serialNumber.trim(),
        category: category.trim(),
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-xs">
              <PackagePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Neuen Artikel im Lager anlegen
              </h2>
              <p className="text-xs text-indigo-100 flex items-center">
                <Barcode className="w-3.5 h-3.5 mr-1" />
                EAN: <span className="font-mono font-bold ml-1">{scannedBarcode}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleQuickSave} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* EAN Status / Lookup Card */}
          {loading ? (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 rounded-xl flex items-center space-x-3 text-indigo-900 dark:text-indigo-200">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">EAN-Datenbank wird abgefragt...</p>
                <p className="text-indigo-600 dark:text-indigo-400">Automatische Erkennung von Produktname, Marke & Gewicht</p>
              </div>
            </div>
          ) : eanData?.success ? (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start space-x-2.5">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Produkt in EAN-Datenbank erkannt</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 rounded font-medium">
                    {eanData.source}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5 truncate font-medium">
                  {eanData.name}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Barcode ist neu. Bitte Bezeichnung und Regalfach zuweisen.</span>
            </div>
          )}

          {/* Product Name Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Artikelbezeichnung
            </label>
            <input
              type="text"
              required
              placeholder=""
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 px-1">
              Beispiel: Fischer Dübel SX 8x40 oder Bosch Trennscheibe
            </span>
          </div>

          {/* Touch Regal-Auswahl */}
          <div className="bg-indigo-50/40 dark:bg-slate-900/60 p-3.5 rounded-xl border border-indigo-100 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-300 flex items-center">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 mr-1" />
                In welches Regalfach ablegen?
              </label>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-slate-600 shadow-2xs">
                Fach {locationLetter}{locationNumber}
              </span>
            </div>

            {/* Regal Spalte A-H */}
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Regal-Spalte (A bis H):</span>
              <div className="grid grid-cols-8 gap-1">
                {LETTERS.map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setLocationLetter(col)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                      locationLetter === col
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* Regal Ebene 1-5 */}
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Regal-Ebene (1 bis 5):</span>
              <div className="grid grid-cols-5 gap-1.5">
                {NUMBERS.map(row => (
                  <button
                    key={row}
                    type="button"
                    onClick={() => setLocationNumber(row)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                      locationNumber === row
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Ebene {row}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Initial Menge & Grundgewicht */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Anfangsbestand (Stk.)
              </label>
              <input
                type="number"
                min="0"
                required
                className="w-full px-3 py-2 text-sm text-center font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Gewicht (inkl. OVP)</span>
                <span className="text-[9px] font-normal text-indigo-500 lowercase">Brutto / Stk.</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder=""
                  className="w-full pl-3 pr-8 py-2 text-sm text-center font-mono font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={weightGrams || ''}
                  onChange={(e) => setWeightGrams(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold">g</span>
              </div>
            </div>
          </div>

          {/* Optional Serial Number & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 flex items-center">
                <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Kategorie
              </label>
              <input
                type="text"
                placeholder=""
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 flex items-center">
                <span className="text-slate-400 font-bold mr-1 text-xs">SN</span>
                Seriennummer / Charge (optional)
              </label>
              <input
                type="text"
                placeholder=""
                className="w-full px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => onOpenFullForm(scannedBarcode, { name, category, weightGrams, locationLetter, locationNumber, quantity, minQuantity })}
              className="py-2.5 px-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-semibold text-xs transition flex items-center justify-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Im Detailformular anpassen</span>
            </button>

            <div className="flex gap-2 flex-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium text-xs transition text-center"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="flex-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50"
              >
                <PackagePlus className="w-4 h-4" />
                <span>{isSaving ? 'Speichere...' : `In Fach ${locationLetter}${locationNumber} speichern`}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
