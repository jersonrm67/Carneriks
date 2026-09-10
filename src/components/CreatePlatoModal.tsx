import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { Plus, X, Utensils, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProductCategory } from '../types';

interface CreatePlatoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePlatoModal: React.FC<CreatePlatoModalProps> = ({ isOpen, onClose }) => {
  const { createProduct } = useRestaurant();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('carnes');
  const [price, setPrice] = useState<number | ''>(28.5);
  const [stock, setStock] = useState<number | ''>(20);
  const [stockMinimo, setStockMinimo] = useState<number | ''>(4);
  const [supportsDoneness, setSupportsDoneness] = useState(true);
  const [cutWeight, setCutWeight] = useState('400g');
  const [badge, setBadge] = useState('Nuevo');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica el nombre del plato.');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setError('Por favor especifica un precio válido.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createProduct({
        name: name.trim(),
        category,
        price: Number(price),
        stock: stock === '' ? 15 : Number(stock),
        stockMinimo: stockMinimo === '' ? 3 : Number(stockMinimo),
        supportsDoneness,
        cutWeight: cutWeight.trim() || undefined,
        badge: badge.trim() || undefined,
        description: description.trim() || undefined,
      });

      if (created) {
        setSuccess(`¡"${created.name}" guardado exitosamente en la base de datos!`);
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 1000);
      } else {
        setError('No se pudo guardar el plato en la base de datos.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al comunicarse con la base de datos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/30">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900">Crear Plato en Base de Datos</h2>
              <p className="text-xs text-stone-600">Se guardará en SQLite y se sincronizará con Firestore</p>
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
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Nombre del Plato *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Bife de Chorizo Selección 450g"
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as ProductCategory;
                  setCategory(cat);
                  setSupportsDoneness(cat === 'carnes');
                }}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
              >
                <option value="carnes">Carnes / Cortes a la Parrilla</option>
                <option value="entradas_guarniciones">Entradas & Guarniciones</option>
                <option value="bebidas">Bebidas & Vinos</option>
                <option value="postres">Postres</option>
              </select>
            </div>

            {/* Precio */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Precio ($ USD) *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="24.00"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Stock */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Stock Inicial</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="20"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Stock Mínimo */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Alerta Stock Bajo</label>
              <input
                type="number"
                min="1"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="4"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Peso de Corte */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Peso / Porción</label>
              <input
                type="text"
                value={cutWeight}
                onChange={(e) => setCutWeight(e.target.value)}
                placeholder="400g"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Insignia / Badge */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Insignia Promocional</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ej. Corte Estrella, Recomendado"
                className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Checkbox Término */}
            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                <input
                  type="checkbox"
                  checked={supportsDoneness}
                  onChange={(e) => setSupportsDoneness(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <span>¿Permite elegir término de cocción?</span>
              </label>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Descripción del Plato</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Corte jugoso madurado durante 21 días a temperatura controlada..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-xs text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-700 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? 'Guardando en BD...' : 'Guardar Plato en Base de Datos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
