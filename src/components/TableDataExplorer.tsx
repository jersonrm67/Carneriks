import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Table, Download, Check, AlertCircle, Flame } from 'lucide-react';
import { fetchFirestoreCollection } from '../services/firestoreService';
import { useRestaurant } from '../context/RestaurantContext';
import { firebaseConfig } from '../firebase';

export const TableDataExplorer: React.FC = () => {
  const { products, tables, orders } = useRestaurant();
  const [selectedCollection, setSelectedCollection] = useState<string>('platos');
  const [collectionData, setCollectionData] = useState<{
    collection: string;
    total: number;
    columns: string[];
    rows: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = async (collName: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFirestoreCollection(collName);
      setCollectionData(data);
    } catch (err: any) {
      setError(err.message || 'Error cargando datos desde Firebase Firestore');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection(selectedCollection);
  }, [selectedCollection, products, tables, orders]);

  const downloadJson = () => {
    if (!collectionData) return;
    const blob = new Blob([JSON.stringify(collectionData.rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firebase_firestore_${selectedCollection}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const collectionList = [
    { id: 'platos', label: 'Colección: platos', badge: `${products.length} docs` },
    { id: 'mesas', label: 'Colección: mesas', badge: `${tables.length} docs` },
    { id: 'pedidos', label: 'Colección: pedidos', badge: `${orders.length} docs` },
    { id: 'usuarios', label: 'Colección: usuarios', badge: 'Personal' },
  ];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-black text-stone-900">Explorador de Documentos Firebase Firestore</h3>
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            Consulta directa a las colecciones de la base de datos única: <span className="font-semibold text-amber-700">Firebase Cloud Firestore ({firebaseConfig.projectId})</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadJson}
            disabled={!collectionData || collectionData.rows.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-50 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-stone-600" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={() => fetchCollection(selectedCollection)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-stone-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Collection Selector Tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {collectionList.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedCollection(t.id)}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              selectedCollection === t.id
                ? 'bg-amber-700 text-white shadow-xs'
                : 'border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>{t.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                selectedCollection === t.id ? 'bg-amber-900 text-amber-100' : 'bg-stone-200 text-stone-700'
              }`}
            >
              {t.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-stone-50/40">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-100/70 px-4 py-2 text-xs font-bold text-stone-700">
          <span>Colección Firestore: <code className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono">/{selectedCollection}</code></span>
          <span>{collectionData ? `${collectionData.total} documentos en Firebase` : 'Consultando Firestore...'}</span>
        </div>

        <div className="max-h-96 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs text-stone-500 gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
              <span>Consultando Firebase Cloud Firestore en tiempo real...</span>
            </div>
          ) : collectionData && collectionData.rows.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-stone-200 bg-stone-100 text-stone-600 uppercase">
                <tr>
                  {collectionData.columns.map((col) => (
                    <th key={col} className="py-2 px-3 font-bold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {collectionData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                    {collectionData.columns.map((col) => {
                      const val = row[col];
                      let displayVal = val;
                      if (val === null || val === undefined) {
                        displayVal = <span className="text-stone-400 italic">null</span>;
                      } else if (typeof val === 'boolean') {
                        displayVal = val ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">true</span>
                        ) : (
                          <span className="text-stone-400 font-bold bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">false</span>
                        );
                      } else if (typeof val === 'object') {
                        displayVal = <span className="font-mono text-[10px] text-stone-600">{JSON.stringify(val)}</span>;
                      }
                      return (
                        <td key={col} className="py-2.5 px-3 text-stone-800 font-mono text-[11px] whitespace-nowrap">
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-10 text-center text-xs text-stone-500">
              No hay documentos en la colección /{selectedCollection} de Firestore.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
