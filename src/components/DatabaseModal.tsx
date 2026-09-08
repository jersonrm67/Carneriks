import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import {
  Database,
  X,
  CheckCircle2,
  Activity,
  Layers,
  Code2,
  Copy,
  Check,
  Server,
  RefreshCw,
} from 'lucide-react';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose }) => {
  const { dbStatus, isConnected, orders, products, tables, resetDemoData } = useRestaurant();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'schema' | 'api'>('status');

  if (!isOpen) return null;

  const jsonSample = {
    carneriks_database: {
      status: 'online',
      driver: 'Server-Sent-Events (SSE) + REST Realtime Hub',
      realtime_latency_ms: dbStatus.lastPingMs,
      tables: {
        products: products.length,
        orders: orders.length,
        tables: tables.length,
      },
      endpoints: [
        'GET /api/events (SSE Stream)',
        'GET/POST /api/orders',
        'PATCH /api/orders/:id/status',
        'GET/PATCH /api/products',
        'GET/PATCH /api/tables',
      ],
    },
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonSample, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-stone-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Vinculación de Base de Datos en Tiempo Real
              </h3>
              <p className="text-xs text-stone-700">
                Arquitectura operativa de sincronización instantánea Carneriks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mt-4 flex gap-2 border-b border-stone-100 pb-3">
          <button
            onClick={() => setActiveTab('status')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'status'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Estado en Vivo & Latencia
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'schema'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Estructura de Datos
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'api'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            APIs & Endpoints
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-bold">
                    Conexión en Tiempo Real Activa & Sincronizada
                  </span>
                </div>
                <p className="mt-1 text-xs text-emerald-900">
                  Al entrar a la página, todos los dispositivos se conectan automáticamente al flujo de
                  eventos en vivo. Cuando un mesero envía una orden, la cocina la recibe en menos de
                  1 segundo (latencia promedio: {dbStatus.lastPingMs} ms).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <span className="block text-xs text-stone-700">Canal SSE</span>
                  <span className="text-sm font-black text-stone-900">/api/events</span>
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <span className="block text-xs text-stone-700">Tiempo de Entrega</span>
                  <span className="text-sm font-black text-emerald-600">&lt; 50ms</span>
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <span className="block text-xs text-stone-700">Dispositivos en Red</span>
                  <span className="text-sm font-black text-stone-900">
                    {dbStatus.activeConnections} Pantalla(s)
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 p-3">
                <h4 className="text-xs font-bold uppercase text-stone-600">
                  Compatibilidad de Base de Datos
                </h4>
                <p className="mt-1 text-xs text-stone-700">
                  El sistema utiliza una capa desacoplada (`StoreManager`) que ya implementa los modelos
                  relacionales para persistencia duradera en <strong>PostgreSQL</strong>,{' '}
                  <strong>Cloud SQL</strong>, <strong>Supabase</strong> o <strong>Firestore</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">
                  Colecciones / Tablas Vinculadas:
                </span>
                <button
                  onClick={copyJson}
                  className="flex items-center gap-1 rounded bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar Resumen'}</span>
                </button>
              </div>

              <pre className="max-h-60 overflow-y-auto rounded-xl bg-stone-900 p-3.5 text-xs font-mono text-stone-200">
                {JSON.stringify(jsonSample, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-2 text-xs">
              <div className="rounded-lg border border-stone-200 p-2.5">
                <div className="font-mono font-bold text-stone-900">
                  <span className="text-emerald-600 font-bold mr-1.5">GET</span>/api/events
                </div>
                <p className="text-stone-700">
                  Flujo Server-Sent Events (SSE) para recibir tickets, cambios de estado y stock en tiempo real.
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 p-2.5">
                <div className="font-mono font-bold text-stone-900">
                  <span className="text-amber-600 font-bold mr-1.5">POST</span>/api/orders
                </div>
                <p className="text-stone-700">
                  Crea una nueva orden por mesa, descuenta stock de la carta y la proyecta a cocina instantáneamente.
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 p-2.5">
                <div className="font-mono font-bold text-stone-900">
                  <span className="text-sky-600 font-bold mr-1.5">PATCH</span>/api/orders/:id/status
                </div>
                <p className="text-stone-700">
                  Cambia el estado de la comanda (pending → preparing → ready → delivered).
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
