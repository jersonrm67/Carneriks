import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import {
  Flame,
  Utensils,
  ChefHat,
  Package,
  Volume2,
  VolumeX,
  Database,
  User,
  ChevronDown,
  Lock,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  onOpenDbModal: () => void;
  onOpenLoginModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDbModal, onOpenLoginModal }) => {
  const {
    role,
    setRole,
    userName,
    setUserName,
    currentUser,
    logout,
    isConnected,
    orders,
    isMuted,
    toggleMute,
    dbStatus,
    quickSelectUser,
  } = useRestaurant();

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Count active pending or preparing orders for Kitchen badge
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing'
  ).length;

  // Count ready orders for Waiter badge
  const readyOrdersCount = orders.filter((o) => o.status === 'ready').length;

  const rolesList: { id: UserRole; label: string; icon: any; count?: number }[] = [
    { id: 'waiter', label: 'Mesero / Salón', icon: Utensils, count: readyOrdersCount },
    { id: 'kitchen', label: 'Cocina KDS', icon: ChefHat, count: pendingOrdersCount },
    { id: 'admin', label: 'Inventario & BD', icon: Package },
  ];

  const waiterStaff = ['Carlos M.', 'Laura G.', 'Andrés R.', 'Valeria S.'];
  const kitchenStaff = ['Chef Marco', 'Parrillero Hugo', 'Cocinero David'];

  const currentStaffList = role === 'kitchen' ? kitchenStaff : waiterStaff;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-600 via-orange-600 to-red-700 text-white shadow-md shadow-orange-500/20">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-stone-900">CARNERIKS</span>
                <span className="hidden rounded bg-stone-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 sm:inline-block">
                  Parrilla OS
                </span>
              </div>
              <p className="text-[11px] font-medium text-stone-700">Comandas & Cocina en Vivo</p>
            </div>
          </div>

          {/* Real-Time Status Pill */}
          <button
            onClick={onOpenDbModal}
            title="Haz clic para ver el estado de la Base de Datos en tiempo real"
            className="hidden items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-100 md:flex transition-colors"
          >
            <span className="relative flex h-2 w-2">
              {isConnected ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </span>
            <span>{isConnected ? 'BD Conectada' : 'Reconectando...'}</span>
            <span className="text-[10px] text-stone-700">({dbStatus.lastPingMs}ms)</span>
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
          {rolesList.map((r) => {
            const Icon = r.icon;
            const isActive = role === r.id;

            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all sm:px-3.5 sm:text-sm ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-600' : 'text-stone-600'}`} />
                <span>{r.label}</span>
                {r.count !== undefined && r.count > 0 && (
                  <span
                    className={`ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black text-white ${
                      r.id === 'kitchen' ? 'bg-amber-600' : 'bg-emerald-600'
                    }`}
                  >
                    {r.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Badge, Sound & DB Modal launcher */}
        <div className="flex items-center gap-2">
          {/* User selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
            >
              {currentUser ? (
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <User className="h-3.5 w-3.5 text-stone-700" />
              )}
              <span className="max-w-[80px] truncate sm:max-w-none">{userName}</span>
              <ChevronDown className="h-3 w-3 text-stone-600" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-1 w-56 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                  <span>Acceso Rápido</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-black text-[9px]">Sin Clave</span>
                </div>

                <div className="space-y-0.5 mt-1">
                  {currentStaffList.map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        quickSelectUser(name, role);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                        userName === name
                          ? 'bg-amber-50 font-bold text-amber-900'
                          : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                <div className="my-1.5 border-t border-stone-100"></div>

                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Cambiar Perfil
                </div>

                <button
                  onClick={() => {
                    quickSelectUser('Carlos M. (Mesero)', 'waiter');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-stone-700 hover:bg-amber-50 hover:text-amber-900"
                >
                  <Utensils className="h-3.5 w-3.5 text-amber-600" />
                  <span>Modo Mesero</span>
                </button>

                <button
                  onClick={() => {
                    quickSelectUser('Chef Marco', 'kitchen');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-stone-700 hover:bg-orange-50 hover:text-orange-900"
                >
                  <ChefHat className="h-3.5 w-3.5 text-orange-600" />
                  <span>Modo Cocina</span>
                </button>

                <button
                  onClick={() => {
                    quickSelectUser('Administrador BD', 'admin');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-stone-700 hover:bg-purple-50 hover:text-purple-900"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                  <span>Modo Admin BD</span>
                </button>

                <div className="my-1.5 border-t border-stone-100"></div>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onOpenLoginModal();
                  }}
                  className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-bold text-amber-800 bg-amber-50/70 hover:bg-amber-100"
                >
                  <span>Panel de Perfiles...</span>
                  <span className="text-[10px] text-amber-600">Libre</span>
                </button>
              </div>
            )}
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Activar sonido de tickets' : 'Silenciar sonido de tickets'}
            className={`rounded-lg border p-1.5 transition-colors ${
              isMuted
                ? 'border-stone-200 bg-stone-100 text-stone-600'
                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* DB Inspector Trigger */}
          <button
            onClick={onOpenDbModal}
            title="Base de Datos: SQLite Relacional + Firebase Firestore (carneriks-b31a8)"
            className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/50 px-2 py-1.5 text-xs font-semibold text-stone-800 hover:bg-amber-100 transition-colors"
          >
            <Database className="h-3.5 w-3.5 text-stone-700" />
            <Flame className="h-3.5 w-3.5 text-orange-600" />
            <span className="hidden sm:inline">BD & Nube</span>
          </button>
        </div>
      </div>
    </header>
  );
};
