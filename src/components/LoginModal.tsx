import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Lock, User, KeyRound, AlertCircle, CheckCircle2, ChefHat, UtensilsCrossed, ShieldCheck, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, canClose = true }) => {
  const { login, currentUser, logout, role, setRole, setUserName, quickSelectUser } = useRestaurant();
  const [customName, setCustomName] = useState('');
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  if (!isOpen) return null;

  const handleQuickEnter = (name: string, targetRole: 'waiter' | 'kitchen' | 'admin') => {
    quickSelectUser(name, targetRole);
    setSuccessMsg(`¡Bienvenido ${name}! Accediendo como ${targetRole === 'waiter' ? 'Mesero' : targetRole === 'kitchen' ? 'Cocina KDS' : 'Administrador'}...`);
    setTimeout(() => {
      setSuccessMsg(null);
      if (onClose) onClose();
    }, 600);
  };

  const handleCustomNameEnter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const cleanName = customName.trim();
    quickSelectUser(cleanName, role);
    setSuccessMsg(`¡Identificado como ${cleanName}!`);
    setTimeout(() => {
      setSuccessMsg(null);
      if (onClose) onClose();
    }, 600);
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/30">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900">Acceso Fácil al Sistema</h2>
              <p className="text-xs text-stone-600">Acceso libre sin verificación obligatoria</p>
            </div>
          </div>
          {canClose && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Free Access Alert */}
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span><strong>Acceso Libre Habilitado:</strong> Puedes ingresar y alternar roles con 1 clic sin contraseñas ni verificaciones de usuario.</span>
        </div>

        {/* Current user status */}
        {currentUser && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-center justify-between">
            <div>
              <span className="font-semibold text-stone-600">Usuario activo: </span>
              <strong className="font-black text-amber-900">{currentUser.nombre}</strong> ({currentUser.rol})
            </div>
            <button
              onClick={logout}
              className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
            >
              Restablecer
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1-Click Profile Selection */}
        <div className="mt-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
            Entrar con 1 Clic (Selecciona tu puesto):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Mesero */}
            <button
              type="button"
              onClick={() => handleQuickEnter('Carlos M. (Mesero)', 'waiter')}
              className="group flex flex-col items-start rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-left hover:border-amber-500 hover:bg-amber-50/50 hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-stone-900 group-hover:text-amber-700">
                <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                <span>Salón / Mesero</span>
              </div>
              <p className="text-[11px] text-stone-700 mt-1 font-semibold">Carlos M.</p>
              <span className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Acceso directo
              </span>
            </button>

            {/* Cocina */}
            <button
              type="button"
              onClick={() => handleQuickEnter('Chef Marco', 'kitchen')}
              className="group flex flex-col items-start rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-left hover:border-orange-500 hover:bg-orange-50/50 hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-stone-900 group-hover:text-orange-700">
                <ChefHat className="h-4 w-4 text-orange-600" />
                <span>Cocina KDS</span>
              </div>
              <p className="text-[11px] text-stone-700 mt-1 font-semibold">Chef Marco</p>
              <span className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Acceso directo
              </span>
            </button>

            {/* Administrador */}
            <button
              type="button"
              onClick={() => handleQuickEnter('Administrador BD', 'admin')}
              className="group flex flex-col items-start rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-left hover:border-purple-500 hover:bg-purple-50/50 hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-stone-900 group-hover:text-purple-700">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <span>Gestor de BD</span>
              </div>
              <p className="text-[11px] text-stone-700 mt-1 font-semibold">Admin SQLite</p>
              <span className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Acceso total
              </span>
            </button>
          </div>
        </div>

        {/* Custom Name Quick Form */}
        <form onSubmit={handleCustomNameEnter} className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <label className="block text-xs font-bold text-stone-700 mb-1">
            O escribe tu nombre directamente:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Tu nombre (ej. Andrés R., Laura G.)"
              className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-amber-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!customName.trim()}
              className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-40 transition-colors"
            >
              Ingresar
            </button>
          </div>
        </form>

        {/* Toggle Optional Password Login if wanted */}
        <div className="mt-4 border-t border-stone-100 pt-3">
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
          >
            <Lock className="h-3 w-3" />
            <span>{showPasswordSection ? 'Ocultar login con contraseña' : 'Ver login tradicional con contraseña (opcional)'}</span>
          </button>

          {showPasswordSection && (
            <form onSubmit={handleLogin} className="mt-3 space-y-2">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Usuario (carlos/chef/admin)"
                  className="rounded-lg border border-stone-200 p-2 text-xs"
                />
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Contraseña"
                  className="rounded-lg border border-stone-200 p-2 text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-stone-800 py-1.5 text-xs font-bold text-white hover:bg-stone-700 disabled:opacity-50"
              >
                {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
