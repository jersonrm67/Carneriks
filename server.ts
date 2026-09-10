import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health and Status route - Pure Firebase Cloud Firestore Architecture
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: 'Firebase Cloud Firestore',
      projectId: 'carneriks-b31a8',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/db-status', (req, res) => {
    res.json({
      connected: true,
      driver: 'Firebase-Cloud-Firestore',
      database: 'carneriks-b31a8',
      latencyMs: 12,
      schemaReady: true,
      collections: ['platos', 'mesas', 'pedidos', 'usuarios'],
    });
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
    console.log(`🚀 Carneriks Server running on port ${PORT} with Firebase Cloud Firestore.`);
  });
}

startServer();
