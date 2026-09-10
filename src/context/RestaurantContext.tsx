import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Product, Order, RestaurantTable, OrderStatus, UserRole, DatabaseSyncStatus, AuthUser } from '../types';
import { sounds } from '../services/sound';
import {
  initializeFirestoreIfNeeded,
  subscribePlatos,
  subscribeMesas,
  subscribePedidos,
  savePlatoToFirestore,
  updatePlatoStockInFirestore,
  deletePlatoFromFirestore,
  saveMesaToFirestore,
  updateMesaStatusInFirestore,
  deleteMesaFromFirestore,
  createPedidoInFirestore,
  updatePedidoStatusInFirestore,
  clearCompletedPedidosInFirestore,
  resetDemoDataToFirebase,
  authenticateWithFirestore,
  pingFirestoreLive,
} from '../services/firestoreService';
import { firebaseConfig } from '../firebase';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  doneness?: any;
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
  createProduct: (data: {
    name: string;
    category: string;
    price: number;
    stock: number;
    description?: string;
    supportsDoneness?: boolean;
    cutWeight?: string;
    badge?: string;
    stockMinimo?: number;
  }) => Promise<Product | null>;
  updateProduct: (id: string, data: any) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  createTable: (numero: number, capacidad?: number) => Promise<RestaurantTable | null>;
  deleteTable: (numero: number) => Promise<boolean>;
  clearCompletedOrders: () => Promise<number>;
  quickSelectUser: (name: string, role?: UserRole) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [role, setRoleState] = useState<UserRole>('waiter');
  const [userName, setUserNameState] = useState<string>('Carlos M.');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [selectedTable, setSelectedTable] = useState<number | null>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseSyncStatus>({
    connected: true,
    driver: 'Firebase Cloud Firestore',
    database: firebaseConfig.projectId,
    lastPingMs: 12,
    activeConnections: 1,
    totalOrdersToday: 0,
    tables: ['platos', 'mesas', 'pedidos', 'usuarios'],
    firebaseConnected: true,
    firebaseProjectId: firebaseConfig.projectId,
  });

  const roleRef = useRef(role);
  roleRef.current = role;

  const previousOrdersRef = useRef<Map<string, Order>>(new Map());

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
      const result = await authenticateWithFirestore(usuario, contrasena);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setUserNameState(result.user.nombre);
        localStorage.setItem('carneriks_auth_user', JSON.stringify(result.user));
        localStorage.setItem('carneriks_user', result.user.nombre);

        if (result.user.rol === 'mesero') {
          setRole('waiter');
        } else if (result.user.rol === 'cocina') {
          setRole('kitchen');
        } else if (result.user.rol === 'administrador') {
          setRole('admin');
        }
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Credenciales inválidas en Firebase' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al conectar con Firebase' };
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

  // Primary live real-time connection to Firebase Firestore
  useEffect(() => {
    // 1. Ensure initial seed data exists in Firestore
    initializeFirestoreIfNeeded();

    // 2. Real-time subscriber: Platos (Products)
    const unsubPlatos = subscribePlatos(
      (newProducts) => {
        setProducts(newProducts);
        setIsConnected(true);
      },
      (err) => {
        console.warn('Firestore Platos sync notice:', err);
      }
    );

    // 3. Real-time subscriber: Mesas (Tables)
    const unsubMesas = subscribeMesas(
      (newTables) => {
        setTables(newTables);
        setIsConnected(true);
      },
      (err) => {
        console.warn('Firestore Mesas sync notice:', err);
      }
    );

    // 4. Real-time subscriber: Pedidos (Orders)
    const unsubPedidos = subscribePedidos(
      (newOrders) => {
        const prevMap = previousOrdersRef.current;
        const currentRole = roleRef.current;

        // Check for newly arrived orders to trigger kitchen sound
        if (prevMap.size > 0) {
          for (const ord of newOrders) {
            const prev = prevMap.get(ord.id);
            if (!prev) {
              // Brand new order!
              if (currentRole === 'kitchen' && (ord.status === 'pending' || ord.status === 'preparing')) {
                sounds.playNewOrderChime();
              }
            } else if (prev.status !== ord.status) {
              // Status changed!
              if (ord.status === 'ready' && currentRole === 'waiter') {
                sounds.playOrderReadyChime();
              }
            }
          }
        }

        // Update previous orders map
        const nextMap = new Map<string, Order>();
        newOrders.forEach((o) => nextMap.set(o.id, o));
        previousOrdersRef.current = nextMap;

        setOrders(newOrders);
        setIsConnected(true);
        setDbStatus((prev) => ({
          ...prev,
          totalOrdersToday: newOrders.length,
        }));
      },
      (err) => {
        console.warn('Firestore Pedidos sync notice:', err);
      }
    );

    // 5. Periodic Ping to update latency meter for Firebase
    const pingInterval = setInterval(async () => {
      try {
        const ping = await pingFirestoreLive();
        setDbStatus((prev) => ({
          ...prev,
          connected: ping.connected,
          lastPingMs: ping.latencyMs,
          firebaseConnected: ping.connected,
        }));
        setIsConnected(ping.connected);
      } catch (err) {
        // quiet
      }
    }, 15000);

    return () => {
      unsubPlatos();
      unsubMesas();
      unsubPedidos();
      clearInterval(pingInterval);
    };
  }, []);

  // Cart operations
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
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

  // Waiter send order to kitchen directly in Firebase Firestore
  const sendOrder = async (orderNotes?: string): Promise<boolean> => {
    if (!selectedTable || cart.length === 0) return false;

    try {
      setOrderErrorMessage(null);
      const totalAmount = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const orderNumber = (orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) : 100) + 1;

      const newOrder: Order = {
        id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orderNumber,
        tableNumber: selectedTable,
        waiterName: userName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        items: cart.map((c, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          productId: c.productId,
          productName: c.productName,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          doneness: c.doneness,
          notes: c.notes,
        })),
        totalAmount,
        notes: orderNotes || '',
      };

      await createPedidoInFirestore(newOrder);
      sounds.playNewOrderChime();
      clearCart();
      return true;
    } catch (e: any) {
      console.error('Failed to send order to Firebase Firestore:', e);
      setOrderErrorMessage(e.message || 'Error al guardar comanda en Firebase.');
      return false;
    }
  };

  // Kitchen change order status in Firebase Firestore
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updatePedidoStatusInFirestore(orderId, status);
      sounds.playTap();
    } catch (e) {
      console.error('Failed to update order status in Firebase:', e);
    }
  };

  // Stock management in Firebase Firestore
  const updateStock = async (productId: string, stock: number, isAvailable: boolean) => {
    try {
      await updatePlatoStockInFirestore(productId, stock, isAvailable);
    } catch (e) {
      console.error('Failed to update stock in Firebase:', e);
    }
  };

  // Table status update in Firebase Firestore
  const updateTableStatus = async (tableNumber: number, status: RestaurantTable['status']) => {
    try {
      await updateMesaStatusInFirestore(tableNumber, status === 'occupied' ? 'occupied' : 'free');
    } catch (e) {
      console.error('Failed to update table status in Firebase:', e);
    }
  };

  // Reset demo data in Firebase Firestore
  const resetDemoData = async () => {
    try {
      await resetDemoDataToFirebase();
      sounds.playTap();
    } catch (e) {
      console.error('Failed to reset demo in Firebase:', e);
    }
  };

  const quickSelectUser = (name: string, newRole?: UserRole) => {
    setUserNameState(name);
    localStorage.setItem('carneriks_user', name);
    if (newRole) {
      setRoleState(newRole);
      localStorage.setItem('carneriks_role', newRole);
    }
    const roleSlug = newRole === 'kitchen' ? 'cocina' : newRole === 'admin' ? 'administrador' : 'mesero';
    const mockAuth: AuthUser = {
      id: `usr-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      nombre: name,
      usuario: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      rol: roleSlug,
      activo: 1,
    };
    setCurrentUser(mockAuth);
    localStorage.setItem('carneriks_auth_user', JSON.stringify(mockAuth));
  };

  const createProduct = async (data: any): Promise<Product | null> => {
    try {
      const created = await savePlatoToFirestore(data);
      return created;
    } catch (err) {
      console.error('Error creating product in Firebase:', err);
    }
    return null;
  };

  const updateProduct = async (id: string, data: any): Promise<Product | null> => {
    try {
      const updated = await savePlatoToFirestore({ id, ...data });
      return updated;
    } catch (err) {
      console.error('Error updating product in Firebase:', err);
    }
    return null;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      await deletePlatoFromFirestore(id);
      return true;
    } catch (err) {
      console.error('Error deleting product from Firebase:', err);
    }
    return false;
  };

  const createTable = async (numero: number, capacidad: number = 4): Promise<RestaurantTable | null> => {
    try {
      const created = await saveMesaToFirestore(numero, capacidad);
      return created;
    } catch (err) {
      console.error('Error creating table in Firebase:', err);
    }
    return null;
  };

  const deleteTable = async (numero: number): Promise<boolean> => {
    try {
      await deleteMesaFromFirestore(numero);
      return true;
    } catch (err) {
      console.error('Error deleting table from Firebase:', err);
    }
    return false;
  };

  const clearCompletedOrders = async (): Promise<number> => {
    try {
      const clearedCount = await clearCompletedPedidosInFirestore();
      return clearedCount;
    } catch (err) {
      console.error('Error clearing completed orders from Firebase:', err);
    }
    return 0;
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
        createProduct,
        updateProduct,
        deleteProduct,
        createTable,
        deleteTable,
        clearCompletedOrders,
        quickSelectUser,
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
