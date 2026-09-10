import { repository } from './repository.ts';
import { Product, Order, RestaurantTable, SystemEvent, OrderStatus } from '../src/types.ts';

class StoreManager {
  private sseClients: Set<any> = new Set();

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
    return repository.getAllPlatos();
  }

  public getTables(): RestaurantTable[] {
    return repository.getAllMesas();
  }

  public getOrders(): Order[] {
    return repository.getAllOrders();
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
    const newOrder = repository.createOrder({
      tableNumber: data.tableNumber,
      waiterUserIdOrName: data.waiterName,
      items: data.items,
      notes: data.notes,
    });

    const updatedTables = repository.getAllMesas();
    const updatedTable = updatedTables.find((t) => t.number === data.tableNumber);
    const updatedProducts = repository.getAllPlatos();

    // Broadcast real-time events to all devices
    this.broadcast({
      type: 'ORDER_CREATED',
      payload: newOrder,
      timestamp: new Date().toISOString(),
    });

    this.broadcast({
      type: 'INVENTORY_UPDATED',
      payload: updatedProducts,
      timestamp: new Date().toISOString(),
    });

    this.broadcast({
      type: 'TABLE_UPDATED',
      payload: updatedTable,
      timestamp: new Date().toISOString(),
    });

    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): Order | null {
    const updatedOrder = repository.updateOrderStatus(orderId, status);
    if (!updatedOrder) return null;

    const now = new Date().toISOString();
    const allTables = repository.getAllMesas();
    const table = allTables.find((t) => t.number === updatedOrder.tableNumber);

    this.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      payload: updatedOrder,
      timestamp: now,
    });

    if (table) {
      this.broadcast({
        type: 'TABLE_UPDATED',
        payload: table,
        timestamp: now,
      });
    }

    // Also update inventory broadcast if order was cancelled
    if (status === 'cancelled') {
      this.broadcast({
        type: 'INVENTORY_UPDATED',
        payload: repository.getAllPlatos(),
        timestamp: now,
      });
    }

    return updatedOrder;
  }

  public updateProductStock(productId: string, stock: number, isAvailable: boolean): Product | null {
    const updated = repository.updatePlatoStock(productId, stock, isAvailable);
    if (!updated) return null;

    this.broadcast({
      type: 'INVENTORY_UPDATED',
      payload: repository.getAllPlatos(),
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  public updateTableStatus(tableNumber: number, status: 'free' | 'occupied'): RestaurantTable | null {
    const dbStatus = status === 'free' ? 'libre' : 'ocupada';
    const updated = repository.updateMesaEstado(tableNumber, dbStatus);
    if (!updated) return null;

    this.broadcast({
      type: 'TABLE_UPDATED',
      payload: updated,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  public resetDemoData() {
    repository.resetDatabaseToInitial();

    this.broadcast({
      type: 'FULL_SYNC',
      payload: {
        products: repository.getAllPlatos(),
        tables: repository.getAllMesas(),
        orders: repository.getAllOrders(),
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export const store = new StoreManager();
