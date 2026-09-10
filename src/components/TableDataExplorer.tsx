import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Table, Download, Check, AlertCircle, Sparkles } from 'lucide-react';
import { syncAllToFirestore } from '../services/firebaseSync';
import { useRestaurant } from '../context/RestaurantContext';

export const TableDataExplorer: React.FC = () => {
  const { products, tables, orders } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<string>('platos');
  const [tableData, setTableData] = useState<{
    table: string;
    total: number;
    columns: string[];
    rows: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingFirestore, setSyncingFirestore] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const fetchTable = async (tableName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/database/table/${tableName}`);
      if (!res.ok) {
        throw new Error(`Error al consultar tabla ${tableName}: ${res.statusText}`);
      }
      const data = await res.json();
      setTableData(data);
    } catch (err: any) {
      setError(err.message || 'Error cargando datos de la tabla');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTable(selectedTable);
  }, [selectedTable, products, tables, orders]);

  const handleSyncFirestore = async () => {
    setSyncingFirestore(true);
    setSyncSuccess(null);
    try {
      const result = await syncAllToFirestore({ products, tables, orders });
      setSyncSuccess(`¡Sincronizado con éxito! (${result.ordersSynced} pedidos, ${result.productsSynced} platos, ${result.tablesSynced} mesas)`);
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (e: any) {
      setError(`Error al sincronizar con Firestore: ${e.message}`);
    } finally {
      setSyncingFirestore(false);
    }
  };

  const downloadJson = () => {
    if (!tableData) return;
    const blob = new Blob([JSON.stringify(tableData.rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carneriks_${selectedTable}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tableList = [
    { id: 'platos', label: 'Platos / Carta', badge: `${products.length} filas` },
    { id: 'mesas', label: 'Mesas del Salón', badge: `${tables.length} filas` },
    { id: 'pedidos', label: 'Pedidos / Comandas', badge: `${orders.length} filas` },
    { id: 'detalle_pedidos', label: 'Detalle de Comandas', badge: 'Items' },
    { id: 'usuarios', label: 'Usuarios & Roles', badge: 'Personal' },
  ];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-black text-stone-900">Explorador de Tablas SQL en Vivo</h3>
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            Consulta directa a las tablas relacionales de la base de datos (SQLite & Firestore).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncFirestore}
            disabled={syncingFirestore}
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-95 transition-all shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>{syncingFirestore ? 'Sincronizando...' : 'Subir Todo a Firestore'}</span>
          </button>

          <button
            onClick={downloadJson}
            disabled={!tableData || tableData.rows.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-50 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-stone-600" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={() => fetchTable(selectedTable)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-stone-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {syncSuccess && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Selector Tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tableList.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTable(t.id)}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              selectedTable === t.id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>{t.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                selectedTable === t.id ? 'bg-stone-700 text-stone-200' : 'bg-stone-200 text-stone-700'
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
          <span>Tabla SQL: <code className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{selectedTable}</code></span>
          <span>{tableData ? `${tableData.total} registros encontrados` : 'Consultando...'}</span>
        </div>

        <div className="max-h-96 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs text-stone-500 gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
              <span>Cargando registros desde la base de datos...</span>
            </div>
          ) : tableData && tableData.rows.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-stone-200 bg-stone-100 text-stone-600 uppercase">
                <tr>
                  {tableData.columns.map((col) => (
                    <th key={col} className="py-2 px-3 font-bold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {tableData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                    {tableData.columns.map((col) => {
                      const val = row[col];
                      let displayVal = val;
                      if (val === null || val === undefined) {
                        displayVal = <span className="text-stone-400 italic">NULL</span>;
                      } else if (typeof val === 'boolean' || val === 1 || val === 0) {
                        if (col === 'activo' || col === 'disponible' || col === 'permite_termino') {
                          displayVal = val ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">SI</span>
                          ) : (
                            <span className="text-stone-400 font-bold bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">NO</span>
                          );
                        }
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
              No hay registros en la tabla {selectedTable}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
