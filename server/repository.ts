import {
  queryAll,
  queryOne,
  execute,
  transaction,
  seedDatabase,
  DbUser,
  DbMesa,
  DbPlato,
  DbPedido,
  DbDetallePedido,
} from './db.ts';
import bcrypt from 'bcryptjs';
import { Product, RestaurantTable, Order, OrderItem, OrderStatus } from '../src/types.ts';

// Helper to map DB status to UI status
export function dbStatusToUiStatus(status: string): OrderStatus {
  switch (status) {
    case 'en_preparacion':
      return 'preparing';
    case 'listo':
      return 'ready';
    case 'entregado':
      return 'delivered';
    case 'cancelado':
      return 'cancelled';
    case 'pendiente':
    case 'enviado':
    default:
      return 'pending';
  }
}

export function uiStatusToDbStatus(status: OrderStatus | string): string {
  switch (status) {
    case 'preparing':
      return 'en_preparacion';
    case 'ready':
      return 'listo';
    case 'delivered':
      return 'entregado';
    case 'cancelled':
      return 'cancelado';
    case 'pending':
    default:
      return 'pendiente';
  }
}

export class RestaurantRepository {
  // ================= USERS & AUTH =================
  public getAllUsers(): Array<Omit<DbUser, 'contrasena_hash'>> {
    const rows = queryAll<DbUser>('SELECT id, nombre, usuario, rol, activo, fecha_creacion FROM usuarios WHERE activo = 1 ORDER BY nombre ASC;');
    return rows.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      usuario: u.usuario,
      rol: u.rol,
      activo: u.activo,
      fecha_creacion: u.fecha_creacion,
    }));
  }

  public authenticate(usuario: string, contrasena: string): Omit<DbUser, 'contrasena_hash'> | null {
    const user = queryOne<DbUser>('SELECT * FROM usuarios WHERE usuario = ? AND activo = 1;', [usuario]);
    if (!user) return null;

    const isValid = bcrypt.compareSync(contrasena, user.contrasena_hash);
    if (!isValid) return null;

    return {
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
      activo: user.activo,
      fecha_creacion: user.fecha_creacion,
    };
  }

  public findUserByNameOrId(nameOrId: string): DbUser | null {
    return queryOne<DbUser>(
      'SELECT * FROM usuarios WHERE id = ? OR nombre = ? OR usuario = ? LIMIT 1;',
      [nameOrId, nameOrId, nameOrId]
    );
  }

  // ================= PLATO / PRODUCT =================
  public getAllPlatos(): Product[] {
    const rows = queryAll<DbPlato>('SELECT * FROM platos WHERE activo = 1 ORDER BY categoria ASC, nombre ASC;');
    return rows.map((p) => ({
      id: p.id,
      name: p.nombre,
      category: p.categoria as any,
      price: p.precio,
      stock: p.cantidad_disponible,
      isAvailable: Boolean(p.disponible && p.cantidad_disponible > 0),
      description: p.descripcion || '',
      supportsDoneness: Boolean(p.supports_doneness),
      cutWeight: p.cut_weight || undefined,
      badge: p.badge || undefined,
      stockMinimo: p.stock_minimo,
    }));
  }

  public getPlatoById(id: string): DbPlato | null {
    return queryOne<DbPlato>('SELECT * FROM platos WHERE id = ?;', [id]);
  }

  public updatePlatoStock(id: string, stock: number, isAvailable: boolean): Product | null {
    const plato = this.getPlatoById(id);
    if (!plato) return null;

    const validStock = Math.max(0, Number(stock));
    const disponible = isAvailable && validStock > 0 ? 1 : 0;

    execute(
      'UPDATE platos SET cantidad_disponible = ?, disponible = ? WHERE id = ?;',
      [validStock, disponible, id]
    );

    const updated = this.getPlatoById(id);
    if (!updated) return null;

    return {
      id: updated.id,
      name: updated.nombre,
      category: updated.categoria as any,
      price: updated.precio,
      stock: updated.cantidad_disponible,
      isAvailable: Boolean(updated.disponible && updated.cantidad_disponible > 0),
      description: updated.descripcion || '',
      supportsDoneness: Boolean(updated.supports_doneness),
      cutWeight: updated.cut_weight || undefined,
      badge: updated.badge || undefined,
      stockMinimo: updated.stock_minimo,
    };
  }

  // ================= MESAS / TABLES =================
  public getAllMesas(): RestaurantTable[] {
    const dbMesas = queryAll<DbMesa>('SELECT * FROM mesas WHERE activa = 1 ORDER BY numero ASC;');
    const activeOrders = queryAll<DbPedido & { table_number: number; waiter_name: string }>(`
      SELECT p.*, m.numero as table_number, u.nombre as waiter_name
      FROM pedidos p
      JOIN mesas m ON p.mesa_id = m.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.estado IN ('pendiente', 'enviado', 'en_preparacion', 'listo')
      ORDER BY p.fecha_creacion DESC;
    `);

    return dbMesas.map((m) => {
      const activeForMesa = activeOrders.find((o) => o.mesa_id === m.id);

      let status: RestaurantTable['status'] = m.estado === 'libre' ? 'free' : 'occupied';
      if (activeForMesa) {
        if (activeForMesa.estado === 'listo') {
          status = 'ready_to_serve';
        } else {
          status = 'ordered';
        }
      }

      return {
        id: m.id,
        number: m.numero,
        capacity: m.capacidad,
        status,
        dbEstado: m.estado,
        activeOrderId: activeForMesa?.id,
        waiterName: activeForMesa?.waiter_name,
        lastUpdated: activeForMesa ? activeForMesa.fecha_actualizacion : new Date().toISOString(),
      };
    });
  }

  public getMesaByNumero(numero: number): DbMesa | null {
    return queryOne<DbMesa>('SELECT * FROM mesas WHERE numero = ?;', [numero]);
  }

  public getMesaById(id: string): DbMesa | null {
    return queryOne<DbMesa>('SELECT * FROM mesas WHERE id = ?;', [id]);
  }

  public updateMesaEstado(numero: number, estado: 'libre' | 'ocupada'): RestaurantTable | null {
    const mesa = this.getMesaByNumero(numero);
    if (!mesa) return null;

    execute('UPDATE mesas SET estado = ? WHERE id = ?;', [estado, mesa.id]);
    const all = this.getAllMesas();
    return all.find((m) => m.number === numero) || null;
  }

  // ================= PEDIDOS / ORDERS =================
  public getAllOrders(): Order[] {
    const pedidos = queryAll<DbPedido & { numero_mesa: number; nombre_mesero: string }>(`
      SELECT p.*, m.numero as numero_mesa, u.nombre as nombre_mesero
      FROM pedidos p
      JOIN mesas m ON p.mesa_id = m.id
      JOIN usuarios u ON p.usuario_id = u.id
      ORDER BY p.fecha_creacion DESC;
    `);

    const allItems = queryAll<DbDetallePedido & { nombre_plato: string }>(`
      SELECT d.*, pl.nombre as nombre_plato
      FROM detalle_pedidos d
      JOIN platos pl ON d.plato_id = pl.id;
    `);

    return pedidos.map((p) => {
      const items: OrderItem[] = allItems
        .filter((it) => it.pedido_id === p.id)
        .map((it) => ({
          id: it.id,
          productId: it.plato_id,
          productName: it.nombre_plato,
          quantity: it.cantidad,
          unitPrice: it.precio_unitario,
          doneness: it.termino as any,
          notes: it.notas || undefined,
        }));

      return {
        id: p.id,
        orderNumber: p.numero_pedido,
        tableNumber: p.numero_mesa,
        waiterName: p.nombre_mesero,
        items,
        status: dbStatusToUiStatus(p.estado),
        createdAt: p.fecha_creacion,
        preparingAt: p.estado === 'en_preparacion' || p.estado === 'listo' || p.estado === 'entregado' ? p.fecha_actualizacion : undefined,
        readyAt: p.estado === 'listo' || p.estado === 'entregado' ? p.fecha_actualizacion : undefined,
        deliveredAt: p.estado === 'entregado' ? p.fecha_actualizacion : undefined,
        totalAmount: p.total,
        notes: p.notas || undefined,
      };
    });
  }

  public getOrderById(orderId: string): Order | null {
    const orders = this.getAllOrders();
    return orders.find((o) => o.id === orderId) || null;
  }

  public createOrder(data: {
    tableNumber: number;
    waiterUserIdOrName: string;
    items: Array<{ productId: string; quantity: number; doneness?: string; notes?: string }>;
    notes?: string;
  }): Order {
    if (!data.items || data.items.length === 0) {
      throw new Error('El pedido debe contener al menos un plato.');
    }

    // Run inside SQLite ACID transaction
    return transaction(() => {
      // 1. Verify mesa
      const mesa = this.getMesaByNumero(data.tableNumber);
      if (!mesa) {
        throw new Error(`La mesa número ${data.tableNumber} no existe.`);
      }

      // 2. Verify waiter / user
      let user = this.findUserByNameOrId(data.waiterUserIdOrName);
      if (!user) {
        // Default to first mesero if not found
        user = queryOne<DbUser>("SELECT * FROM usuarios WHERE rol = 'mesero' LIMIT 1;");
      }
      if (!user) {
        throw new Error('No se encontró un usuario válido para registrar el pedido.');
      }

      // 3. Verify stock for each item in the transaction
      const verifiedItems: Array<{
        plato: DbPlato;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        doneness?: string;
        notes?: string;
      }> = [];

      for (const item of data.items) {
        if (item.quantity <= 0) {
          throw new Error('La cantidad de cada plato debe ser mayor a 0.');
        }

        const plato = this.getPlatoById(item.productId);
        if (!plato) {
          throw new Error(`El plato con ID ${item.productId} no existe.`);
        }

        if (plato.cantidad_disponible < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${plato.nombre}". Disponible: ${plato.cantidad_disponible}, Solicitado: ${item.quantity}.`
          );
        }

        const subtotal = item.quantity * plato.precio;
        verifiedItems.push({
          plato,
          quantity: item.quantity,
          unitPrice: plato.precio,
          subtotal,
          doneness: item.doneness,
          notes: item.notes,
        });
      }

      // 4. Calculate total
      const totalAmount = verifiedItems.reduce((acc, it) => acc + it.subtotal, 0);

      // 5. Decrement inventory for each item
      for (const it of verifiedItems) {
        const newStock = it.plato.cantidad_disponible - it.quantity;
        const newDisponible = newStock > 0 ? 1 : 0;
        execute(
          'UPDATE platos SET cantidad_disponible = ?, disponible = ? WHERE id = ?;',
          [newStock, newDisponible, it.plato.id]
        );
      }

      // 6. Generate order number
      const maxOrderRow = queryOne<{ max_num: number | null }>('SELECT MAX(numero_pedido) as max_num FROM pedidos;');
      const nextOrderNumber = (maxOrderRow?.max_num || 99) + 1;
      const orderId = `ord-${Date.now()}`;
      const now = new Date().toISOString();

      // 7. Insert pedido
      execute(
        `INSERT INTO pedidos (
          id, numero_pedido, mesa_id, usuario_id, estado, total, notas, fecha_creacion, fecha_actualizacion
        ) VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?, ?);`,
        [orderId, nextOrderNumber, mesa.id, user.id, totalAmount, data.notes || null, now, now]
      );

      // 8. Insert detalle_pedidos
      verifiedItems.forEach((it, idx) => {
        const detailId = `det-${Date.now()}-${idx}`;
        execute(
          `INSERT INTO detalle_pedidos (
            id, pedido_id, plato_id, cantidad, precio_unitario, subtotal, estado, termino, notas
          ) VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, ?);`,
          [detailId, orderId, it.plato.id, it.quantity, it.unitPrice, it.subtotal, it.doneness || null, it.notes || null]
        );
      });

      // 9. Update mesa state to 'ocupada'
      execute('UPDATE mesas SET estado = \'ocupada\' WHERE id = ?;', [mesa.id]);

      // 10. Return full formatted Order
      const createdOrder = this.getOrderById(orderId);
      if (!createdOrder) {
        throw new Error('Error al recuperar el pedido creado de la base de datos.');
      }
      return createdOrder;
    });
  }

  public updateOrderStatus(orderId: string, newStatus: OrderStatus): Order | null {
    const existing = queryOne<DbPedido>('SELECT * FROM pedidos WHERE id = ?;', [orderId]);
    if (!existing) return null;

    const dbStatus = uiStatusToDbStatus(newStatus);
    const now = new Date().toISOString();

    return transaction(() => {
      // 1. Update pedido
      execute(
        'UPDATE pedidos SET estado = ?, fecha_actualizacion = ? WHERE id = ?;',
        [dbStatus, now, orderId]
      );

      // Also update detalle_pedidos status
      execute(
        'UPDATE detalle_pedidos SET estado = ? WHERE pedido_id = ?;',
        [dbStatus, orderId]
      );

      // 2. Handle mesa state transitions:
      // If delivered or cancelled, check if there are other active orders on that table
      if (dbStatus === 'entregado' || dbStatus === 'cancelado') {
        const otherActiveOrders = queryOne<{ count: number }>(
          `SELECT COUNT(*) as count FROM pedidos 
           WHERE mesa_id = ? AND estado IN ('pendiente', 'enviado', 'en_preparacion', 'listo') AND id != ?;`,
          [existing.mesa_id, orderId]
        );

        if (!otherActiveOrders || otherActiveOrders.count === 0) {
          // Free table
          execute('UPDATE mesas SET estado = \'libre\' WHERE id = ?;', [existing.mesa_id]);
        }

        // If cancelled, restore stock!
        if (dbStatus === 'cancelado' && existing.estado !== 'cancelado') {
          const details = queryAll<DbDetallePedido>('SELECT * FROM detalle_pedidos WHERE pedido_id = ?;', [orderId]);
          for (const d of details) {
            execute(
              'UPDATE platos SET cantidad_disponible = cantidad_disponible + ?, disponible = 1 WHERE id = ?;',
              [d.cantidad, d.plato_id]
            );
          }
        }
      }

      return this.getOrderById(orderId);
    });
  }

  public resetDatabaseToInitial() {
    seedDatabase();
  }
}

export const repository = new RestaurantRepository();
