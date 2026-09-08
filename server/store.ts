import { Product, Order, RestaurantTable, SystemEvent, OrderStatus } from '../src/types';

// Initial Products Catalog for Carneriks
export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Bife de Chorizo Premium',
    category: 'carnes',
    price: 68.0,
    stock: 18,
    isAvailable: true,
    description: 'Corte tradicional argentino jugoso de 400g, asado a las brasas con sal en grano.',
    supportsDoneness: true,
    cutWeight: '400g',
    badge: 'Especialidad',
  },
  {
    id: 'prod-2',
    name: 'Ojo de Bife (Ribeye) Angus',
    category: 'carnes',
    price: 75.0,
    stock: 12,
    isAvailable: true,
    description: 'Veteado marmóreo excepcional, textura tierna y sabor concentrado a la parrilla.',
    supportsDoneness: true,
    cutWeight: '380g',
    badge: 'Más Pedido',
  },
  {
    id: 'prod-3',
    name: 'Entraña Fina a la Parrilla',
    category: 'carnes',
    price: 62.0,
    stock: 15,
    isAvailable: true,
    description: 'Corte delgado de cocción rápida con crocante piel exterior y centro tierno.',
    supportsDoneness: true,
    cutWeight: '320g',
  },
  {
    id: 'prod-4',
    name: 'Picaña Prime Brasileña',
    category: 'carnes',
    price: 72.0,
    stock: 9,
    isAvailable: true,
    description: 'Corte con capa dorada de grasa natural que funde sobre el hierro caliente.',
    supportsDoneness: true,
    cutWeight: '400g',
    badge: 'Prime',
  },
  {
    id: 'prod-5',
    name: 'Hamburguesa Carneriks Doble Brasa',
    category: 'carnes',
    price: 42.0,
    stock: 25,
    isAvailable: true,
    description: '300g blend de costillar y picaña, queso provolone fundido, panceta y cebolla caramelizada.',
    supportsDoneness: true,
    cutWeight: '300g',
  },
  {
    id: 'prod-6',
    name: 'Provoleta Asada al Oreganato',
    category: 'entradas_guarniciones',
    price: 28.0,
    stock: 20,
    isAvailable: true,
    description: 'Queso provolone fundido al hierro con orégano fresco, ají molido y aceite de oliva virgen.',
    supportsDoneness: false,
    badge: 'Entrada Clásica',
  },
  {
    id: 'prod-7',
    name: 'Papas Rústicas con Romero & Ajo',
    category: 'entradas_guarniciones',
    price: 19.0,
    stock: 35,
    isAvailable: true,
    description: 'Papas doradas en doble cocción con romero de huerta y alioli de ajo asado.',
    supportsDoneness: false,
  },
  {
    id: 'prod-8',
    name: 'Ensalada Parrillera Carneriks',
    category: 'entradas_guarniciones',
    price: 22.0,
    stock: 20,
    isAvailable: true,
    description: 'Rúcula fresca silvestre, tomates cherry asados, lascas de parmesano reggiano y vinagreta balsámica.',
    supportsDoneness: false,
  },
  {
    id: 'prod-9',
    name: 'Limonada de Hierbabuena & Jengibre',
    category: 'bebidas',
    price: 14.0,
    stock: 40,
    isAvailable: true,
    description: 'Refrescante, preparada al momento con limones frescos y hojas de hierbabuena maceradas.',
    supportsDoneness: false,
  },
  {
    id: 'prod-10',
    name: 'Copa Tinto Malbec Reserva',
    category: 'bebidas',
    price: 24.0,
    stock: 30,
    isAvailable: true,
    description: 'Mendoza, Argentina. Notas de frutos rojos maduros, taninos redondos, ideal para carnes rojas.',
    supportsDoneness: false,
  },
  {
    id: 'prod-11',
    name: 'Cerveza Artesanal Roja / IPA',
    category: 'bebidas',
    price: 18.0,
    stock: 22,
    isAvailable: true,
    description: 'Elaboración local bien fría en botella de 500ml.',
    supportsDoneness: false,
  },
  {
    id: 'prod-12',
    name: 'Flan Casero con Dulce de Leche',
    category: 'postres',
    price: 20.0,
    stock: 14,
    isAvailable: true,
    description: 'Receta tradicional con 8 yemas, caramelo dorado y generosa porción de dulce de leche colonial.',
    supportsDoneness: false,
  },
];

export const initialTables: RestaurantTable[] = [
  { number: 1, capacity: 4, status: 'free', lastUpdated: new Date().toISOString() },
  { number: 2, capacity: 2, status: 'occupied', lastUpdated: new Date().toISOString() },
  { number: 3, capacity: 6, status: 'ordered', activeOrderId: 'ord-101', waiterName: 'Carlos M.', lastUpdated: new Date().toISOString() },
  { number: 4, capacity: 4, status: 'free', lastUpdated: new Date().toISOString() },
  { number: 5, capacity: 4, status: 'ready_to_serve', activeOrderId: 'ord-100', waiterName: 'Laura G.', lastUpdated: new Date().toISOString() },
  { number: 6, capacity: 8, status: 'free', lastUpdated: new Date().toISOString() },
  { number: 7, capacity: 2, status: 'free', lastUpdated: new Date().toISOString() },
  { number: 8, capacity: 4, status: 'free', lastUpdated: new Date().toISOString() },
  { number: 9, capacity: 6, status: 'occupied', lastUpdated: new Date().toISOString() },
  { number: 10, capacity: 4, status: 'free', lastUpdated: new Date().toISOString() },
];

export const initialOrders: Order[] = [
  {
    id: 'ord-100',
    orderNumber: 100,
    tableNumber: 5,
    waiterName: 'Laura G.',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Bife de Chorizo Premium',
        quantity: 2,
        unitPrice: 68.0,
        doneness: 'Término Medio',
        notes: 'Poco punto de sal en una de las porciones',
      },
      {
        id: 'item-2',
        productId: 'prod-7',
        productName: 'Papas Rústicas con Romero & Ajo',
        quantity: 1,
        unitPrice: 19.0,
      },
    ],
    status: 'ready',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    preparingAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    totalAmount: 155.0,
    notes: 'Mesa con niños, servir juntos.',
  },
  {
    id: 'ord-101',
    orderNumber: 101,
    tableNumber: 3,
    waiterName: 'Carlos M.',
    items: [
      {
        id: 'item-3',
        productId: 'prod-2',
        productName: 'Ojo de Bife (Ribeye) Angus',
        quantity: 1,
        unitPrice: 75.0,
        doneness: 'Tres Cuartos',
        notes: 'Con chimichurri aparte',
      },
      {
        id: 'item-4',
        productId: 'prod-3',
        productName: 'Entraña Fina a la Parrilla',
        quantity: 1,
        unitPrice: 62.0,
        doneness: 'Término Medio',
      },
      {
        id: 'item-5',
        productId: 'prod-6',
        productName: 'Provoleta Asada al Oreganato',
        quantity: 1,
        unitPrice: 28.0,
      },
    ],
    status: 'preparing',
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    preparingAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    totalAmount: 165.0,
  },
];

class StoreManager {
  private products: Product[] = [...initialProducts];
  private tables: RestaurantTable[] = [...initialTables];
  private orders: Order[] = [...initialOrders];
  private sseClients: Set<any> = new Set();
  private nextOrderNumber = 102;

  // Real-time broadcast
  public addSSEClient(res: any) {
    this.sseClients.add(res);
  }

  public removeSSEClient(res: any) {
    this.sseClients.delete(res);
  }

  public broadcast(event: SystemEvent) {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  public getProducts(): Product[] {
    return this.products;
  }

  public getTables(): RestaurantTable[] {
    return this.tables;
  }

  public getOrders(): Order[] {
    return this.orders;
  }

  public getActiveConnectionsCount(): number {
    return this.sseClients.size;
  }

  public createOrder(data: {
    tableNumber: number;
    waiterName: string;
    items: Array<{ productId: string; quantity: number; doneness?: any; notes?: string }>;
    notes?: string;
  }): Order {
    const orderItems = data.items.map((it, idx) => {
      const prod = this.products.find((p) => p.id === it.productId);
      const unitPrice = prod ? prod.price : 0;
      const productName = prod ? prod.name : 'Plato';

      // Deduct stock if available
      if (prod) {
        prod.stock = Math.max(0, prod.stock - it.quantity);
        if (prod.stock === 0) {
          prod.isAvailable = false;
        }
      }

      return {
        id: `item-${Date.now()}-${idx}`,
        productId: it.productId,
        productName,
        quantity: it.quantity,
        unitPrice,
        doneness: it.doneness,
        notes: it.notes,
      };
    });

    const totalAmount = orderItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: this.nextOrderNumber++,
      tableNumber: data.tableNumber,
      waiterName: data.waiterName || 'Mesero',
      items: orderItems,
      status: 'pending',
      createdAt: new Date().toISOString(),
      totalAmount,
      notes: data.notes,
    };

    this.orders.unshift(newOrder);

    // Update table
    const table = this.tables.find((t) => t.number === data.tableNumber);
    if (table) {
      table.status = 'ordered';
      table.activeOrderId = newOrder.id;
      table.waiterName = newOrder.waiterName;
      table.lastUpdated = new Date().toISOString();
    }

    // Broadcast real-time events
    this.broadcast({
      type: 'ORDER_CREATED',
      payload: newOrder,
      timestamp: new Date().toISOString(),
    });

    this.broadcast({
      type: 'INVENTORY_UPDATED',
      payload: this.products,
      timestamp: new Date().toISOString(),
    });

    this.broadcast({
      type: 'TABLE_UPDATED',
      payload: table,
      timestamp: new Date().toISOString(),
    });

    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.status = status;
    const now = new Date().toISOString();
    if (status === 'preparing' && !order.preparingAt) {
      order.preparingAt = now;
    } else if (status === 'ready') {
      order.readyAt = now;
      // Update table to ready_to_serve
      const table = this.tables.find((t) => t.number === order.tableNumber);
      if (table && table.activeOrderId === order.id) {
        table.status = 'ready_to_serve';
        table.lastUpdated = now;
        this.broadcast({ type: 'TABLE_UPDATED', payload: table, timestamp: now });
      }
    } else if (status === 'delivered') {
      order.deliveredAt = now;
      // Free or mark table occupied
      const table = this.tables.find((t) => t.number === order.tableNumber);
      if (table && table.activeOrderId === order.id) {
        table.status = 'occupied';
        table.activeOrderId = undefined;
        table.lastUpdated = now;
        this.broadcast({ type: 'TABLE_UPDATED', payload: table, timestamp: now });
      }
    } else if (status === 'cancelled') {
      const table = this.tables.find((t) => t.number === order.tableNumber);
      if (table && table.activeOrderId === order.id) {
        table.status = 'free';
        table.activeOrderId = undefined;
        table.lastUpdated = now;
        this.broadcast({ type: 'TABLE_UPDATED', payload: table, timestamp: now });
      }
    }

    this.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      payload: order,
      timestamp: now,
    });

    return order;
  }

  public updateProductStock(productId: string, stock: number, isAvailable: boolean): Product | null {
    const prod = this.products.find((p) => p.id === productId);
    if (!prod) return null;

    prod.stock = Math.max(0, stock);
    prod.isAvailable = isAvailable && prod.stock > 0;

    this.broadcast({
      type: 'INVENTORY_UPDATED',
      payload: this.products,
      timestamp: new Date().toISOString(),
    });

    return prod;
  }

  public updateTableStatus(tableNumber: number, status: any): RestaurantTable | null {
    const table = this.tables.find((t) => t.number === tableNumber);
    if (!table) return null;

    table.status = status;
    if (status === 'free') {
      table.activeOrderId = undefined;
      table.waiterName = undefined;
    }
    table.lastUpdated = new Date().toISOString();

    this.broadcast({
      type: 'TABLE_UPDATED',
      payload: table,
      timestamp: new Date().toISOString(),
    });

    return table;
  }

  public resetDemoData() {
    this.products = JSON.parse(JSON.stringify(initialProducts));
    this.tables = JSON.parse(JSON.stringify(initialTables));
    this.orders = JSON.parse(JSON.stringify(initialOrders));
    this.nextOrderNumber = 102;

    this.broadcast({
      type: 'FULL_SYNC',
      payload: {
        products: this.products,
        tables: this.tables,
        orders: this.orders,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export const store = new StoreManager();
