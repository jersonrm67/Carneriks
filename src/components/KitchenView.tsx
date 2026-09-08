import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Order, OrderStatus } from '../types';
import {
  Flame,
  Clock,
  CheckCircle2,
  BellRing,
  AlertTriangle,
  ChefHat,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  Volume2,
} from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { orders, updateOrderStatus, isConnected, userName } = useRestaurant();
  const [filterStatus, setFilterStatus] = useState<'active' | 'pending' | 'preparing' | 'ready' | 'delivered'>('active');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [, setTick] = useState(0);

  // Live timer tick every 2 seconds to keep elapsed minutes fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders
  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'active') {
      return o.status === 'pending' || o.status === 'preparing' || o.status === 'ready';
    }
    return o.status === filterStatus;
  });

  // Toggle item checkmark
  const toggleItemCheck = (itemId: string) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Helper to calculate elapsed time in minutes and formatted string
  const getElapsedInfo = (createdAt: string) => {
    const createdTime = new Date(createdAt).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - createdTime);
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let urgency: 'normal' | 'warning' | 'critical' = 'normal';
    if (mins >= 18) {
      urgency = 'critical';
    } else if (mins >= 10) {
      urgency = 'warning';
    }

    return { mins, formatted, urgency };
  };

  // Metrics
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      {/* KDS Header & Metrics Bar */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-900 p-4 text-white shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/30">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight">KDS • PANTALLA DE COCINA & BRASAS</h2>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400">
                Turno: {userName}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Recepción de comandas en tiempo real ({activeOrders.length} activas)
            </p>
          </div>
        </div>

        {/* Counters */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-xl border border-stone-800 bg-stone-800/80 px-3 py-1.5 text-center">
            <span className="block text-xs font-bold uppercase text-stone-400">Nuevos</span>
            <span className="text-base font-black text-amber-400">{pendingCount}</span>
          </div>
          <div className="rounded-xl border border-stone-800 bg-stone-800/80 px-3 py-1.5 text-center">
            <span className="block text-xs font-bold uppercase text-stone-400">En Fuego</span>
            <span className="text-base font-black text-orange-400">{preparingCount}</span>
          </div>
          <div className="rounded-xl border border-stone-800 bg-stone-800/80 px-3 py-1.5 text-center">
            <span className="block text-xs font-bold uppercase text-stone-400">Listos</span>
            <span className="text-base font-black text-emerald-400">{readyCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterStatus('active')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              filterStatus === 'active'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            Todas las Activas ({activeOrders.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <span>Nuevos Tickets</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-white/20 px-1 text-[10px]">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setFilterStatus('preparing')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              filterStatus === 'preparing'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <span>En Preparación</span>
            {preparingCount > 0 && (
              <span className="rounded-full bg-white/20 px-1 text-[10px]">{preparingCount}</span>
            )}
          </button>
          <button
            onClick={() => setFilterStatus('ready')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              filterStatus === 'ready'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <span>Listos para Servir</span>
            {readyCount > 0 && (
              <span className="rounded-full bg-white/20 px-1 text-[10px]">{readyCount}</span>
            )}
          </button>
          <button
            onClick={() => setFilterStatus('delivered')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              filterStatus === 'delivered'
                ? 'bg-stone-700 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            Historial Despachados
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-700">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Sincronizado al segundo con meseros</span>
        </div>
      </div>

      {/* Tickets Display Grid */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-16 text-center">
          <ChefHat className="mx-auto h-12 w-12 text-stone-600" />
          <h3 className="mt-3 text-base font-bold text-stone-900">
            {filterStatus === 'delivered'
              ? 'No hay pedidos despachados todavía'
              : 'Sin comandas en espera'}
          </h3>
          <p className="mt-1 text-xs text-stone-700">
            Cuando un mesero envíe una orden desde el salón, aparecerá aquí instantáneamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredOrders.map((ord) => {
            const elapsed = getElapsedInfo(ord.createdAt);
            const isPending = ord.status === 'pending';
            const isPreparing = ord.status === 'preparing';
            const isReady = ord.status === 'ready';
            const isDelivered = ord.status === 'delivered';

            // Visual theme according to urgency and status
            let headerBg = 'bg-stone-900 text-white';
            let cardBorder = 'border-stone-200';
            let timerBadge = 'bg-stone-800 text-stone-200';

            if (isReady) {
              headerBg = 'bg-emerald-700 text-white';
              cardBorder = 'border-emerald-400 ring-2 ring-emerald-400';
              timerBadge = 'bg-emerald-900 text-emerald-100';
            } else if (elapsed.urgency === 'critical') {
              headerBg = 'bg-red-800 text-white animate-pulse';
              cardBorder = 'border-red-500 ring-2 ring-red-400';
              timerBadge = 'bg-red-950 text-red-200 font-black';
            } else if (elapsed.urgency === 'warning') {
              headerBg = 'bg-amber-800 text-white';
              cardBorder = 'border-amber-400';
              timerBadge = 'bg-amber-950 text-amber-200';
            } else if (isPreparing) {
              headerBg = 'bg-orange-800 text-white';
              cardBorder = 'border-orange-300';
              timerBadge = 'bg-orange-950 text-orange-200';
            }

            return (
              <div
                key={ord.id}
                className={`flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${cardBorder}`}
              >
                {/* Ticket Top Header */}
                <div>
                  <div className={`p-3.5 ${headerBg}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black">MESA {ord.tableNumber}</span>
                        <span className="rounded bg-black/30 px-1.5 py-0.5 text-xs font-bold">
                          #{ord.orderNumber}
                        </span>
                      </div>
                      {/* Live Elapsed Timer */}
                      <div
                        className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-mono font-bold ${timerBadge}`}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{elapsed.formatted}</span>
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] opacity-90">
                      <span>Mesero: {ord.waiterName}</span>
                      <span>
                        {new Date(ord.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-3.5 space-y-2.5">
                    {ord.items.map((it) => {
                      const isChecked = !!checkedItems[it.id];

                      return (
                        <div
                          key={it.id}
                          onClick={() => toggleItemCheck(it.id)}
                          className={`cursor-pointer rounded-xl border p-2.5 transition-colors ${
                            isChecked
                              ? 'border-stone-200 bg-stone-50 opacity-50 line-through'
                              : 'border-stone-200 bg-white hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 shrink-0 text-stone-600">
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-stone-900">
                                  <span className="text-amber-600 font-extrabold mr-1">
                                    {it.quantity}x
                                  </span>
                                  {it.productName}
                                </span>
                              </div>

                              {/* Doneness Tag (High contrast for meat cooks) */}
                              {it.doneness && (
                                <div className="mt-1">
                                  <span
                                    className={`inline-block rounded-md px-2 py-0.5 text-xs font-extrabold tracking-wide ${
                                      it.doneness.includes('Azul')
                                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                        : it.doneness.includes('Medio')
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : it.doneness.includes('Tres Cuartos')
                                        ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                        : 'bg-stone-200 text-stone-900 border border-stone-400'
                                    }`}
                                  >
                                    🔥 {it.doneness.toUpperCase()}
                                  </span>
                                </div>
                              )}

                              {/* Item Note */}
                              {it.notes && (
                                <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-900">
                                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                                  <span>{it.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* General Order Notes */}
                    {ord.notes && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-950">
                        <span className="font-bold">Nota de Comanda:</span> {ord.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="border-t border-stone-100 p-3 bg-stone-50/50">
                  {isPending && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'preparing')}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-700 active:scale-[0.99]"
                    >
                      <Flame className="h-4 w-4" />
                      <span>Iniciar Preparación / A Fuego</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'ready')}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-[0.99] animate-pulse"
                    >
                      <BellRing className="h-4 w-4" />
                      <span>¡Listo para Servir! (Avisar a Mesero)</span>
                    </button>
                  )}

                  {isReady && (
                    <div className="space-y-1.5">
                      <div className="rounded-lg bg-emerald-100 px-2 py-1 text-center text-xs font-bold text-emerald-900">
                        ✓ Mesero notificado para recoger
                      </div>
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'delivered')}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-2 text-xs font-bold text-white hover:bg-stone-800"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Marcar como Despachado</span>
                      </button>
                    </div>
                  )}

                  {isDelivered && (
                    <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-stone-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Despachado a las {ord.deliveredAt ? new Date(ord.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
