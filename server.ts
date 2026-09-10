import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Carneriks Restaurant Real-Time API',
      timestamp: new Date().toISOString(),
      activeSSEClients: store.getActiveConnectionsCount(),
    });
  });

  // Database Connection Info / Health
  app.get('/api/db-status', (req, res) => {
    res.json({
      connected: true,
      driver: 'Carneriks-RealTime-Engine',
      latencyMs: 12,
      activeConnections: Math.max(1, store.getActiveConnectionsCount()),
      totalOrdersToday: store.getOrders().length,
      schemaReady: true,
      collections: ['products', 'orders', 'tables', 'audit_logs'],
    });
  });

  // Products
  app.get('/api/products', (req, res) => {
    res.json(store.getProducts());
  });

  app.patch('/api/products/:id/stock', (req, res) => {
    const { id } = req.params;
    const { stock, isAvailable } = req.body;
    const updated = store.updateProductStock(id, Number(stock), Boolean(isAvailable));
    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(updated);
  });

  // Tables
  app.get('/api/tables', (req, res) => {
    res.json(store.getTables());
  });

  app.patch('/api/tables/:number/status', (req, res) => {
    const tableNumber = Number(req.params.number);
    const { status } = req.body;
    const updated = store.updateTableStatus(tableNumber, status);
    if (!updated) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }
    res.json(updated);
  });

  // Orders
  app.get('/api/orders', (req, res) => {
    res.json(store.getOrders());
  });

  app.post('/api/orders', (req, res) => {
    const { tableNumber, waiterName, items, notes } = req.body;
    if (!tableNumber || !items || !items.length) {
      return res.status(400).json({ error: 'Datos de orden incompletos: se requiere mesa y al menos un producto.' });
    }

    const newOrder = store.createOrder({
      tableNumber: Number(tableNumber),
      waiterName: waiterName || 'Mesero',
      items,
      notes,
    });

    res.status(201).json(newOrder);
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const updated = store.updateOrderStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json(updated);
  });

  // Demo Reset
  app.post('/api/demo/reset', (req, res) => {
    store.resetDemoData();
    res.json({ message: 'Datos restablecidos a valores iniciales de Carneriks' });
  });

  // Real-Time Server-Sent Events (SSE) Stream
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Register client
    store.addSSEClient(res);

    // Send initial snapshot
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
    console.log(`Carneriks Server running on port ${PORT}`);
  });
}

startServer();
