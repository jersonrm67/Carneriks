import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Product, Order, RestaurantTable, OrderStatus, UserRole, SystemEvent, DatabaseSyncStatus, AuthUser } from '../types';
import { sounds } from '../services/sound';
import {
  syncOrderToFirestore,
  syncOrderStatusToFirestore,
  syncProductToFirestore,
  syncTableToFirestore,
  pingFirestore,
} from '../services/firebaseSync';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  doneness?: string;
  notes?: string;
}

interface RestaurantContextType {
  products: Product[];
  tables: RestaurantTable[];
  orders: Order[];
  role: UserRole;
  userName: string;
  currentUser: AuthUser | null;
  isConnected: boolean;
  dbStatus: DatabaseSyncStatus;
  selectedTable: number | null;
  cart: CartItem[];
  isMuted: boolean;
  activeFilter: string;
  orderErrorMessage: string | null;
  setRole: (role: UserRole) => void;
  setUserName: (name: string) => void;
  setSelectedTable: (tableNum: number | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateCartItemQty: (index: number, delta: number) => void;
  clearCart: () => void;
  sendOrder: (notes?: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateStock: (productId: string, stock: number, isAvailable: boolean) => Promise<void>;
  updateTableStatus: (tableNumber: number, status: RestaurantTable['status']) => Promise<void>;
  toggleMute: () => void;
  resetDemoData: () => Promise<void>;
  setActiveFilter: (filter: string) => void;
  login: (usuario: string, contrasena: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setOrderErrorMessage: (msg: string | null) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRoleState] = useState<UserRole>('waiter');
  const [userName, setUserNameState] = useState<string>('Carlos M.');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseSyncStatus>({
    connected: true,
    driver: 'SQLite-Relational-ACID',
    database: 'carneriks.sqlite',
    lastPingMs: 4,
    activeConnections: 1,
    totalOrdersToday: 0,
    tables: ['usuarios', 'mesas', 'platos', 'pedidos', 'detalle_pedidos'],
    firebaseConnected: true,
    firebaseProjectId: 'carneriks-b31a8',
  });

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const roleRef = useRef(role);
  roleRef.current = role;

  // Load saved preferences if any
  useEffect(() => {
    const savedRole = localStorage.getItem('carneriks_role') as UserRole;
    if (savedRole && (savedRole === 'waiter' || savedRole === 'kitchen' || savedRole === 'admin')) {
      setRoleState(savedRole);
    }
    const savedUser = localStorage.getItem('carneriks_user');
    if (savedUser) {
      setUserNameState(savedUser);
    }
    const savedAuth = localStorage.getItem('carneriks_auth_user');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setCurrentUser(parsed);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('carneriks_role', newRole);
    if (newRole === 'kitchen' && userName === 'Carlos M.') {
      setUserNameState('Chef Marco');
      localStorage.setItem('carneriks_user', 'Chef Marco');
    } else if (newRole === 'waiter' && userName === 'Chef Marco') {
      setUserNameState('Carlos M.');
      localStorage.setItem('carneriks_user', 'Carlos M.');
    } else if (newRole === 'admin') {
      setUserNameState('Administrador');
      localStorage.setItem('carneriks_user', 'Administrador');
    }
  };

  const setUserName = (name: string) => {
    setUserNameState(name);
    localStorage.setItem('carneriks_user', name);
  };

  const login = async (usuario: string, contrasena: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasena }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setUserNameState(data.user.nombre);
        localStorage.setItem('carneriks_auth_user', JSON.stringify(data.user));
        localStorage.setItem('carneriks_user', data.user.nombre);

        // Adjust view role based on user role
        if (data.user.rol === 'mesero') {
          setRole('waiter');
        } else if (data.user.rol === 'cocina') {
          setRole('kitchen');
        } else if (data.user.rol === 'administrador') {
          setRole('admin');
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Credenciales inválidas' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con el servidor' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('carneriks_auth_user');
  };

  const toggleMute = () => {
    sounds.isMuted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Initial fetch fallback
  const fetchSnapshot = useCallback(async () => {
    try {
      const [prodRes, tableRes, orderRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/tables'),
        fetch('/api/orders'),
      ]);
      if (prodRes.ok && tableRes.ok && orderRes.ok) {
        const prodData = await prodRes.json();
        const tableData = await tableRes.json();
        const orderData = await orderRes.json();
        setProducts(prodData);
        setTables(tableData);
        setOrders(orderData);
        setIsConnected(true);
      }
    } catch (e) {
      console.warn('Initial fetch waiting for server...', e);
    }
  }, []);

  // Handle incoming system events
  const handleSystemEvent = useCallback((event: SystemEvent) => {
    const currentRole = roleRef.current;

    switch (event.type) {
      case 'FULL_SYNC':
        if (event.payload) {
          setProducts(event.payload.products || []);
          setTables(event.payload.tables || []);
          setOrders(event.payload.orders || []);
          setIsConnected(true);
        }
        break;

      case 'ORDER_CREATED': {
        const newOrder: Order = event.payload;
        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });

        // If in kitchen, play audible chime!
        if (currentRole === 'kitchen') {
          sounds.playNewOrderChime();
        }
        break;
      }

      case 'ORDER_STATUS_CHANGED': {
        const updatedOrder: Order = event.payload;
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );

        // If order became ready and current user is waiter, notify waiter!
        if (updatedOrder.status === 'ready' && currentRole === 'waiter') {
          sounds.playOrderReadyChime();
        }
        break;
      }

      case 'INVENTORY_UPDATED':
        if (Array.isArray(event.payload)) {
          setProducts(event.payload);
        }
        break;

      case 'TABLE_UPDATED': {
        const updatedTable: RestaurantTable = event.payload;
        if (updatedTable && updatedTable.number) {
          setTables((prev) =>
            prev.map((t) => (t.number === updatedTable.number ? updatedTable : t))
          );
        }
        break;
      }
    }
  }, []);

  // Setup Server-Sent Events (SSE) + BroadcastChannel
  useEffect(() => {
    fetchSnapshot();

    // Broadcast channel for instantaneous cross-tab sync in same browser
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('carneriks_realtime');
      broadcastChannelRef.current = channel;
      channel.onmessage = (msgEvent) => {
        if (msgEvent.data) {
          handleSystemEvent(msgEvent.data);
        }
      };
    }

    // Connect to Server-Sent Events
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connectSSE() {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          handleSystemEvent(parsed);
          setIsConnected(true);
        } catch (err) {
          // heartbeat or ignore
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    }

    connectSSE();

    // Test Firebase Firestore connection on mount
    pingFirestore().then((res) => {
      if (res.ok) {
        console.log('🔥 Firebase Firestore conectado a proyecto:', 'carneriks-b31a8');
      }
    });

    // Poll DB status periodically
    const pingInterval = setInterval(async () => {
      try {
        const start = performance.now();
        const res = await fetch('/api/db-status');
        if (res.ok) {
          const data = await res.json();
          const latency = Math.round(performance.now() - start);
          setDbStatus((prev) => ({
            ...prev,
            connected: true,
            driver: data.driver,
            database: data.database,
            lastPingMs: latency,
            activeConnections: data.activeConnections,
            totalOrdersToday: data.totalOrdersToday,
            tables: data.tables,
            firebaseConnected: true,
            firebaseProjectId: 'carneriks-b31a8',
          }));
        }
      } catch (err) {
        // server temporarily offline
      }
    }, 10000);

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
      clearInterval(pingInterval);
      broadcastChannelRef.current?.close();
    };
  }, [fetchSnapshot, handleSystemEvent]);

  // Cart operations
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      // Find if exact same product + doneness already in cart
      const existingIdx = prev.findIndex(
        (c) => c.productId === item.productId && c.doneness === item.doneness
      );
      if (existingIdx > -1) {
        const clone = [...prev];
        clone[existingIdx].quantity += item.quantity;
        return clone;
      }
      return [...prev, item];
    });
    sounds.playTap();
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    sounds.playTap();
  };

  const updateCartItemQty = (index: number, delta: number) => {
    setCart((prev) => {
      const clone = [...prev];
      const newQty = clone[index].quantity + delta;
      if (newQty <= 0) {
        return clone.filter((_, i) => i !== index);
      }
      clone[index].quantity = newQty;
      return clone;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // Waiter send order to kitchen
  const sendOrder = async (orderNotes?: string): Promise<boolean> => {
    if (!selectedTable || cart.length === 0) return false;

    try {
      setOrderErrorMessage(null);
      const payload = {
        tableNumber: selectedTable,
        waiterName: userName,
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          doneness: c.doneness,
          notes: c.notes,
        })),
        notes: orderNotes,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created: Order = await res.json();
        // Optimistically notify local broadcast channel
        const evt: SystemEvent = {
          type: 'ORDER_CREATED',
          payload: created,
          timestamp: new Date().toISOString(),
        };
        broadcastChannelRef.current?.postMessage(evt);
        handleSystemEvent(evt);

        // Synchronize in Firebase Firestore ('pedidos' collection)
        syncOrderToFirestore(created).catch((e) => console.warn('Firestore sync background notice:', e));

        sounds.playNewOrderChime();
        clearCart();
        return true;
      } else {
        const errData = await res.json();
        setOrderErrorMessage(errData.error || 'Error al procesar el pedido en la base de datos.');
        return false;
      }
    } catch (e: any) {
      console.error('Failed to send order:', e);
      setOrderErrorMessage(e.message || 'Error de conexión con el servidor.');
      return false;
    }
  };

  // Kitchen change order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );

      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updated: Order = await res.json();
        const evt: SystemEvent = {
          type: 'ORDER_STATUS_CHANGED',
          payload: updated,
          timestamp: new Date().toISOString(),
        };
        broadcastChannelRef.current?.postMessage(evt);
        handleSystemEvent(evt);
        sounds.playTap();

        // Sync to Firestore
        syncOrderStatusToFirestore(orderId, status).catch((e) => console.warn('Firestore update status notice:', e));
      }
    } catch (e) {
      console.error('Failed to update order status:', e);
    }
  };

  // Stock management
  const updateStock = async (productId: string, stock: number, isAvailable: boolean) => {
    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock, isAvailable } : p))
      );

      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock, isAvailable }),
      });

      if (res.ok) {
        const updatedProd: Product = await res.json();
        const updatedList = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
        const evt: SystemEvent = {
          type: 'INVENTORY_UPDATED',
          payload: updatedList,
          timestamp: new Date().toISOString(),
        };
        broadcastChannelRef.current?.postMessage(evt);

        // Sync to Firestore
        syncProductToFirestore(updatedProd).catch((e) => console.warn('Firestore sync product notice:', e));
      }
    } catch (e) {
      console.error('Failed to update stock:', e);
    }
  };

  // Table status update
  const updateTableStatus = async (tableNumber: number, status: RestaurantTable['status']) => {
    try {
      const res = await fetch(`/api/tables/${tableNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        const evt: SystemEvent = {
          type: 'TABLE_UPDATED',
          payload: updated,
          timestamp: new Date().toISOString(),
        };
        broadcastChannelRef.current?.postMessage(evt);
        handleSystemEvent(evt);

        // Sync to Firestore
        syncTableToFirestore(updated).catch((e) => console.warn('Firestore sync table notice:', e));
      }
    } catch (e) {
      console.error('Failed to update table:', e);
    }
  };

  const resetDemoData = async () => {
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      await fetchSnapshot();
      sounds.playTap();
    } catch (e) {
      console.error('Failed to reset demo:', e);
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        products,
        tables,
        orders,
        role,
        userName,
        currentUser,
        isConnected,
        dbStatus,
        selectedTable,
        cart,
        isMuted,
        activeFilter,
        orderErrorMessage,
        setRole,
        setUserName,
        setSelectedTable,
        addToCart,
        removeFromCart,
        updateCartItemQty,
        clearCart,
        sendOrder,
        updateOrderStatus,
        updateStock,
        updateTableStatus,
        toggleMute,
        resetDemoData,
        setActiveFilter,
        login,
        logout,
        setOrderErrorMessage,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
