import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, AlertCircle, Keyboard, ArrowRight, CheckCircle2, Database } from 'lucide-react';

interface ScannerProps {
  onScan: (barcode: string) => void;
}

const SAMPLE_EANS = [
  { code: '4006381333931', label: 'Stabilo Boss EAN' },
  { code: '4008110547053', label: 'Pritt Klebestift EAN' },
  { code: '3017620422003', label: 'Nutella EAN' },
  { code: '4012345678901', label: 'M6 Schrauben (Lager)' },
];

export function Scanner({ onScan }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!scannerRef.current) {
        try {
          scannerRef.current = new Html5QrcodeScanner(
            'reader',
            { 
              fps: 10, 
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const edgeSize = Math.floor(minEdge * 0.75);
                return { width: edgeSize, height: edgeSize };
              },
              aspectRatio: 1.0,
            },
            false
          );

          scannerRef.current.render(
            (decodedText) => {
              if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error("Kamera Stop Error", e));
              }
              onScan(decodedText);
            },
            () => {
              // Standard continuous scan frame attempts
            }
          );
        } catch (e) {
          setError('Kamera konnte nicht gestartet werden. Bitte Browser-Berechtigungen erteilen oder manuell eingeben.');
          setShowManualInput(true);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Scanner konnte nicht bereinigt werden", e));
        scannerRef.current = null;
      }
    };
  }, [onScan]);

  const handleManualSubmit = (e?: React.FormEvent, directCode?: string) => {
    if (e) e.preventDefault();
    const code = directCode || manualCode;
    if (!code.trim()) return;
    onScan(code.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* EAN Database Integration Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-950/60 border border-indigo-100/80 dark:border-slate-700 rounded-2xl p-3.5 flex items-center space-x-3 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Database className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">EAN-Datenbanksuche aktiv</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </div>
          <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300 leading-snug">
            Beim Scannen wird der Artikel automatisch in der EAN-Datenbank nachgeschlagen und benannt.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Barcode / EAN Scanner</h2>
              <p className="text-xs text-slate-400">Halte den Barcode vor die Kamera</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-slate-700 px-2.5 py-1.5 rounded-lg flex items-center space-x-1"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{showManualInput ? 'Kamera' : 'Manuell'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-3 bg-red-50 dark:bg-rose-950/40 text-red-700 dark:text-rose-300 rounded-xl flex items-start space-x-2 border border-red-100 dark:border-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* Viewfinder Container */}
        {!showManualInput ? (
          <div className="relative">
            <div 
              id="reader" 
              className="w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 aspect-square max-h-[340px]"
            />
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
              Erkennt alle gängigen 1D Barcodes (EAN-13, EAN-8, UPC, Code 128) und QR-Codes.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Barcode / EAN manuell eingeben:
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="z.B. 4006381333931"
                  className="w-full px-3.5 py-2.5 text-base border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center space-x-2 transition shadow-xs"
              >
                <span>Scannen & EAN abfragen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Schnelltest-Beispiel-Barcodes */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Oder Test-Barcode ausprobieren:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_EANS.map((sample) => (
                  <button
                    key={sample.code}
                    type="button"
                    onClick={() => {
                      setManualCode(sample.code);
                      handleManualSubmit(undefined, sample.code);
                    }}
                    className="p-2 text-left bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 hover:border-indigo-200 rounded-lg text-xs transition group"
                  >
                    <p className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 truncate">
                      {sample.label}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {sample.code}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
