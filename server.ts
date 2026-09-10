import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.ts';
import { store } from './server/store.ts';
import { repository, dbStatusToUiStatus } from './server/repository.ts';

async function startServer() {
  // Initialize SQLite database and tables
  await initDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Carneriks Restaurant Real-Time API (SQLite Relational Engine)',
      timestamp: new Date().toISOString(),
      activeSSEClients: store.getActiveConnectionsCount(),
    });
  });

  // Database Connection Info / Health
  app.get('/api/db-status', (req, res) => {
    res.json({
      connected: true,
      driver: 'SQLite-Relational-ACID',
      database: 'carneriks.sqlite',
      latencyMs: 4,
      activeConnections: Math.max(1, store.getActiveConnectionsCount()),
      totalOrdersToday: store.getOrders().length,
      schemaReady: true,
      tables: ['usuarios', 'mesas', 'platos', 'pedidos', 'detalle_pedidos'],
    });
  });

  // ================= AUTH & USUARIOS =================
  app.post(['/api/auth/login', '/login'], (req, res) => {
    const { usuario, contrasena } = req.body;
    if (!usuario || !contrasena) {
      return res.status(400).json({ error: 'Se requiere usuario y contraseña.' });
    }

    const authResult = repository.authenticate(usuario, contrasena);
    if (!authResult) {
      return res.status(401).json({ error: 'Credenciales inválidas. Comprueba tu usuario o contraseña.' });
    }

    res.json({
      success: true,
      user: authResult,
    });
  });

  app.get('/api/usuarios', (req, res) => {
    res.json(repository.getAllUsers());
  });

  // ================= PLATOS / PRODUCTS =================
  app.get(['/api/platos', '/api/products'], (req, res) => {
    res.json(store.getProducts());
  });

  app.patch(['/api/platos/:id/stock', '/api/products/:id/stock'], (req, res) => {
    const { id } = req.params;
    const { stock, isAvailable, cantidad_disponible, disponible } = req.body;
    const newStock = stock !== undefined ? stock : cantidad_disponible;
    const newAvail = isAvailable !== undefined ? isAvailable : disponible;

    if (newStock === undefined) {
      return res.status(400).json({ error: 'Se requiere el parámetro stock o cantidad_disponible.' });
    }

    const updated = store.updateProductStock(id, Number(newStock), Boolean(newAvail));
    if (!updated) {
      return res.status(404).json({ error: 'Plato no encontrado' });
    }
    res.json(updated);
  });

  // ================= MESAS / TABLES =================
  app.get(['/api/mesas', '/api/tables'], (req, res) => {
    res.json(store.getTables());
  });

  app.patch(['/api/mesas/:id/estado', '/api/tables/:number/status'], (req, res) => {
    const idOrNum = req.params.id || req.params.number;
    const { estado, status } = req.body;
    const targetStatus = estado === 'ocupada' || status === 'occupied' ? 'occupied' : 'free';
    const tableNum = Number(idOrNum.replace('mesa-', ''));

    const updated = store.updateTableStatus(tableNum, targetStatus);
    if (!updated) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    res.json(updated);
  });

  // ================= PEDIDOS / ORDERS =================
  app.get(['/api/pedidos', '/api/orders'], (req, res) => {
    res.json(store.getOrders());
  });

  app.get(['/api/pedidos/:id', '/api/orders/:id'], (req, res) => {
    const order = repository.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(order);
  });

  app.post(['/api/pedidos', '/api/orders'], (req, res) => {
    try {
      const { tableNumber, mesa_id, waiterName, usuario_id, items, detalles, notes, notas } = req.body;
      const tNum = tableNumber || (mesa_id ? Number(String(mesa_id).replace('mesa-', '')) : undefined);
      const orderItems = items || detalles;

      if (!tNum || !orderItems || !orderItems.length) {
        return res.status(400).json({
          error: 'Datos de pedido incompletos: se requiere número de mesa y al menos un plato.',
        });
      }

      // Format items
      const formattedItems = orderItems.map((it: any) => ({
        productId: it.productId || it.plato_id,
        quantity: Number(it.quantity || it.cantidad || 1),
        doneness: it.doneness || it.termino,
        notes: it.notes || it.notas,
      }));

      const newOrder = store.createOrder({
        tableNumber: Number(tNum),
        waiterName: waiterName || usuario_id || 'Carlos M.',
        items: formattedItems,
        notes: notes || notas,
      });

      res.status(201).json(newOrder);
    } catch (err: any) {
      console.error('Error creating order in SQLite:', err);
      res.status(400).json({ error: err.message || 'Error al procesar el pedido en la base de datos.' });
    }
  });

  app.patch(['/api/pedidos/:id/estado', '/api/orders/:id/status'], (req, res) => {
    const { id } = req.params;
    const { estado, status } = req.body;
    const newStatus = status || (estado ? dbStatusToUiStatus(estado) : undefined);

    if (!newStatus) {
      return res.status(400).json({ error: 'Se requiere nuevo estado para el pedido.' });
    }

    const updated = store.updateOrderStatus(id, newStatus);
    if (!updated) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(updated);
  });

  // Demo Reset / Re-seed
  app.post(['/api/demo/reset', '/api/database/seed'], (req, res) => {
    store.resetDemoData();
    res.json({ message: 'Base de datos SQLite restablecida y sembrada con datos iniciales.' });
  });

  // Real-Time Server-Sent Events (SSE) Stream
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Register client
    store.addSSEClient(res);

    // Send initial snapshot from relational SQLite database
    const initialSync = {
      type: 'FULL_SYNC',
      payload: {
        products: store.getProducts(),
        tables: store.getTables(),
        orders: store.getOrders(),
      },
      timestamp: new Date().toISOString(),
    };
    res.write(`data: ${JSON.stringify(initialSync)}\n\n`);

    // Keep-alive heartbeat every 20 seconds
    const heartbeatTimer = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeatTimer);
      store.removeSSEClient(res);
    });
  });

  // API 404 handler
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'Ruta API no encontrada' });
  });

  // Vite middleware for development vs static files in production
  const isProduction = process.env.NODE_ENV === 'production' || process.argv[1]?.endsWith('server.cjs');
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Carneriks Server running on port ${PORT} with SQLite database.`);
  });
}

startServer();
