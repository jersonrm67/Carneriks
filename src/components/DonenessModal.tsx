import React, { useState } from 'react';
import { Product, CookingDoneness } from '../types';
import { Flame, Check, X } from 'lucide-react';

interface DonenessModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (doneness: CookingDoneness, notes: string) => void;
}

const DONENESS_OPTIONS: { label: CookingDoneness; desc: string; color: string }[] = [
  {
    label: 'Azul / Sellado',
    desc: 'Sellado fuerte por fuera, centro frío y rojo vivo (45°C - 50°C)',
    color: 'border-purple-500 bg-purple-50 text-purple-900',
  },
  {
    label: 'Término Medio',
    desc: 'Sellado dorado, centro rosado cálido muy jugoso (55°C - 60°C) - Recomendado',
    color: 'border-amber-500 bg-amber-50 text-amber-900',
  },
  {
    label: 'Tres Cuartos',
    desc: 'Cocción homogénea, centro ligeramente rosado y firme (65°C - 70°C)',
    color: 'border-orange-500 bg-orange-50 text-orange-900',
  },
  {
    label: 'Bien Cocido',
    desc: 'Completamente cocido sin tonos rosas en el centro (+72°C)',
    color: 'border-stone-500 bg-stone-50 text-stone-900',
  },
];

export const DonenessModal: React.FC<DonenessModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedDoneness, setSelectedDoneness] = useState<CookingDoneness>('Término Medio');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedDoneness, notes.trim());
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-stone-200">
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                <Flame className="h-3.5 w-3.5 text-amber-600" />
                Parrilla Carneriks
              </span>
              {product.cutWeight && (
                <span className="text-xs font-medium text-stone-700">{product.cutWeight}</span>
              )}
            </div>
            <h3 className="mt-1 text-lg font-bold text-stone-900">{product.name}</h3>
            <p className="text-sm text-stone-700">Selecciona el punto de cocción para la parrilla:</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            {DONENESS_OPTIONS.map((opt) => {
              const isSelected = selectedDoneness === opt.label;
              return (
                <button
                  type="button"
                  key={opt.label}
                  onClick={() => setSelectedDoneness(opt.label)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition-all ${
                    isSelected
                      ? `${opt.color} ring-2 ring-stone-900`
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-stone-900">{opt.label}</div>
                    <div className="text-xs text-stone-700">{opt.desc}</div>
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">
              Notas para el Parrillero (Opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Poco punto de sal, chimichurri caliente aparte, sin pimienta"
              className="mt-1 w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 rounded-xl bg-stone-900 py-2.5 text-sm font-bold text-white shadow-md hover:bg-stone-800"
            >
              Agregar a la Comanda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
