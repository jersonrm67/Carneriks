import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, firebaseConfig } from '../firebase';
import { Order, Product, RestaurantTable, OrderStatus } from '../types';

export interface FirebaseStatusInfo {
  initialized: boolean;
  projectId: string;
  connected: boolean;
  lastSync?: string;
  error?: string | null;
}

let lastError: string | null = null;
let isConnected = false;

export const getFirebaseStatus = (): FirebaseStatusInfo => ({
  initialized: Boolean(db),
  projectId: firebaseConfig.projectId,
  connected: isConnected,
  error: lastError,
});

/**
 * Synchronize a new or updated order into Firebase Firestore ('pedidos' collection)
 */
export async function syncOrderToFirestore(order: Order): Promise<boolean> {
  if (!db) return false;
  try {
    const orderDocRef = doc(db, 'pedidos', order.id);
    await setDoc(
      orderDocRef,
      {
        id: order.id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        waiterName: order.waiterName,
        items: order.items,
        status: order.status,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        notes: order.notes || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    isConnected = true;
    lastError = null;
    return true;
  } catch (err: any) {
    console.warn('Firestore sync order warning:', err?.message || err);
    lastError = err?.message || 'Error al sincronizar con Firestore';
    return false;
  }
}

/**
 * Update an order's status in Firestore
 */
export async function syncOrderStatusToFirestore(orderId: string, status: OrderStatus): Promise<boolean> {
  if (!db) return false;
  try {
    const orderDocRef = doc(db, 'pedidos', orderId);
    await updateDoc(orderDocRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
    isConnected = true;
    return true;
  } catch (err: any) {
    console.warn('Firestore update order status warning:', err?.message || err);
    lastError = err?.message || 'Error al actualizar estado en Firestore';
    return false;
  }
}

/**
 * Synchronize product stock in Firestore ('platos' collection)
 */
export async function syncProductToFirestore(product: Product): Promise<boolean> {
  if (!db) return false;
  try {
    const prodDocRef = doc(db, 'platos', product.id);
    await setDoc(
      prodDocRef,
      {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        isAvailable: product.isAvailable,
        description: product.description,
        supportsDoneness: product.supportsDoneness,
        stockMinimo: product.stockMinimo || 3,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    isConnected = true;
    return true;
  } catch (err: any) {
    console.warn('Firestore sync product warning:', err?.message || err);
    lastError = err?.message || 'Error al sincronizar plato en Firestore';
    return false;
  }
}

/**
 * Synchronize table state in Firestore ('mesas' collection)
 */
export async function syncTableToFirestore(table: RestaurantTable): Promise<boolean> {
  if (!db) return false;
  try {
    const tableId = `mesa-${table.number}`;
    const tableDocRef = doc(db, 'mesas', tableId);
    await setDoc(
      tableDocRef,
      {
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        dbEstado: table.status === 'occupied' ? 'ocupada' : 'libre',
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
    isConnected = true;
    return true;
  } catch (err: any) {
    console.warn('Firestore sync table warning:', err?.message || err);
    lastError = err?.message || 'Error al sincronizar mesa en Firestore';
    return false;
  }
}

/**
 * Test or ping Firestore connection
 */
export async function pingFirestore(): Promise<{ ok: boolean; message: string }> {
  if (!db) return { ok: false, message: 'Firebase no inicializado' };
  try {
    const pedidosRef = collection(db, 'pedidos');
    const q = query(pedidosRef, limit(1));
    await getDocs(q);
    isConnected = true;
    lastError = null;
    return { ok: true, message: 'Conectado exitosamente a Firebase Firestore (carneriks-b31a8)' };
  } catch (err: any) {
    lastError = err?.message || 'Error al conectar con Firestore';
    return { ok: false, message: lastError || 'Error' };
  }
}

/**
 * Sync entire snapshot of products, tables, and orders to Firestore
 */
export async function syncAllToFirestore({
  products,
  tables,
  orders,
}: {
  products: Product[];
  tables: RestaurantTable[];
  orders: Order[];
}): Promise<{ productsSynced: number; tablesSynced: number; ordersSynced: number }> {
  let productsSynced = 0;
  let tablesSynced = 0;
  let ordersSynced = 0;

  for (const prod of products) {
    const ok = await syncProductToFirestore(prod);
    if (ok) productsSynced++;
  }

  for (const tbl of tables) {
    const ok = await syncTableToFirestore(tbl);
    if (ok) tablesSynced++;
  }

  for (const ord of orders) {
    const ok = await syncOrderToFirestore(ord);
    if (ok) ordersSynced++;
  }

  return { productsSynced, tablesSynced, ordersSynced };
}

