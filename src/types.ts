export type ProductCategory = 'carnes' | 'entradas_guarniciones' | 'bebidas' | 'postres';

export type CookingDoneness = 'Término Medio' | 'Tres Cuartos' | 'Bien Cocido' | 'Azul / Sellado';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  isAvailable: boolean;
  description: string;
  supportsDoneness: boolean;
  cutWeight?: string; // e.g. "400g", "350g"
  badge?: string;
  stockMinimo?: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  doneness?: CookingDoneness;
  notes?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: number;
  tableNumber: number;
  waiterName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  preparingAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  totalAmount: number;
  notes?: string;
}

export type TableStatus = 'free' | 'occupied' | 'ordered' | 'ready_to_serve';

export interface RestaurantTable {
  id?: string;
  number: number;
  capacity: number;
  status: TableStatus;
  dbEstado?: 'libre' | 'ocupada';
  activeOrderId?: string;
  waiterName?: string;
  lastUpdated: string;
}

export type UserRole = 'waiter' | 'kitchen' | 'admin';

export interface AuthUser {
  id: string;
  nombre: string;
  usuario: string;
  rol: 'mesero' | 'cocina' | 'administrador';
  activo: number;
  fecha_creacion?: string;
}

export interface SystemEvent {
  type: 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'INVENTORY_UPDATED' | 'TABLE_UPDATED' | 'FULL_SYNC';
  payload: any;
  timestamp: string;
}

export interface DatabaseSyncStatus {
  connected: boolean;
  driver: string;
  database?: string;
  lastPingMs: number;
  activeConnections: number;
  totalOrdersToday: number;
  tables?: string[];
  firebaseConnected?: boolean;
  firebaseProjectId?: string;
}
