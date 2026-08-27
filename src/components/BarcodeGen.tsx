import { useState } from 'react';
import Barcode from 'react-barcode';
import { Printer, Hash, Dices, Copy, Check } from 'lucide-react';

export function BarcodeGen() {
  const [value, setValue] = useState('BOX-A1-001');
  const [copied, setCopied] = useState(false);

  const presets = ['SCHRAUB-M6', 'KABEL-200', 'BOX-A1', 'ELEK-042', 'LAGER-B2'];

  const generateRandom = () => {
    const randomNum = Math.floor(100000000000 + Math.random() * 900000000000);
    setValue(randomNum.toString());
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-5">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Barcode Generator</h2>
            <p className="text-xs text-slate-400">Erstelle Etiketten für Kisten & Fächer</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Barcode-Text / Artikelnummer:
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              className="flex-1 px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
              placeholder="z.B. KABEL-001 oder EAN"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button
              type="button"
              onClick={generateRandom}
              className="px-3 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1"
              title="Zufälligen Code generieren"
            >
              <Dices className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Zufall</span>
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Schnellauswahl Vorlagen:</span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setValue(p)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Barcode Display Container with mobile scaling */}
        <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700 p-4 min-h-[160px] overflow-hidden">
          {value ? (
            <div className="max-w-full overflow-x-auto p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <Barcode 
                value={value} 
                width={1.6} 
                height={64} 
                fontSize={13} 
                margin={4}
                background="#ffffff" 
              />
            </div>
          ) : (
            <span className="text-xs text-slate-400">Gib einen Text ein, um den Barcode zu sehen</span>
          )}
        </div>

        {/* Actions */}
        {value && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopieren</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Drucken</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
