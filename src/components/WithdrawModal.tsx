import React, { useState } from 'react';
import { Product, User } from '../types';
import { 
  PackageMinus, 
  Tag, 
  FileText, 
  Minus, 
  Plus, 
  Check, 
  X,
  AlertCircle,
  Clock
} from 'lucide-react';

interface WithdrawModalProps {
  product: Product;
  user: User;
  onConfirm: (productId: string, quantity: number, ticketNumber: string, notes: string) => Promise<void>;
  onClose: () => void;
}

export function WithdrawModal({ product, user, onConfirm, onClose }: WithdrawModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const maxAvailable = product.quantity;

  const handleIncrement = () => {
    if (quantity < maxAvailable) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Bitte mindestens 1 Stück zur Entnahme auswählen.');
      return;
    }
    if (quantity > maxAvailable) {
      setError(`Maximal ${maxAvailable} Stück im Lager verfügbar.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirm(product.id, quantity, ticketNumber.trim(), notes.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Buchen der Entnahme.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-rose-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <PackageMinus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Artikel entnehmen
              </h3>
              <p className="text-xs text-rose-100">
                Ticket-Nummer für Rückverfolgung & Historie angeben
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 p-3 rounded-xl flex items-center space-x-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {product.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                Fach {product.locationLetter}{product.locationNumber}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono">{product.barcode}</span>
              <span>•</span>
              <span>Aktueller Lagerbestand: <strong className="text-slate-800 dark:text-slate-200">{product.quantity} Stk.</strong></span>
            </div>
          </div>

          {/* Quantity Stepper */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1.5">
              Entnahmemenge (Stück) *
            </label>
            <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-40 transition font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="1"
                  max={maxAvailable}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(maxAvailable, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full text-center font-mono font-black text-xl bg-transparent outline-none text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 block -mt-1">
                  von {maxAvailable} verfügbar
                </span>
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= maxAvailable}
                className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-40 transition font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ticket Number Input (Key user requirement) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] flex items-center">
                <Tag className="w-3 h-3 mr-1 text-indigo-600 dark:text-indigo-400" />
                Ticket-Nummer / Auftragsnummer
              </label>
              <span className="text-[10px] text-slate-400 italic">Optional</span>
            </div>
            <input
              type="text"
              autoFocus
              placeholder=""
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
            />
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
              Beispiel: TICK-2026-089 oder KUNDE-45 (Wird im Buchungsprotokoll erfasst)
            </span>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center">
              <FileText className="w-3 h-3 mr-1 text-slate-400" />
              Optionale Bemerkung
            </label>
            <input
              type="text"
              placeholder=""
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
            />
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
              Beispiel: Austausch defektes Bauteil, Montage Vor-Ort
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting || maxAvailable <= 0}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-xs transition shadow-xs disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Bucht aus...' : `${quantity} Stk. entnehmen`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
