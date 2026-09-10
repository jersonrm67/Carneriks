import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Lock, User, KeyRound, AlertCircle, CheckCircle2, ChefHat, UtensilsCrossed, ShieldCheck, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, canClose = true }) => {
  const { login, currentUser, logout, role, setRole, setUserName } = useRestaurant();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !contrasena.trim()) {
      setError('Por favor ingresa usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await login(usuario.trim(), contrasena.trim());
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('¡Sesión iniciada correctamente!');
      setTimeout(() => {
        setSuccessMsg(null);
        if (onClose) onClose();
      }, 700);
    } else {
      setError(res.error || 'Credenciales incorrectas.');
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsuario(user);
    setContrasena(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/30">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900">Autenticación Carneriks</h2>
              <p className="text-xs text-stone-700">Acceso a la base de datos operativa</p>
            </div>
          </div>
          {canClose && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-stone-600 hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Current user status if already logged in */}
        {currentUser && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-center justify-between">
            <div>
              <span className="font-semibold text-stone-700">Sesión actual: </span>
              <strong className="font-black text-amber-900">{currentUser.nombre}</strong> ({currentUser.rol})
            </div>
            <button
              onClick={logout}
              className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-4 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Usuario de Sistema
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-600" />
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ej. carlos, chef, admin"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-9 pr-3 py-2 text-xs font-medium text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-stone-600" />
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pl-9 pr-3 py-2 text-xs font-medium text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white shadow-md shadow-amber-600/30 hover:bg-amber-700 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Verificando con SQLite...' : 'Iniciar Sesión en Base de Datos'}
          </button>
        </form>

        {/* Quick Roles & Pre-filled Accounts */}
        <div className="mt-5 border-t border-stone-100 pt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-2">
            Cuentas Verificadas en Base de Datos:
          </div>
          <div className="grid grid-cols-3 gap-2 text-left">
            <button
              type="button"
              onClick={() => handleQuickFill('carlos', 'mesero123')}
              className="rounded-xl border border-stone-200 bg-stone-50 p-2 text-left hover:border-amber-400 hover:bg-amber-50/40 transition-all"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-stone-900">
                <UtensilsCrossed className="h-3 w-3 text-amber-600" />
                <span>Mesero</span>
              </div>
              <div className="text-[10px] text-stone-700 mt-0.5">carlos</div>
              <div className="text-[9px] text-stone-600">mesero123</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('chef', 'cocina123')}
              className="rounded-xl border border-stone-200 bg-stone-50 p-2 text-left hover:border-amber-400 hover:bg-amber-50/40 transition-all"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-stone-900">
                <ChefHat className="h-3 w-3 text-orange-600" />
                <span>Cocina</span>
              </div>
              <div className="text-[10px] text-stone-700 mt-0.5">chef</div>
              <div className="text-[9px] text-stone-600">cocina123</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="rounded-xl border border-stone-200 bg-stone-50 p-2 text-left hover:border-amber-400 hover:bg-amber-50/40 transition-all"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-stone-900">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>Admin</span>
              </div>
              <div className="text-[10px] text-stone-700 mt-0.5">admin</div>
              <div className="text-[9px] text-stone-600">admin123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
