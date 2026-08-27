import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api';
import { Lock, LogIn, Shield, Users, Check, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  currentUser: User | null;
  onLogin: (user: User) => void;
  onClose: () => void;
}

export function LoginModal({ currentUser, onLogin, onClose }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    api.getUsers().then(setAvailableUsers).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.login(username, password);
      if (res.success && res.user) {
        onLogin(res.user);
        onClose();
      } else {
        setError(res.error || 'Ungültige Anmeldedaten.');
      }
    } catch (e: any) {
      setError('Verbindungsfehler beim Anmelden.');
    } finally {
      setLoading(false);
    }
  };

  // Schnellanmeldung für Test- & Demonstrationszwecke
  const handleQuickLogin = async (user: User) => {
    const pw = user.role === 'admin' ? 'admin123' : 'lager123';
    setUsername(user.username);
    setPassword(pw);
    setLoading(true);
    setError('');
    try {
      const res = await api.login(user.username, pw);
      if (res.success && res.user) {
        onLogin(res.user);
        onClose();
      }
    } catch (e: any) {
      setError('Fehler beim Schnell-Login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-indigo-600 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Mitarbeiter-Anmeldung</h2>
              <p className="text-xs text-indigo-100">Zugriff auf Lagerentnahmen & Verlauf</p>
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

        <div className="p-4 sm:p-6 space-y-5">
          {currentUser && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    Aktuell angemeldet: {currentUser.name}
                  </p>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium capitalize">
                    {currentUser.role === 'admin' ? 'Administrator' : 'Mitarbeiter'} (@{currentUser.username})
                  </span>
                </div>
              </div>
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 p-3 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form without confusing placeholders */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Benutzername
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder=""
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 px-1">
                Beispiel: admin oder m.klein
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Kennwort
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder=""
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Prüfe...' : 'Anmelden'}</span>
            </button>
          </form>

          {/* Schnellauswahl / Demo Accounts */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Direkt-Auswahl (1-Klick Login):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className={`p-2.5 text-left rounded-xl border transition flex flex-col justify-between ${
                    currentUser?.id === u.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-300 dark:ring-indigo-700'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">
                    @{u.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
