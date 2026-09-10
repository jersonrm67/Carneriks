import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Product, ProductCategory, CookingDoneness, RestaurantTable } from '../types';
import { DonenessModal } from './DonenessModal';
import {
  Flame,
  Plus,
  Minus,
  Trash2,
  Send,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  ShoppingBag,
  BellRing,
  UtensilsCrossed,
  ChefHat,
} from 'lucide-react';

export const WaiterView: React.FC = () => {
  const {
    products,
    tables,
    orders,
    selectedTable,
    setSelectedTable,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQty,
    clearCart,
    sendOrder,
    updateOrderStatus,
    userName,
    orderErrorMessage,
    setOrderErrorMessage,
  } = useRestaurant();

  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'menu' | 'active_orders'>('menu');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Meat doneness modal state
  const [selectedProductForDoneness, setSelectedProductForDoneness] = useState<Product | null>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Active orders for tables
  const myActiveOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  );

  const readyOrdersForWaiters = myActiveOrders.filter((o) => o.status === 'ready');

  // Handle clicking a product
  const handleProductClick = (product: Product) => {
    if (!product.isAvailable || product.stock <= 0) return;

    if (product.supportsDoneness) {
      setSelectedProductForDoneness(product);
    } else {
      addToCart({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
      });
    }
  };

  // Handle confirming doneness modal
  const handleConfirmDoneness = (doneness: CookingDoneness, notes: string) => {
    if (!selectedProductForDoneness) return;

    addToCart({
      productId: selectedProductForDoneness.id,
      productName: selectedProductForDoneness.name,
      quantity: 1,
      unitPrice: selectedProductForDoneness.price,
      doneness,
      notes: notes || undefined,
    });
    setSelectedProductForDoneness(null);
  };

  // Submit Order
  const handleSendOrder = async () => {
    if (!selectedTable || cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const success = await sendOrder(orderNotes);
    setIsSubmitting(false);

    if (success) {
      setOrderNotes('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);
    }
  };

  const totalAmount = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  const categories: { id: ProductCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'Toda la Carta', icon: '📋' },
    { id: 'carnes', label: 'Cortes & Parrilla', icon: '🥩' },
    { id: 'entradas_guarniciones', label: 'Guarniciones & Entradas', icon: '🥔' },
    { id: 'bebidas', label: 'Vinos & Bebidas', icon: '🍷' },
    { id: 'postres', label: 'Postres', icon: '🍮' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      {/* Ready Alert Banner if any kitchen order is waiting to be served */}
      {readyOrdersForWaiters.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                ¡Cocina tiene {readyOrdersForWaiters.length}{' '}
                {readyOrdersForWaiters.length === 1 ? 'comanda lista' : 'comandas listas'} para recoger!
              </p>
              <p className="text-xs text-emerald-700">
                Mesas listas:{' '}
                {readyOrdersForWaiters.map((o) => `Mesa #${o.tableNumber} (Ticket #${o.orderNumber})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('active_orders')}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
          >
            Ver Pedidos Listos
          </button>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-stone-900 px-5 py-3.5 text-white shadow-2xl ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold">¡Comanda enviada a Cocina!</p>
            <p className="text-xs text-stone-300">Ticket recibido instantáneamente en la pantalla del chef.</p>
          </div>
        </div>
      )}

      {/* Mesas Bar (Horizontal selection) */}
      <section className="mb-4 rounded-2xl border border-stone-200 bg-white p-3 shadow-xs">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Seleccionar Mesa de Atención
            </h2>
          </div>
          <span className="text-xs text-stone-700">
            Mesa seleccionada actual: <strong className="text-stone-900">Mesa {selectedTable || 'Ninguna'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {tables.map((tbl) => {
            const isSelected = selectedTable === tbl.number;
            const hasReadyOrder = tbl.status === 'ready_to_serve';
            const hasOrdered = tbl.status === 'ordered';

            let statusBg = 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300';
            let label = 'Libre';

            if (hasReadyOrder) {
              statusBg = 'bg-emerald-50 border-emerald-400 text-emerald-800 animate-pulse font-bold';
              label = '¡Listo!';
            } else if (hasOrdered) {
              statusBg = 'bg-amber-50 border-amber-300 text-amber-800';
              label = 'Cocina';
            } else if (tbl.status === 'occupied') {
              statusBg = 'bg-sky-50 border-sky-300 text-sky-800';
              label = 'Ocupada';
            }

            return (
              <button
                key={tbl.number}
                onClick={() => setSelectedTable(tbl.number)}
                className={`relative flex flex-col items-center justify-center rounded-xl border p-2 transition-all ${
                  isSelected ? 'border-stone-900 bg-stone-900 text-white shadow-md' : statusBg
                }`}
              >
                {hasReadyOrder && !isSelected && (
                  <span className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
                    🔔
                  </span>
                )}
                <span className="text-xs font-black">M{tbl.number}</span>
                <span className="text-[10px] opacity-80">{isSelected ? 'Activa' : label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sub-tabs: Tomar Pedido vs Mis Comandas Activas */}
      <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('menu')}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-colors ${
              activeTab === 'menu'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Tomar Comanda (Carta)
          </button>
          <button
            onClick={() => setActiveTab('active_orders')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-bold transition-colors ${
              activeTab === 'active_orders'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>Mis Comandas Activas</span>
            {myActiveOrders.length > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[11px] font-extrabold text-white">
                {myActiveOrders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'menu' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Menu (8 cols) */}
          <div className="lg:col-span-8">
            {/* Category Filter Pills & Search */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-600" />
                <input
                  type="text"
                  placeholder="Buscar plato..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white py-1.5 pl-9 pr-3 text-xs focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredProducts.map((prod) => {
                const isOutOfStock = !prod.isAvailable || prod.stock <= 0;
                const isLowStock = prod.stock > 0 && prod.stock <= 5;

                return (
                  <div
                    key={prod.id}
                    className={`flex flex-col justify-between rounded-xl border bg-white p-3.5 transition-all ${
                      isOutOfStock
                        ? 'border-stone-200 opacity-60'
                        : 'border-stone-200 hover:border-amber-400 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-stone-900">{prod.name}</h3>
                            {prod.cutWeight && (
                              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-700">
                                {prod.cutWeight}
                              </span>
                            )}
                          </div>
                          {prod.badge && (
                            <span className="mt-0.5 inline-block text-[10px] font-semibold text-amber-700">
                              ★ {prod.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-extrabold text-stone-900">
                          ${prod.price.toFixed(2)}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs text-stone-700">
                        {prod.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5">
                      {/* Stock Info */}
                      <div className="text-[11px]">
                        {isOutOfStock ? (
                          <span className="font-semibold text-red-600">Agotado</span>
                        ) : isLowStock ? (
                          <span className="font-semibold text-amber-700">
                            ¡Solo {prod.stock} disp.!
                          </span>
                        ) : (
                          <span className="text-stone-700">{prod.stock} disponibles</span>
                        )}
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={() => handleProductClick(prod)}
                        disabled={isOutOfStock}
                        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          isOutOfStock
                            ? 'cursor-not-allowed bg-stone-100 text-stone-600'
                            : prod.supportsDoneness
                            ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-xs'
                            : 'bg-stone-900 text-white hover:bg-stone-800 shadow-xs'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{prod.supportsDoneness ? 'Término + Agregar' : 'Agregar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comanda / Cart Sidebar (4 cols) */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-white">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-stone-900">
                      Comanda • Mesa {selectedTable}
                    </h3>
                    <p className="text-[11px] text-stone-700">Mesero: {userName}</p>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs font-medium text-stone-600 hover:text-red-600"
                  >
                    Vaciar
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="my-3 max-h-80 space-y-2.5 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs font-semibold text-stone-600">
                      No hay platos en la comanda
                    </p>
                    <p className="mt-1 text-[11px] text-stone-600">
                      Selecciona cortes de carne, guarniciones o bebidas de la carta para comenzar.
                    </p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={`${item.productId}-${idx}`}
                      className="rounded-xl border border-stone-100 bg-stone-50/70 p-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-stone-900">{item.productName}</h4>
                          {item.doneness && (
                            <span className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-900">
                              🔥 {item.doneness}
                            </span>
                          )}
                          {item.notes && (
                            <p className="text-[10px] text-stone-700 italic">“{item.notes}”</p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-stone-900">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>

                      {/* Quantity Controller */}
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-stone-200/50">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartItemQty(idx, -1)}
                            className="flex h-5 w-5 items-center justify-center rounded bg-white text-stone-700 shadow-2xs hover:bg-stone-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQty(idx, 1)}
                            className="flex h-5 w-5 items-center justify-center rounded bg-white text-stone-700 shadow-2xs hover:bg-stone-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(idx)}
                          className="text-stone-600 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* General Order Notes */}
              {cart.length > 0 && (
                <div className="border-t border-stone-100 pt-2.5">
                  <label className="block text-[11px] font-semibold text-stone-700">
                    Notas Generales de la Mesa:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Mesa con prisa / Todo al mismo tiempo"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs focus:border-stone-900 focus:outline-none"
                  />
                </div>
              )}

              {/* Error Banner if DB rejected order */}
              {orderErrorMessage && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 animate-in fade-in">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <strong className="font-bold">Aviso de Base de Datos:</strong>
                    <p className="mt-0.5 text-[11px] leading-snug">{orderErrorMessage}</p>
                  </div>
                  <button
                    onClick={() => setOrderErrorMessage(null)}
                    className="text-red-500 hover:text-red-800 font-black text-sm"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Total & Submit Button */}
              <div className="mt-3 border-t border-stone-200 pt-3">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-stone-700">Total Comanda:</span>
                  <span className="text-lg font-black text-stone-900">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleSendOrder}
                  disabled={cart.length === 0 || isSubmitting || !selectedTable}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                    cart.length === 0 || isSubmitting
                      ? 'cursor-not-allowed bg-stone-100 text-stone-600'
                      : 'bg-amber-600 text-white shadow-lg shadow-amber-600/25 hover:bg-amber-700 active:scale-[0.99]'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isSubmitting
                      ? 'Enviando a Cocina...'
                      : `Enviar Comanda a Cocina (Mesa ${selectedTable})`}
                  </span>
                </button>

                <p className="mt-2 text-center text-[10px] text-stone-700">
                  ⚡ Entrega garantizada en cocina en menos de 1 segundo vía tiempo real.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mis Comandas Activas View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              Comandas en Proceso ({myActiveOrders.length})
            </h3>
            <span className="text-xs text-stone-700">
              Actualizado en tiempo real por el equipo de cocina
            </span>
          </div>

          {myActiveOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-12 text-center">
              <Clock className="mx-auto h-8 w-8 text-stone-600" />
              <p className="mt-2 text-sm font-bold text-stone-900">No hay comandas pendientes</p>
              <p className="text-xs text-stone-700">
                Las órdenes enviadas a cocina aparecerán aquí en vivo con su estado de cocción.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myActiveOrders.map((ord) => {
                const isReady = ord.status === 'ready';
                const isPreparing = ord.status === 'preparing';

                return (
                  <div
                    key={ord.id}
                    className={`rounded-2xl border bg-white p-4 shadow-xs transition-all ${
                      isReady
                        ? 'border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-400'
                        : isPreparing
                        ? 'border-amber-300'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-start justify-between border-b border-stone-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-stone-900">
                            Mesa {ord.tableNumber}
                          </span>
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
                            Ticket #{ord.orderNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-700">Mesero: {ord.waiterName}</p>
                      </div>

                      {/* Status Pill */}
                      <div>
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-extrabold text-white animate-bounce">
                            <BellRing className="h-3 w-3" />
                            ¡LISTO PARA SERVIR!
                          </span>
                        ) : isPreparing ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
                            <Flame className="h-3 w-3" />
                            En Parrilla / Fuego
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                            <Clock className="h-3 w-3" />
                            En Espera de Cocina
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="my-3 space-y-1.5">
                      {ord.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-stone-800">
                            {it.quantity}x {it.productName}
                          </span>
                          {it.doneness && (
                            <span className="rounded bg-stone-100 px-1 text-[10px] font-bold text-amber-800">
                              {it.doneness}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {ord.notes && (
                      <div className="mb-3 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                        <strong>Nota:</strong> {ord.notes}
                      </div>
                    )}

                    {/* Action if ready */}
                    {isReady && (
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'delivered')}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Confirmar Entrega en Mesa</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Doneness Modal */}
      {selectedProductForDoneness && (
        <DonenessModal
          product={selectedProductForDoneness}
          isOpen={!!selectedProductForDoneness}
          onClose={() => setSelectedProductForDoneness(null)}
          onConfirm={handleConfirmDoneness}
        />
      )}
    </div>
  );
};
