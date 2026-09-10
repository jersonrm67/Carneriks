import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Plus, X, Table, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTableModal: React.FC<CreateTableModalProps> = ({ isOpen, onClose }) => {
  const { tables, createTable } = useRestaurant();
  const nextAvailableNum = Math.max(...tables.map((t) => t.number), 0) + 1;
  const [numero, setNumero] = useState<number | ''>(nextAvailableNum);
  const [capacidad, setCapacidad] = useState<number | ''>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numero === '' || Number(numero) <= 0) {
      setError('Por favor indica un número de mesa válido.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createTable(Number(numero), capacidad === '' ? 4 : Number(capacidad));
      if (created) {
        setSuccess(`¡Mesa ${created.number} creada en la base de datos!`);
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 1000);
      } else {
        setError('No se pudo crear la mesa en la base de datos.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la base de datos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/30">
              <Table className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900">Agregar Mesa a BD</h2>
              <p className="text-xs text-stone-600">Alta de mesa para comandas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Número de Mesa *</label>
            <input
              type="number"
              min="1"
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ej. 9"
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Capacidad de Comensales</label>
            <select
              value={capacidad}
              onChange={(e) => setCapacidad(Number(e.target.value))}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
            >
              <option value={2}>2 Personas</option>
              <option value={4}>4 Personas</option>
              <option value={6}>6 Personas</option>
              <option value={8}>8 Personas</option>
              <option value={10}>10 Personas</option>
              <option value={12}>12+ Personas (Mesa Grande)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Crear Mesa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
