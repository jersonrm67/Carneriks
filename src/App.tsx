import React, { useState } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Header } from './components/Header';
import { WaiterView } from './components/WaiterView';
import { KitchenView } from './components/KitchenView';
import { InventoryView } from './components/InventoryView';
import { DatabaseModal } from './components/DatabaseModal';
import { LoginModal } from './components/LoginModal';
import { SplitSquareVertical, Lock } from 'lucide-react';

const MainApp: React.FC = () => {
  const { role, currentUser } = useRestaurant();
  const [showDbModal, setShowDbModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [splitView, setSplitView] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col selection:bg-amber-500 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenDbModal={() => setShowDbModal(true)}
        onOpenLoginModal={() => setShowLoginModal(true)}
      />

      {/* Quick View Controls Bar for Testing */}
      <div className="bg-stone-200/70 border-b border-stone-200 px-4 py-1.5 text-xs text-stone-600">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Modo de visualización:</span>
            <span className="rounded bg-white px-2 py-0.5 font-bold text-stone-900 shadow-2xs">
              {role === 'waiter' ? 'Salón / Meseros' : role === 'kitchen' ? 'Cocina KDS' : 'Inventario & BD'}
            </span>
            {currentUser && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                <Lock className="h-3 w-3" />
                <span>{currentUser.nombre} ({currentUser.rol})</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSplitView(!splitView)}
              className={`hidden md:flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                splitView
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-300'
              }`}
            >
              <SplitSquareVertical className="h-3.5 w-3.5" />
              <span>{splitView ? 'Vista Individual' : 'Vista Dividida (Mesero + Cocina)'}</span>
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium text-stone-700 hover:bg-stone-50 border border-stone-300 text-[11px]"
            >
              <Lock className="h-3 w-3 text-amber-600" />
              <span>{currentUser ? 'Cambiar Usuario BD' : 'Iniciar Sesión'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {splitView ? (
          /* Split View for simultaneous testing of Waiter & Kitchen */
          <div className="mx-auto max-w-[1700px] px-2 py-4 sm:px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-stone-300 bg-white/50 p-2 shadow-xs">
                <div className="mb-2 flex items-center justify-between bg-stone-900 text-white px-4 py-2 rounded-xl">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Dispositivo 1 • Tablet Mesero
                  </span>
                  <span className="text-[11px] text-stone-400">Toma de pedidos en mesa</span>
                </div>
                <WaiterView />
              </div>

              <div className="rounded-2xl border border-stone-300 bg-white/50 p-2 shadow-xs">
                <div className="mb-2 flex items-center justify-between bg-stone-900 text-white px-4 py-2 rounded-xl">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                    Dispositivo 2 • Pantalla Cocina KDS
                  </span>
                  <span className="text-[11px] text-stone-400">Recepción y despacho de tickets</span>
                </div>
                <KitchenView />
              </div>
            </div>
          </div>
        ) : (
          /* Single View */
          <div>
            {role === 'waiter' && <WaiterView />}
            {role === 'kitchen' && <KitchenView />}
            {role === 'admin' && <InventoryView />}
          </div>
        )}
      </main>

      {/* Database Modal */}
      <DatabaseModal isOpen={showDbModal} onClose={() => setShowDbModal(false)} />

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} canClose={true} />
    </div>
  );
};

export default function App() {
  return (
    <RestaurantProvider>
      <MainApp />
    </RestaurantProvider>
  );
}
