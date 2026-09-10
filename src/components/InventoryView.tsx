import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Product, ProductCategory } from '../types';
import {
  Package,
  Database,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Activity,
  Server,
  Layers,
  Sparkles,
  AlertCircle,
  Table,
  Utensils,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { TableDataExplorer } from './TableDataExplorer';
import { CreatePlatoModal } from './CreatePlatoModal';
import { CreateTableModal } from './CreateTableModal';

export const InventoryView: React.FC = () => {
  const {
    products,
    updateStock,
    updateProduct,
    deleteProduct,
    tables,
    updateTableStatus,
    deleteTable,
    orders,
    createOrder,
    clearCompletedOrders,
    dbStatus,
    resetDemoData,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'platos' | 'mesas' | 'pedidos' | 'explorador'>('platos');
  const [selectedCat, setSelectedCat] = useState<ProductCategory | 'all'>('all');
  const [isCreatePlatoOpen, setIsCreatePlatoOpen] = useState(false);
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [clearingOrders, setClearingOrders] = useState(false);
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);

  // Editable price/stock state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const filteredProducts = products.filter(
    (p) => selectedCat === 'all' || p.category === selectedCat
  );

  const handleStockDelta = (prod: Product, delta: number) => {
    const newStock = Math.max(0, prod.stock + delta);
    updateStock(prod.id, newStock, newStock > 0);
  };

  const handleToggleAvailable = (prod: Product) => {
    updateStock(prod.id, prod.isAvailable ? 0 : 15, !prod.isAvailable);
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (window.confirm(`¿Seguro que deseas eliminar "${prod.name}" de la base de datos?`)) {
      await deleteProduct(prod.id);
    }
  };

  const handleSavePrice = async (prod: Product) => {
    const numPrice = Number(tempPrice);
    if (!isNaN(numPrice) && numPrice > 0) {
      await updateProduct(prod.id, { price: numPrice });
    }
    setEditingPriceId(null);
  };

  const handleDeleteTable = async (tableNum: number) => {
    if (window.confirm(`¿Seguro que deseas eliminar la Mesa ${tableNum} de la base de datos?`)) {
      await deleteTable(tableNum);
    }
  };

  const handleClearOrders = async () => {
    setClearingOrders(true);
    const count = await clearCompletedOrders();
    setClearedNotice(`Se archivaron y limpiaron ${count} pedidos completados o cancelados.`);
    setTimeout(() => setClearedNotice(null), 3500);
    setClearingOrders(false);
  };

  const handleSimulateExternalOrder = async () => {
    setIsSimulating(true);
    const freeTable = tables.find((t) => t.status === 'free') || tables[0];
    const meats = products.filter((p) => p.category === 'carnes');
    const sides = products.filter((p) => p.category === 'entradas_guarniciones');

    const randomMeat = meats[Math.floor(Math.random() * meats.length)];
    const randomSide = sides[Math.floor(Math.random() * sides.length)];
    const meatPrice = randomMeat?.price || 32;
    const sidePrice = randomSide?.price || 0;

    try {
      await createOrder({
        tableNumber: freeTable?.number || 1,
        waiterName: 'Tablet Salón B',
        items: [
          {
            id: `sim-${Date.now()}-1`,
            productId: randomMeat?.id || products[0]?.id || '1',
            productName: randomMeat?.name || 'Corte a la Parrilla',
            quantity: 1,
            unitPrice: meatPrice,
            doneness: 'Término Medio',
            notes: 'Enviado desde tablet remota de prueba',
          },
          ...(randomSide
            ? [
                {
                  id: `sim-${Date.now()}-2`,
                  productId: randomSide.id,
                  productName: randomSide.name,
                  quantity: 1,
                  unitPrice: sidePrice,
                },
              ]
            : []),
        ],
        totalAmount: meatPrice + sidePrice,
        notes: 'Pedido de verificación en Firebase Firestore',
      });
    } catch (e) {
      console.error(e);
    }
    setIsSimulating(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      {/* Top Banner: Database Activity and Telemetry */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Motor en Tiempo Real */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900">Motor en Tiempo Real</h3>
                <p className="text-[10px] text-stone-500">Firebase Firestore Sync</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping"></span>
              En Vivo
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-2.5 text-center">
            <div>
              <span className="block text-[10px] text-stone-500">Latencia</span>
              <span className="text-xs font-black text-stone-900">{dbStatus.lastPingMs} ms</span>
            </div>
            <div>
              <span className="block text-[10px] text-stone-500">Comandas Hoy</span>
              <span className="text-xs font-black text-stone-900">{dbStatus.totalOrdersToday}</span>
            </div>
          </div>
        </div>

        {/* Total Platos en BD */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Utensils className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900">Platos en Carta</h3>
                <p className="text-[10px] text-stone-500">Firebase Cloud Firestore</p>
              </div>
            </div>
            <span className="text-sm font-black text-stone-900">{products.length} platos</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs text-stone-600">
            <span>Agotados: {products.filter((p) => !p.isAvailable || p.stock === 0).length}</span>
            <button
              onClick={() => setIsCreatePlatoOpen(true)}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800"
            >
              + Nuevo Plato
            </button>
          </div>
        </div>

        {/* Mesas del Salón */}
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Table className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900">Mesas Operativas</h3>
                <p className="text-[10px] text-stone-500">Capacidad Total</p>
              </div>
            </div>
            <span className="text-sm font-black text-stone-900">{tables.length} mesas</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs text-stone-600">
            <span className="text-emerald-700 font-bold">{tables.filter((t) => t.status === 'free').length} Libres</span>
            <span className="text-amber-700 font-bold">{tables.filter((t) => t.status === 'occupied').length} Ocupadas</span>
          </div>
        </div>

        {/* Quick Simulator & Reset */}
        <div className="rounded-2xl border border-stone-200 bg-stone-900 p-4 text-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Zap className="h-4 w-4" />
              <span>Prueba Rápida</span>
            </div>
            <button
              onClick={resetDemoData}
              title="Restablecer base de datos a valores iniciales"
              className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
          <button
            onClick={handleSimulateExternalOrder}
            disabled={isSimulating}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-400 active:scale-95 transition-all shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isSimulating ? 'Insertando...' : 'Crear Pedido de Prueba'}</span>
          </button>
        </div>
      </div>

      {clearedNotice && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{clearedNotice}</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('platos')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === 'platos'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>Catálogo de Platos ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mesas')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === 'mesas'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Mesas del Salón ({tables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === 'pedidos'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Historial de Pedidos ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('explorador')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === 'explorador'
                ? 'bg-stone-900 text-white shadow-md'
                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-amber-500" />
            <span>Explorador Firestore</span>
          </button>
        </div>

        {/* Context Action Button */}
        {activeTab === 'platos' && (
          <button
            onClick={() => setIsCreatePlatoOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-700 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Plato en Firestore</span>
          </button>
        )}

        {activeTab === 'mesas' && (
          <button
            onClick={() => setIsCreateTableOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-700 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Mesa a Firestore</span>
          </button>
        )}

        {activeTab === 'pedidos' && (
          <button
            onClick={handleClearOrders}
            disabled={clearingOrders || orders.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
            <span>{clearingOrders ? 'Limpiando...' : 'Limpiar Pedidos Completados'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: Platos & Catálogo */}
      {activeTab === 'platos' && (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs animate-in fade-in">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Gestión Directa de Platos e Inventario en BD
              </h2>
              <p className="text-xs text-stone-500">
                Crea, edita precios, ajusta el stock o elimina productos de la carta en tiempo real.
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'carnes', 'entradas_guarniciones', 'bebidas', 'postres'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                      selectedCat === cat
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat === 'all'
                      ? 'Todos'
                      : cat === 'carnes'
                      ? 'Carnes'
                      : cat === 'entradas_guarniciones'
                      ? 'Guarniciones'
                      : cat}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/70 text-stone-600 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Plato</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3">Precio</th>
                  <th className="py-2.5 px-3">Stock Actual</th>
                  <th className="py-2.5 px-3">Ajustar Stock</th>
                  <th className="py-2.5 px-3">Disponibilidad</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((prod) => {
                  const isLow = prod.stock > 0 && prod.stock <= 5;
                  const isOut = !prod.isAvailable || prod.stock === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900">{prod.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {prod.cutWeight && (
                            <span className="text-[10px] text-stone-500 font-medium">
                              {prod.cutWeight}
                            </span>
                          )}
                          {prod.supportsDoneness && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 border border-amber-200">
                              Término
                            </span>
                          )}
                          {prod.badge && (
                            <span className="rounded bg-stone-100 px-1.5 py-0.2 text-[9px] font-bold text-stone-700">
                              {prod.badge}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-700">
                          {prod.category}
                        </span>
                      </td>

                      {/* Editable Price */}
                      <td className="py-3 px-3">
                        {editingPriceId === prod.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-16 rounded border border-amber-400 px-1.5 py-0.5 text-xs font-bold text-stone-900"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePrice(prod)}
                              className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-amber-700"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="text-[10px] text-stone-400 hover:text-stone-600"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingPriceId(prod.id);
                              setTempPrice(String(prod.price));
                            }}
                            title="Haz clic para editar precio"
                            className="cursor-pointer font-bold text-stone-900 hover:text-amber-700 flex items-center gap-1 group"
                          >
                            <span>${prod.price.toFixed(2)}</span>
                            <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 text-stone-400" />
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-black ${
                              isOut
                                ? 'text-red-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-stone-900'
                            }`}
                          >
                            {prod.stock} unids.
                          </span>
                          {isLow && (
                            <span className="rounded bg-amber-100 px-1 py-0.2 text-[10px] font-bold text-amber-900">
                              Bajo
                            </span>
                          )}
                          {isOut && (
                            <span className="rounded bg-red-100 px-1 py-0.2 text-[10px] font-bold text-red-900">
                              Agotado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Adjustments */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStockDelta(prod, -5)}
                            className="rounded border border-stone-200 bg-white px-1.5 py-0.5 font-bold hover:bg-stone-100 text-stone-700"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleStockDelta(prod, -1)}
                            className="rounded border border-stone-200 bg-white px-1.5 py-0.5 font-bold hover:bg-stone-100 text-stone-700"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleStockDelta(prod, 1)}
                            className="rounded border border-stone-200 bg-white px-1.5 py-0.5 font-bold hover:bg-stone-100 text-stone-700"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleStockDelta(prod, 5)}
                            className="rounded border border-stone-200 bg-white px-1.5 py-0.5 font-bold hover:bg-stone-100 text-stone-700"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      {/* Availability Toggle */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleAvailable(prod)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                            prod.isAvailable && prod.stock > 0
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {prod.isAvailable && prod.stock > 0 ? 'Disponible' : 'Marcar Agotado'}
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteProduct(prod)}
                          title="Eliminar plato de la base de datos"
                          className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: Mesas */}
      {activeTab === 'mesas' && (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs animate-in fade-in">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Mesas Registradas en la Base de Datos
              </h2>
              <p className="text-xs text-stone-500">
                Administra los puestos y mesas del salón. Sincronizado en tiempo real con las tablets de mesero.
              </p>
            </div>
            <button
              onClick={() => setIsCreateTableOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Agregar Mesa</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tables.map((t) => {
              const isOccupied = t.status === 'occupied';
              return (
                <div
                  key={t.number}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                    isOccupied
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-stone-200 bg-stone-50/60 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-black text-stone-900">Mesa {t.number}</div>
                      <div className="text-[11px] text-stone-500">{t.capacity || 4} comensales</div>
                    </div>
                    <button
                      onClick={() => handleDeleteTable(t.number)}
                      title="Eliminar mesa de la BD"
                      className="text-stone-400 hover:text-red-600 p-0.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={() => updateTableStatus(t.number, isOccupied ? 'free' : 'occupied')}
                      className={`w-full rounded-lg py-1 text-xs font-bold transition-colors ${
                        isOccupied
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {isOccupied ? 'Ocupada' : 'Libre'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: Pedidos Registrados */}
      {activeTab === 'pedidos' && (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs animate-in fade-in">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Historial de Pedidos en Firebase Firestore
              </h2>
              <p className="text-xs text-stone-500">
                Todas las comandas emitidas, con su desglose de platos, importes y estados operativos.
              </p>
            </div>
            <button
              onClick={handleClearOrders}
              disabled={clearingOrders || orders.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span>Limpiar Completados</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500">
              No hay pedidos registrados en este momento. Emite un pedido desde la pantalla de Mesero o presiona "Crear Pedido de Prueba".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50/70 text-stone-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Ticket</th>
                    <th className="py-2.5 px-3">Mesa</th>
                    <th className="py-2.5 px-3">Mesero</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Items</th>
                    <th className="py-2.5 px-3">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((order) => {
                    const statusColors: Record<string, string> = {
                      pending: 'bg-amber-100 text-amber-800',
                      preparing: 'bg-orange-100 text-orange-800',
                      ready: 'bg-emerald-100 text-emerald-800',
                      delivered: 'bg-stone-100 text-stone-700',
                      cancelled: 'bg-red-100 text-red-800',
                    };
                    const statusLabels: Record<string, string> = {
                      pending: 'Pendiente',
                      preparing: 'En Marcha',
                      ready: 'Listo para Servir',
                      delivered: 'Entregado',
                      cancelled: 'Cancelado',
                    };

                    return (
                      <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">
                          #{order.orderNumber || order.id.slice(-4)}
                        </td>
                        <td className="py-3 px-3 font-bold text-stone-900">
                          Mesa {order.tableNumber}
                        </td>
                        <td className="py-3 px-3 text-stone-700">
                          {order.waiterName}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              statusColors[order.status] || 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {statusLabels[order.status] || order.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-stone-900">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-stone-600 max-w-xs truncate">
                          {order.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                        </td>
                        <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: Explorador SQL en Vivo */}
      {activeTab === 'explorador' && (
        <div className="animate-in fade-in">
          <TableDataExplorer />
        </div>
      )}

      {/* Modales para crear plato y mesa */}
      <CreatePlatoModal
        isOpen={isCreatePlatoOpen}
        onClose={() => setIsCreatePlatoOpen(false)}
      />

      <CreateTableModal
        isOpen={isCreateTableOpen}
        onClose={() => setIsCreateTableOpen(false)}
      />
    </div>
  );
};
