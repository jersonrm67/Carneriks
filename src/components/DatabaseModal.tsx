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
  Flame,
  Cloud,
  Table,
} from 'lucide-react';
import { firebaseConfig } from '../firebase';
import { pingFirestoreLive } from '../services/firestoreService';
import { TableDataExplorer } from './TableDataExplorer';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose }) => {
  const { dbStatus, isConnected, orders, products, tables, resetDemoData } = useRestaurant();
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'explorer' | 'collections' | 'rules' | 'config'>('status');
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<string | null>(null);

  const sampleFirebaseConfigCode = `// Firebase JS SDK v11 - Base de Datos Única para Carneriks
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "${firebaseConfig.apiKey}",
  authDomain: "${firebaseConfig.authDomain}",
  projectId: "${firebaseConfig.projectId}",
  storageBucket: "${firebaseConfig.storageBucket}",
  messagingSenderId: "${firebaseConfig.messagingSenderId}",
  appId: "${firebaseConfig.appId}",
  measurementId: "${firebaseConfig.measurementId}"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);`;

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Platos: Catálogo de cortes a la parrilla, guarniciones y bebidas
    match /platos/{platoId} {
      allow read: if true;
      allow write: if true;
    }

    // Mesas: Distribución física y estado en tiempo real (libre / ocupada)
    match /mesas/{mesaId} {
      allow read: if true;
      allow write: if true;
    }

    // Pedidos: Comandas sincronizadas al instante entre meseros y cocina
    match /pedidos/{pedidoId} {
      allow read: if true;
      allow write: if true;
    }

    // Usuarios: Personal autorizado (meseros, cocineros, administradores)
    match /usuarios/{usuarioId} {
      allow read: if true;
      allow write: if true;
    }
  }
}`;

  const copyConfig = () => {
    navigator.clipboard.writeText(sampleFirebaseConfigCode);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const copyRules = () => {
    navigator.clipboard.writeText(firestoreRulesCode);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  const handleTestFirebase = async () => {
    setTestingFirebase(true);
    setFirebaseTestResult(null);
    try {
      const res = await pingFirestoreLive();
      setFirebaseTestResult(res.message);
    } catch (e: any) {
      setFirebaseTestResult(e.message || 'Error al conectar con Firebase');
    } finally {
      setTestingFirebase(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-stone-200 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">
                  Base de Datos Única: Firebase Cloud Firestore
                </h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                  Exclusiva
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Instancia en la nube: <code className="font-mono text-amber-800 font-bold">{firebaseConfig.projectId}</code> con sincronización en tiempo real vía WebSockets & listeners
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
        <div className="mt-4 flex flex-wrap gap-2 border-b border-stone-100 pb-3">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'status'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Estado en Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'explorer'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Table className="h-3.5 w-3.5 text-amber-600" />
            <span>Explorador de Colecciones</span>
          </button>

          <button
            onClick={() => setActiveTab('collections')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'collections'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Colecciones NoSQL</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'rules'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Reglas de Seguridad</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === 'config'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Configuración SDK</span>
          </button>
        </div>

        {/* Tab Content: Status */}
        {activeTab === 'status' && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
                <div className="flex items-center justify-between text-xs text-stone-700 font-medium">
                  <span>Base de Datos</span>
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <div className="mt-1 text-sm font-black text-stone-900">
                  Cloud Firestore
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Única base activa</span>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
                <div className="flex items-center justify-between text-xs text-stone-700 font-medium">
                  <span>ID de Proyecto</span>
                  <Cloud className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-1 text-xs font-mono font-bold text-stone-900 truncate">
                  {firebaseConfig.projectId}
                </div>
                <div className="mt-0.5 text-[11px] text-stone-500 font-medium">
                  Google Cloud / Firebase
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
                <div className="flex items-center justify-between text-xs text-stone-700 font-medium">
                  <span>Latencia en Vivo</span>
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-1 text-sm font-black text-stone-900">
                  {dbStatus.lastPingMs} ms
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-600 font-semibold">
                  Tiempo real activo
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5">
                <div className="flex items-center justify-between text-xs text-stone-700 font-medium">
                  <span>Pedidos Totales</span>
                  <Server className="h-4 w-4 text-stone-500" />
                </div>
                <div className="mt-1 text-sm font-black text-stone-900">
                  {orders.length} comandas
                </div>
                <div className="mt-0.5 text-[11px] text-stone-500">
                  Sincronizadas en Firebase
                </div>
              </div>
            </div>

            {/* Live Collection Inventory */}
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Colecciones en Firebase Firestore
                </span>
                <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  4 colecciones activas
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-2.5">
                  <span className="text-[11px] font-medium text-stone-600">/platos</span>
                  <p className="text-sm font-bold text-stone-900">{products.length} documentos</p>
                  <span className="text-[10px] text-stone-600">Carta y stock</span>
                </div>
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-2.5">
                  <span className="text-[11px] font-medium text-stone-600">/mesas</span>
                  <p className="text-sm font-bold text-stone-900">{tables.length} documentos</p>
                  <span className="text-[10px] text-stone-600">Salón y ocupación</span>
                </div>
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-2.5">
                  <span className="text-[11px] font-medium text-stone-600">/pedidos</span>
                  <p className="text-sm font-bold text-stone-900">{orders.length} documentos</p>
                  <span className="text-[10px] text-stone-600">Comandas en vivo</span>
                </div>
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-2.5">
                  <span className="text-[11px] font-medium text-stone-600">/usuarios</span>
                  <p className="text-sm font-bold text-stone-900">7 documentos</p>
                  <span className="text-[10px] text-stone-600">Personal del restaurante</span>
                </div>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div>
                <p className="text-xs font-bold text-amber-950">
                  Prueba de Conectividad con Firebase Firestore
                </p>
                <p className="text-xs text-amber-800/80">
                  Envía una lectura directa a la colección <code className="font-mono font-bold">/platos</code> para medir latencia y confirmar sincronización.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestFirebase}
                  disabled={testingFirebase}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 active:scale-95 transition-all shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testingFirebase ? 'animate-spin' : ''}`} />
                  <span>{testingFirebase ? 'Probando...' : 'Comprobar Firestore'}</span>
                </button>
                <button
                  onClick={resetDemoData}
                  className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-95 transition-all"
                >
                  <span>Restablecer Datos Demo</span>
                </button>
              </div>
            </div>

            {firebaseTestResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 animate-in fade-in flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{firebaseTestResult}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Explorer */}
        {activeTab === 'explorer' && (
          <div className="mt-4">
            <TableDataExplorer />
          </div>
        )}

        {/* Tab Content: Collections Structure */}
        {activeTab === 'collections' && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <h4 className="text-xs font-black uppercase text-stone-900 tracking-wider">
                Estructura de Documentos en Firebase Firestore
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                La aplicación utiliza un modelo documental NoSQL en Firestore diseñado para lecturas de alta velocidad y suscripciones en tiempo real:
              </p>

              <div className="mt-3 space-y-2 font-mono text-xs">
                <div className="rounded-lg bg-white p-3 border border-stone-200">
                  <span className="font-bold text-amber-700">platos (Colección)</span>
                  <div className="text-[11px] text-stone-600 mt-1">
                    id: string, name: string, category: 'carnes'|'entradas_guarniciones'|'bebidas'|'postres', price: number, stock: number, stockMinimo: number, isAvailable: boolean, supportsDoneness: boolean, cutWeight?: string, badge?: string, description?: string
                  </div>
                </div>

                <div className="rounded-lg bg-white p-3 border border-stone-200">
                  <span className="font-bold text-amber-700">mesas (Colección)</span>
                  <div className="text-[11px] text-stone-600 mt-1">
                    id: string, number: number, capacity: number, status: 'free'|'occupied', activeOrderId?: string
                  </div>
                </div>

                <div className="rounded-lg bg-white p-3 border border-stone-200">
                  <span className="font-bold text-amber-700">pedidos (Colección)</span>
                  <div className="text-[11px] text-stone-600 mt-1">
                    id: string, orderNumber: number, tableNumber: number, waiterName: string, status: 'pending'|'preparing'|'ready'|'delivered'|'cancelled', items: OrderItem[], totalAmount: number, notes?: string, createdAt: string, updatedAt: string
                  </div>
                </div>

                <div className="rounded-lg bg-white p-3 border border-stone-200">
                  <span className="font-bold text-amber-700">usuarios (Colección)</span>
                  <div className="text-[11px] text-stone-600 mt-1">
                    id: string, nombre: string, usuario: string, rol: 'mesero'|'cocina'|'administrador', contrasena: string, activo: boolean
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Security Rules */}
        {activeTab === 'rules' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Reglas de Seguridad Cloud Firestore (firestore.rules)
              </span>
              <button
                onClick={copyRules}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors"
              >
                {copiedRules ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-stone-500" />
                    <span>Copiar Reglas</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-72 overflow-x-auto rounded-xl bg-stone-900 p-4 font-mono text-[11px] text-amber-300 leading-relaxed">
              {firestoreRulesCode}
            </pre>
          </div>
        )}

        {/* Tab Content: Firebase Config */}
        {activeTab === 'config' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Inicialización Firebase JS SDK en la App
              </span>
              <button
                onClick={copyConfig}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors"
              >
                {copiedConfig ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-stone-500" />
                    <span>Copiar Config</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-72 overflow-x-auto rounded-xl bg-stone-900 p-4 font-mono text-[11px] text-amber-300 leading-relaxed">
              {sampleFirebaseConfigCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
