import React, { useState } from 'react';
import { Product, User } from '../types';
import { 
  PackageMinus, 
  PackagePlus, 
  Tag, 
  FileText, 
  Scale, 
  AlertTriangle, 
  Check, 
  Minus, 
  Plus, 
  MapPin, 
  Barcode 
} from 'lucide-react';

interface StockMovementModalProps {
  product: Product;
  user: User;
  initialType?: 'WITHDRAW' | 'ADD';
  onConfirm: (productId: string, delta: number, ticketNumber: string, notes: string) => Promise<void>;
  onClose: () => void;
}

export function StockMovementModal({ 
  product, 
  user, 
  initialType = 'WITHDRAW', 
  onConfirm, 
  onClose 
}: StockMovementModalProps) {
  const [movementType, setMovementType] = useState<'WITHDRAW' | 'ADD'>(initialType);
  const [amount, setAmount] = useState<number>(1);
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const delta = movementType === 'WITHDRAW' ? -amount : amount;
  const currentQuantity = product.quantity;
  const resultingQuantity = Math.max(0, currentQuantity + delta);

  const unitWeight = product.weightGrams || 0;
  const totalMovementWeightGrams = unitWeight * amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Bitte eine Menge größer als 0 angeben.');
      return;
    }

    if (movementType === 'WITHDRAW' && amount > currentQuantity) {
      setError(`Maximal ${currentQuantity} Stück im Lager vorhanden.`);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onConfirm(product.id, delta, ticketNumber.trim(), notes.trim());
      onClose();
    } catch (e: any) {
      setError(e.message || 'Fehler beim Buchen der Lagerbewegung.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAmount = (val: number) => {
    if (val < 1) return;
    if (movementType === 'WITHDRAW' && val > currentQuantity) {
      setAmount(currentQuantity);
    } else {
      setAmount(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 text-white flex items-center justify-between ${
          movementType === 'WITHDRAW' ? 'bg-amber-600' : 'bg-emerald-600'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              {movementType === 'WITHDRAW' ? (
                <PackageMinus className="w-5 h-5 text-white" />
              ) : (
                <PackagePlus className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {movementType === 'WITHDRAW' ? 'Artikel entnehmen (Warenausgang)' : 'Bestand zubuchen (Wareneingang)'}
              </h2>
              <p className="text-xs opacity-90">
                Mitarbeiter: <span className="font-bold underline">{user.name}</span>
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Article Info Box */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                  {product.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center">
                    <Barcode className="w-3 h-3 mr-1 text-slate-400" />
                    {product.barcode}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    Fach {product.locationLetter}{product.locationNumber}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block uppercase font-bold">Aktueller Bestand</span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">{currentQuantity} Stk.</span>
              </div>
            </div>

            {unitWeight > 0 && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center">
                  <Scale className="w-3.5 h-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
                  Stückgewicht (inkl. OVP):
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {unitWeight >= 1000 ? `${(unitWeight / 1000).toFixed(2)} kg` : `${unitWeight} g`}
                </span>
              </div>
            )}
          </div>

          {/* Toggle Type (Entnahme vs Zubuchung) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMovementType('WITHDRAW');
                setError('');
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                movementType === 'WITHDRAW'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PackageMinus className="w-4 h-4" />
              <span>Entnahme (-)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMovementType('ADD');
                setError('');
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                movementType === 'ADD'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PackagePlus className="w-4 h-4" />
              <span>Zubuchung (+)</span>
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Selection with Quick Buttons */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Menge ({movementType === 'WITHDRAW' ? 'zu entnehmen' : 'hinzuzufügen'})
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAmount(Math.max(1, amount - 1))}
                  className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={movementType === 'WITHDRAW' ? currentQuantity : 99999}
                  required
                  className="flex-1 min-w-0 text-center font-black text-xl py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-mono"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <button
                  type="button"
                  onClick={() => handleQuickAmount(amount + 1)}
                  className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Amount Pills */}
              <div className="flex items-center space-x-1.5 mt-2">
                <span className="text-[11px] text-slate-400 mr-1">Schnell:</span>
                {[1, 2, 5, 10, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleQuickAmount(num)}
                    className="px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition"
                  >
                    {num}
                  </button>
                ))}
                {movementType === 'WITHDRAW' && currentQuantity > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(currentQuantity)}
                    className="px-2.5 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-900 dark:text-amber-300 rounded-lg transition"
                  >
                    Alle ({currentQuantity})
                  </button>
                )}
              </div>
            </div>

            {/* Ticket-Nummer Input (Reason) */}
            <div className="bg-indigo-50/50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-indigo-200/80 dark:border-slate-700 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-300 flex items-center justify-between">
                <span className="flex items-center">
                  <Tag className="w-3.5 h-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
                  Grund: Ticket-Nummer / Auftragsnummer
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <input
                type="text"
                placeholder=""
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono font-bold text-indigo-950 dark:text-indigo-200"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block px-1">
                Beispiel: TICK-8041 oder AUFTRAG-441 (kann auch leer bleiben)
              </span>
              <p className="text-[11px] text-indigo-700/80 dark:text-slate-400">
                Wird im Verlauf gespeichert, damit später exakt nachvollziehbar ist, für welches Ticket dieser Artikel verwendet wurde.
              </p>
            </div>

            {/* Notizen / Verwendungszweck */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Zusätzlicher Grund / Notiz (optional)
              </label>
              <input
                type="text"
                placeholder=""
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 px-1">
                Beispiel: Austausch an Workstation, Server-Upgrade, Kabel defekt
              </span>
            </div>

            {/* Summary Box & Weight Calculation */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Neuer Restbestand im Lager:</span>
                <span className="font-bold font-mono text-sm text-slate-900 dark:text-white">
                  {resultingQuantity} Stück
                </span>
              </div>
              {unitWeight > 0 && (
                <div className="flex justify-between text-indigo-900 dark:text-indigo-300 font-medium">
                  <span>Gewicht dieser Buchung ({amount} Stk.):</span>
                  <span className="font-bold font-mono">
                    {totalMovementWeightGrams >= 1000 
                      ? `${(totalMovementWeightGrams / 1000).toFixed(2)} kg` 
                      : `${totalMovementWeightGrams} g`}
                  </span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl font-semibold text-sm transition"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (movementType === 'WITHDRAW' && currentQuantity === 0)}
                className={`flex-1 py-2.5 text-white rounded-xl font-bold text-sm transition flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50 ${
                  movementType === 'WITHDRAW'
                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Buche...' : movementType === 'WITHDRAW' ? 'Entnahme bestätigen' : 'Zubuchung bestätigen'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
