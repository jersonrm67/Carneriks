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
  KeyRound,
  ShieldCheck,
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

  const sampleSqlSchema = `-- Esquema SQL Relacional SQLite / PostgreSQL para Carneriks
CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  usuario TEXT UNIQUE NOT NULL,
  contrasena_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('mesero', 'cocina', 'administrador')),
  activo INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TEXT NOT NULL
);

CREATE TABLE mesas (
  id TEXT PRIMARY KEY,
  numero INTEGER UNIQUE NOT NULL,
  capacidad INTEGER NOT NULL DEFAULT 4,
  estado TEXT NOT NULL CHECK(estado IN ('libre', 'ocupada')),
  activa INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE platos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio REAL NOT NULL,
  imagen TEXT,
  categoria TEXT NOT NULL,
  cantidad_disponible INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 3,
  disponible INTEGER NOT NULL DEFAULT 1,
  activo INTEGER NOT NULL DEFAULT 1,
  supports_doneness INTEGER DEFAULT 0,
  cut_weight TEXT,
  badge TEXT,
  fecha_creacion TEXT NOT NULL
);

CREATE TABLE pedidos (
  id TEXT PRIMARY KEY,
  numero_pedido INTEGER UNIQUE NOT NULL,
  mesa_id TEXT NOT NULL REFERENCES mesas(id) ON DELETE RESTRICT,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  estado TEXT NOT NULL CHECK(estado IN ('pendiente', 'enviado', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
  total REAL NOT NULL DEFAULT 0.0,
  notas TEXT,
  fecha_creacion TEXT NOT NULL,
  fecha_actualizacion TEXT NOT NULL
);

CREATE TABLE detalle_pedidos (
  id TEXT PRIMARY KEY,
  pedido_id TEXT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  plato_id TEXT NOT NULL REFERENCES platos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  termino TEXT,
  notas TEXT
);`;

  const copySchema = () => {
    navigator.clipboard.writeText(sampleSqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-stone-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Base de Datos Relacional Carneriks
              </h3>
              <p className="text-xs text-stone-600">
                Persistencia en archivo SQLite con transacciones ACID y sincronización SSE en tiempo real
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
            Estado en Vivo & Tablas
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'schema'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Esquema SQL (5 Tablas)
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'api'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            API REST & SSE
          </button>
        </div>

        {/* Tab Content: Status */}
        {activeTab === 'status' && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
                <div className="flex items-center justify-between text-xs text-stone-700 font-medium">
                  <span>Motor Relacional</span>
                  <Activity className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-1 text-sm font-black text-stone-900">
                  SQLite ACID Relacional
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>data/carneriks.sqlite</span>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
                <div className="flex items-center justify-between text-xs text-stone-700 font-medium">
                  <span>Latencia de Consulta</span>
                  <Server className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-1 text-sm font-black text-stone-900">
                  {dbStatus.lastPingMs} ms
                </div>
                <div className="mt-0.5 text-[11px] text-stone-600">
                  Consultas directas a disco
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
                <div className="flex items-center justify-between text-xs text-stone-700 font-medium">
                  <span>Conexiones SSE en Vivo</span>
                  <Layers className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-1 text-sm font-black text-stone-900">
                  {dbStatus.activeConnections} cliente(s)
                </div>
                <div className="mt-0.5 text-[11px] text-stone-600">
                  Sincronización multi-dispositivo
                </div>
              </div>
            </div>

            {/* Table Counts */}
            <div className="rounded-xl border border-stone-200 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
                Registros en Base de Datos
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-lg bg-stone-50 p-2.5">
                  <div className="text-lg font-black text-stone-900">{tables.length}</div>
                  <div className="text-[11px] font-semibold text-stone-700">mesas</div>
                </div>
                <div className="rounded-lg bg-stone-50 p-2.5">
                  <div className="text-lg font-black text-stone-900">{products.length}</div>
                  <div className="text-[11px] font-semibold text-stone-700">platos (stock)</div>
                </div>
                <div className="rounded-lg bg-stone-50 p-2.5">
                  <div className="text-lg font-black text-stone-900">{orders.length}</div>
                  <div className="text-[11px] font-semibold text-stone-700">pedidos</div>
                </div>
                <div className="rounded-lg bg-stone-50 p-2.5">
                  <div className="text-lg font-black text-stone-900">7</div>
                  <div className="text-[11px] font-semibold text-stone-700">usuarios (auth)</div>
                </div>
              </div>
            </div>

            {/* Reset Action */}
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
              <div>
                <h4 className="text-xs font-bold text-amber-900">Restablecer Datos de Demostración</h4>
                <p className="text-[11px] text-amber-700">
                  Restaura el archivo SQLite a los platos, mesas y pedidos iniciales con contraseñas seguras.
                </p>
              </div>
              <button
                onClick={resetDemoData}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Restablecer BD</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Content: Schema */}
        {activeTab === 'schema' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">
                Estructura DDL de tablas y claves foráneas
              </span>
              <button
                onClick={copySchema}
                className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar DDL'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-stone-900 p-3.5 text-[11px] font-mono leading-relaxed text-stone-200">
              {sampleSqlSchema}
            </pre>
          </div>
        )}

        {/* Tab Content: API */}
        {activeTab === 'api' && (
          <div className="mt-4 space-y-2 text-xs">
            <div className="font-bold text-stone-800">Endpoints Relacionales Expuestos:</div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded-lg bg-stone-50 p-2">
                <span className="font-bold text-emerald-700">POST /api/auth/login</span>
                <span className="text-stone-600 font-sans">Valida contraseñas con bcryptjs en tabla usuarios</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-stone-50 p-2">
                <span className="font-bold text-blue-700">GET /api/mesas</span>
                <span className="text-stone-600 font-sans">Lista mesas con estado (libre/ocupada)</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-stone-50 p-2">
                <span className="font-bold text-blue-700">GET /api/platos</span>
                <span className="text-stone-600 font-sans">Lista platos con cantidad_disponible y stock_minimo</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-stone-50 p-2">
                <span className="font-bold text-amber-700">POST /api/pedidos</span>
                <span className="text-stone-600 font-sans">Transacción ACID: valida stock, reduce inventario, ocupa mesa</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-stone-50 p-2">
                <span className="font-bold text-purple-700">PATCH /api/pedidos/:id/estado</span>
                <span className="text-stone-600 font-sans">Transiciones: pendiente → en_preparacion → listo → entregado</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-stone-50 p-2">
                <span className="font-bold text-orange-700">GET /api/events</span>
                <span className="text-stone-600 font-sans">Canal SSE en tiempo real a todos los dispositivos</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
