import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Product, ProductCategory } from '../types';
import {
  Package,
  Database,
  Plus,
  Minus,
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
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { products, updateStock, dbStatus, resetDemoData, sendOrder, tables } = useRestaurant();
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedCat, setSelectedCat] = useState<ProductCategory | 'all'>('all');

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

  const handleSimulateExternalOrder = async () => {
    setIsSimulating(true);
    // Find free table or random table
    const freeTable = tables.find((t) => t.status === 'free') || tables[0];
    const meats = products.filter((p) => p.category === 'carnes');
    const sides = products.filter((p) => p.category === 'entradas_guarniciones');

    const randomMeat = meats[Math.floor(Math.random() * meats.length)];
    const randomSide = sides[Math.floor(Math.random() * sides.length)];

    const payload = {
      tableNumber: freeTable.number,
      waiterName: 'Tablet Salón B',
      items: [
        {
          productId: randomMeat.id,
          quantity: 1,
          doneness: 'Término Medio',
          notes: 'Enviado desde tablet remota de prueba',
        },
        randomSide
          ? {
              productId: randomSide.id,
              quantity: 1,
            }
          : undefined,
      ].filter(Boolean) as any[],
      notes: 'Pedido automático de verificación de tiempo real',
    };

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error(e);
    }
    setIsSimulating(false);
  };

  const sampleSqlSchema = `-- Esquema SQL Relacional para Carneriks (PostgreSQL / MySQL)
CREATE TABLE products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  supports_doneness BOOLEAN DEFAULT FALSE,
  cut_weight VARCHAR(32)
);

CREATE TABLE restaurant_tables (
  number INT PRIMARY KEY,
  capacity INT DEFAULT 4,
  status VARCHAR(32) DEFAULT 'free',
  active_order_id VARCHAR(64)
);

CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number SERIAL,
  table_number INT REFERENCES restaurant_tables(number),
  waiter_name VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, preparing, ready, delivered
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preparing_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE TABLE order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  doneness VARCHAR(64),
  notes TEXT
);`;

  const copySchemaToClipboard = () => {
    navigator.clipboard.writeText(sampleSqlSchema);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      {/* Overview Banner */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Real-Time Sync Telemetry */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Motor en Tiempo Real</h3>
                <p className="text-[11px] text-stone-700">SSE + Broadcast Stream Activo</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping"></span>
              En Vivo
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-stone-100 pt-3 text-center">
            <div>
              <span className="block text-[11px] text-stone-700">Latencia</span>
              <span className="text-sm font-extrabold text-stone-900">{dbStatus.lastPingMs} ms</span>
            </div>
            <div>
              <span className="block text-[11px] text-stone-700">Pantallas</span>
              <span className="text-sm font-extrabold text-stone-900">
                {dbStatus.activeConnections} Conectadas
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-stone-700">Comandas Hoy</span>
              <span className="text-sm font-extrabold text-stone-900">{dbStatus.totalOrdersToday}</span>
            </div>
          </div>
        </div>

        {/* Database Readiness */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Estado de Base de Datos</h3>
                <p className="text-[11px] text-stone-700">Esquema 100% Preparado</p>
              </div>
            </div>
            <span className="rounded-lg bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700">
              Listo para BD
            </span>
          </div>

          <div className="mt-3 text-xs text-stone-700">
            Los datos de cartas, mesas y tickets están organizados con claves relacionales,
            timestamps automáticos e índices listos para enlazar a PostgreSQL o Firestore.
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={copySchemaToClipboard}
              className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
            >
              {copiedSchema ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedSchema ? '¡Esquema Copiado!' : 'Copiar DDL SQL'}</span>
            </button>
            <button
              onClick={resetDemoData}
              className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Restablecer Demo</span>
            </button>
          </div>
        </div>

        {/* Quick Test Simulator */}
        <div className="rounded-2xl border border-stone-200 bg-linear-to-br from-stone-900 to-stone-800 p-5 text-white shadow-xs">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Prueba de Sincronización</h3>
          </div>
          <p className="mt-1 text-xs text-stone-300">
            Simula un pedido entrante desde otra tablet o mesero. Abre la pestaña de Cocina en otra
            ventana para ver cómo entra en menos de 1 segundo.
          </p>
          <button
            onClick={handleSimulateExternalOrder}
            disabled={isSimulating}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-stone-950 shadow-md hover:bg-amber-400 active:scale-95 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isSimulating ? 'Transmitiendo...' : 'Simular Pedido Externo a Cocina'}</span>
          </button>
        </div>
      </div>

      {/* Basic Inventory Management (PRD MVP) */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Catálogo & Gestión Básica de Inventario
            </h2>
            <p className="text-xs text-stone-700">
              Cualquier cambio de disponibilidad o stock se actualiza instantáneamente en los tablets
              de todos los meseros.
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

        {/* Table of Products */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50/70 text-stone-600 uppercase">
              <tr>
                <th className="py-2.5 px-3">Plato / Producto</th>
                <th className="py-2.5 px-3">Categoría</th>
                <th className="py-2.5 px-3">Precio</th>
                <th className="py-2.5 px-3">Stock Actual</th>
                <th className="py-2.5 px-3">Ajustar Stock</th>
                <th className="py-2.5 px-3 text-right">Disponibilidad</th>
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
                      {prod.cutWeight && (
                        <span className="text-[10px] text-stone-700">
                          Peso de corte: {prod.cutWeight}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-700">
                        {prod.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-bold text-stone-900">
                      ${prod.price.toFixed(2)}
                    </td>

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

                    {/* Stock adjustments */}
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

                    {/* Toggle Availability */}
                    <td className="py-3 px-3 text-right">
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
