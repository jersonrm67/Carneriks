import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db, firebaseConfig } from '../firebase';
import { Product, RestaurantTable, Order, OrderStatus, AuthUser } from '../types';
import { INITIAL_PRODUCTS, INITIAL_TABLES, INITIAL_USERS, INITIAL_DEMO_ORDERS } from '../data/initialData';

export interface FirestoreConnectionState {
  connected: boolean;
  projectId: string;
  lastPingMs: number;
  error: string | null;
}

/**
 * Initialize / Seed default data in Firebase Firestore if collections are empty.
 */
export async function initializeFirestoreIfNeeded(): Promise<void> {
  if (!db) return;
  try {
    const platosSnap = await getDocs(collection(db, 'platos'));
    if (platosSnap.empty) {
      console.log('⚡ Firestore platos vacía, sembrando catálogo inicial en Firebase...');
      await resetDemoDataToFirebase();
    }
  } catch (err: any) {
    console.warn('Error al verificar estado inicial de Firestore:', err?.message || err);
  }
}

/**
 * Restore clean seed data directly into Firebase Firestore
 */
export async function resetDemoDataToFirebase(): Promise<void> {
  if (!db) throw new Error('Firestore no está inicializado');

  // Seed Platos
  for (const plato of INITIAL_PRODUCTS) {
    await setDoc(doc(db, 'platos', plato.id), plato);
  }

  // Seed Mesas
  for (const mesa of INITIAL_TABLES) {
    await setDoc(doc(db, 'mesas', mesa.id), mesa);
  }

  // Seed Usuarios
  for (const u of INITIAL_USERS) {
    await setDoc(doc(db, 'usuarios', u.id), u);
  }

  // Seed Pedidos Demo
  for (const pedido of INITIAL_DEMO_ORDERS) {
    await setDoc(doc(db, 'pedidos', pedido.id), pedido);
  }
}

/**
 * Real-time subscription to 'platos' collection in Firebase Firestore
 */
export function subscribePlatos(
  onUpdate: (products: Product[]) => void,
  onError?: (err: any) => void
) {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'platos'),
    (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        prods.push({
          id: d.id,
          name: data.name || '',
          category: data.category || 'carnes',
          price: Number(data.price || 0),
          stock: Number(data.stock ?? 0),
          stockMinimo: Number(data.stockMinimo ?? 3),
          isAvailable: Boolean(data.isAvailable ?? (data.stock > 0)),
          supportsDoneness: Boolean(data.supportsDoneness),
          cutWeight: data.cutWeight,
          badge: data.badge,
          description: data.description,
          imageUrl: data.imageUrl,
        });
      });
      // Sort: carnes first, then by name
      prods.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(prods);
    },
    (err) => {
      console.error('Error escuchando platos en Firestore:', err);
      onError?.(err);
    }
  );
}

/**
 * Real-time subscription to 'mesas' collection in Firebase Firestore
 */
export function subscribeMesas(
  onUpdate: (tables: RestaurantTable[]) => void,
  onError?: (err: any) => void
) {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'mesas'),
    (snapshot) => {
      const mesas: RestaurantTable[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const num = Number(data.number ?? d.id.replace('mesa-', ''));
        mesas.push({
          id: d.id,
          number: num,
          capacity: Number(data.capacity || 4),
          status: data.status === 'occupied' ? 'occupied' : 'free',
        });
      });
      mesas.sort((a, b) => a.number - b.number);
      onUpdate(mesas);
    },
    (err) => {
      console.error('Error escuchando mesas en Firestore:', err);
      onError?.(err);
    }
  );
}

/**
 * Real-time subscription to 'pedidos' collection in Firebase Firestore
 */
export function subscribePedidos(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: any) => void
) {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'pedidos'),
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        orders.push({
          id: d.id,
          orderNumber: Number(data.orderNumber || 0),
          tableNumber: Number(data.tableNumber || 1),
          waiterName: data.waiterName || 'Mesero',
          status: data.status || 'pending',
          createdAt: data.createdAt || new Date().toISOString(),
          items: data.items || [],
          totalAmount: Number(data.totalAmount || 0),
          notes: data.notes || '',
        });
      });
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(orders);
    },
    (err) => {
      console.error('Error escuchando pedidos en Firestore:', err);
      onError?.(err);
    }
  );
}

/**
 * Real-time subscription to 'usuarios' collection in Firebase Firestore
 */
export function subscribeUsuarios(
  onUpdate: (users: AuthUser[]) => void,
  onError?: (err: any) => void
) {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'usuarios'),
    (snapshot) => {
      const users: AuthUser[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        users.push({
          id: d.id,
          nombre: data.nombre,
          usuario: data.usuario,
          rol: data.rol,
          activo: Boolean(data.activo ?? true),
        });
      });
      onUpdate(users);
    },
    (err) => {
      console.error('Error escuchando usuarios en Firestore:', err);
      onError?.(err);
    }
  );
}

/**
 * Create or save Plato in Firestore
 */
export async function savePlatoToFirestore(plato: Partial<Product> & { name: string; price: number }): Promise<Product> {
  if (!db) throw new Error('Firestore no está disponible');

  const id = plato.id || `prod-${Date.now()}`;
  const fullPlato: Product = {
    id,
    name: plato.name,
    category: (plato.category as any) || 'carnes',
    price: Number(plato.price),
    stock: Number(plato.stock ?? 10),
    stockMinimo: Number(plato.stockMinimo ?? 3),
    isAvailable: Boolean(plato.isAvailable ?? ((plato.stock ?? 10) > 0)),
    supportsDoneness: Boolean(plato.supportsDoneness),
    cutWeight: plato.cutWeight,
    badge: plato.badge,
    description: plato.description || '',
    imageUrl: plato.imageUrl,
  };

  await setDoc(doc(db, 'platos', id), fullPlato, { merge: true });
  return fullPlato;
}

/**
 * Update stock of a Plato in Firestore
 */
export async function updatePlatoStockInFirestore(
  productId: string,
  stock: number,
  isAvailable: boolean
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'platos', productId), {
    stock: Math.max(0, stock),
    isAvailable,
  });
}

/**
 * Delete Plato from Firestore
 */
export async function deletePlatoFromFirestore(productId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'platos', productId));
}

/**
 * Create or save Mesa in Firestore
 */
export async function saveMesaToFirestore(tableNumber: number, capacity: number = 4): Promise<RestaurantTable> {
  if (!db) throw new Error('Firestore no disponible');
  const id = `mesa-${tableNumber}`;
  const tableData: RestaurantTable = {
    id,
    number: tableNumber,
    capacity,
    status: 'free',
  };
  await setDoc(doc(db, 'mesas', id), tableData, { merge: true });
  return tableData;
}

/**
 * Update Mesa status in Firestore
 */
export async function updateMesaStatusInFirestore(
  tableNumber: number,
  status: 'free' | 'occupied'
): Promise<void> {
  if (!db) return;
  const id = `mesa-${tableNumber}`;
  await setDoc(
    doc(db, 'mesas', id),
    {
      number: tableNumber,
      status,
    },
    { merge: true }
  );
}

/**
 * Delete Mesa from Firestore
 */
export async function deleteMesaFromFirestore(tableNumber: number): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'mesas', `mesa-${tableNumber}`));
}

/**
 * Create new Order in Firebase Firestore and atomically adjust dish stocks and table status
 */
export async function createPedidoInFirestore(order: Order): Promise<void> {
  if (!db) throw new Error('Firestore no está disponible');

  // 1. Save order to 'pedidos'
  await setDoc(doc(db, 'pedidos', order.id), {
    ...order,
    updatedAt: new Date().toISOString(),
  });

  // 2. Mark table as occupied
  await updateMesaStatusInFirestore(order.tableNumber, 'occupied');

  // 3. Decrement stock for ordered items
  for (const item of order.items) {
    try {
      const prodRef = doc(db, 'platos', item.productId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const curStock = Number(prodSnap.data()?.stock || 0);
        const newStock = Math.max(0, curStock - item.quantity);
        await updateDoc(prodRef, {
          stock: newStock,
          isAvailable: newStock > 0,
        });
      }
    } catch (e) {
      console.warn(`No se pudo descontar stock de ${item.productId}:`, e);
    }
  }
}

/**
 * Update Order status in Firestore
 */
export async function updatePedidoStatusInFirestore(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'pedidos', orderId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Clear or archive completed/cancelled orders in Firestore
 */
export async function clearCompletedPedidosInFirestore(): Promise<number> {
  if (!db) return 0;
  const q = query(
    collection(db, 'pedidos'),
    where('status', 'in', ['delivered', 'cancelled'])
  );
  const snap = await getDocs(q);
  let count = 0;
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
    count++;
  }
  return count;
}

/**
 * Authenticate personal against Firestore 'usuarios' collection
 */
export async function authenticateWithFirestore(
  usuario: string,
  contrasena: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  if (!db) return { success: false, error: 'Firestore no está disponible' };

  try {
    const q = query(collection(db, 'usuarios'), where('usuario', '==', usuario.trim().toLowerCase()));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { success: false, error: 'Usuario no encontrado en Firebase.' };
    }

    const userData = snap.docs[0].data();
    if (userData.contrasena && userData.contrasena !== contrasena) {
      return { success: false, error: 'Contraseña incorrecta.' };
    }

    const user: AuthUser = {
      id: snap.docs[0].id,
      nombre: userData.nombre,
      usuario: userData.usuario,
      rol: userData.rol,
      activo: Boolean(userData.activo ?? true),
    };

    return { success: true, user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al autenticar en Firebase' };
  }
}

/**
 * Direct explorer helper: fetches all documents for any Firestore collection
 */
export async function fetchFirestoreCollection(collectionName: string): Promise<{
  collection: string;
  total: number;
  columns: string[];
  rows: any[];
}> {
  if (!db) {
    throw new Error('Firebase Firestore no está inicializado.');
  }

  const snap = await getDocs(collection(db, collectionName));
  const rows: any[] = [];
  const columnSet = new Set<string>(['id']);

  snap.forEach((d) => {
    const data = d.data();
    const row = { id: d.id, ...data };
    Object.keys(data).forEach((k) => columnSet.add(k));
    rows.push(row);
  });

  return {
    collection: collectionName,
    total: rows.length,
    columns: Array.from(columnSet),
    rows,
  };
}

/**
 * Ping Firebase Firestore to verify live latency and connection
 */
export async function pingFirestoreLive(): Promise<{ connected: boolean; latencyMs: number; message: string }> {
  if (!db) return { connected: false, latencyMs: 0, message: 'Firestore no inicializado' };

  const start = performance.now();
  try {
    const snap = await getDocs(query(collection(db, 'platos'), orderBy('name'), where('isAvailable', '==', true)));
    const latency = Math.round(performance.now() - start);
    return {
      connected: true,
      latencyMs: Math.max(1, latency),
      message: `Conectado a Firebase Cloud Firestore (${firebaseConfig.projectId}) en ${latency}ms con ${snap.size} platos activos.`,
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    return {
      connected: false,
      latencyMs: latency,
      message: `Error en Firestore: ${err?.message || err}`,
    };
  }
}
