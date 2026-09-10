import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface DbUser {
  id: string;
  nombre: string;
  usuario: string;
  contrasena_hash: string;
  rol: 'mesero' | 'cocina' | 'administrador';
  activo: number;
  fecha_creacion: string;
}

export interface DbMesa {
  id: string;
  numero: number;
  capacidad: number;
  estado: 'libre' | 'ocupada';
  activa: number;
}

export interface DbPlato {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  categoria: string;
  cantidad_disponible: number;
  stock_minimo: number;
  disponible: number;
  activo: number;
  supports_doneness: number;
  cut_weight: string | null;
  badge: string | null;
  fecha_creacion: string;
}

export interface DbPedido {
  id: string;
  numero_pedido: number;
  mesa_id: string;
  usuario_id: string;
  estado: 'pendiente' | 'enviado' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';
  total: number;
  notas: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface DbDetallePedido {
  id: string;
  pedido_id: string;
  plato_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  estado: string;
  termino: string | null;
  notas: string | null;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = process.env.DATABASE_PATH || path.join(DB_DIR, 'carneriks.sqlite');

let SQL: any = null;
let db: Database | null = null;

function saveDatabase() {
  if (!db) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

let inTransaction = false;

export function execute(sql: string, params: any[] = []): void {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  if (!inTransaction) {
    saveDatabase();
  }
}

export function transaction<T>(callback: () => T): T {
  if (!db) throw new Error('Database not initialized');
  inTransaction = true;
  db.run('BEGIN TRANSACTION;');
  try {
    const result = callback();
    db.run('COMMIT;');
    inTransaction = false;
    saveDatabase();
    return result;
  } catch (err: any) {
    inTransaction = false;
    try {
      db.run('ROLLBACK;');
    } catch (rollbackErr) {
      // transaction may have auto-rolled back on SQLite error
    }
    throw err;
  }
}

function initializeSchema() {
  if (!db) return;

  db.run('PRAGMA foreign_keys = ON;');

  // 1. Usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      usuario TEXT UNIQUE NOT NULL,
      contrasena_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('mesero', 'cocina', 'administrador')),
      activo INTEGER NOT NULL DEFAULT 1,
      fecha_creacion TEXT NOT NULL
    );
  `);

  // 2. Mesas
  db.run(`
    CREATE TABLE IF NOT EXISTS mesas (
      id TEXT PRIMARY KEY,
      numero INTEGER UNIQUE NOT NULL,
      capacidad INTEGER NOT NULL DEFAULT 4,
      estado TEXT NOT NULL CHECK(estado IN ('libre', 'ocupada')),
      activa INTEGER NOT NULL DEFAULT 1
    );
  `);

  // 3. Platos
  db.run(`
    CREATE TABLE IF NOT EXISTS platos (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio REAL NOT NULL,
      imagen TEXT,
      categoria TEXT NOT NULL,
      cantidad_disponible INTEGER NOT NULL DEFAULT 0,
      stock_minimo INTEGER NOT NULL DEFAULT 3,
      disponible INTEGER NOT NULL DEFAULT 1,
      activo INTEGER NOT NULL DEFAULT 1,
      supports_doneness INTEGER DEFAULT 0,
      cut_weight TEXT,
      badge TEXT,
      fecha_creacion TEXT NOT NULL
    );
  `);

  // 4. Pedidos
  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id TEXT PRIMARY KEY,
      numero_pedido INTEGER UNIQUE NOT NULL,
      mesa_id TEXT NOT NULL,
      usuario_id TEXT NOT NULL,
      estado TEXT NOT NULL CHECK(estado IN ('pendiente', 'enviado', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
      total REAL NOT NULL DEFAULT 0.0,
      notas TEXT,
      fecha_creacion TEXT NOT NULL,
      fecha_actualizacion TEXT NOT NULL,
      FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
  `);

  // 5. Detalle de pedidos
  db.run(`
    CREATE TABLE IF NOT EXISTS detalle_pedidos (
      id TEXT PRIMARY KEY,
      pedido_id TEXT NOT NULL,
      plato_id TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      termino TEXT,
      notas TEXT,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (plato_id) REFERENCES platos(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
  `);

  // Check if seed data needed
  const userCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM usuarios')?.count || 0;
  if (userCount === 0) {
    seedDatabase();
  }
}

export function seedDatabase() {
  if (!db) return;

  const now = new Date().toISOString();

  // Clear existing
  db.run('DELETE FROM detalle_pedidos;');
  db.run('DELETE FROM pedidos;');
  db.run('DELETE FROM platos;');
  db.run('DELETE FROM mesas;');
  db.run('DELETE FROM usuarios;');

  // 1. Usuarios con contraseña_hash
  const defaultPasswordHash = bcrypt.hashSync('mesero123', 10);
  const kitchenPasswordHash = bcrypt.hashSync('cocina123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  const users = [
    ['usr-admin', 'Administrador General', 'admin', adminPasswordHash, 'administrador', 1, now],
    ['usr-mesero-1', 'Carlos M.', 'carlos', defaultPasswordHash, 'mesero', 1, now],
    ['usr-mesero-2', 'Laura G.', 'laura', defaultPasswordHash, 'mesero', 1, now],
    ['usr-mesero-3', 'Andrés R.', 'mesero', defaultPasswordHash, 'mesero', 1, now],
    ['usr-cocina-1', 'Chef Marco', 'chef', kitchenPasswordHash, 'cocina', 1, now],
    ['usr-cocina-2', 'Parrillero Hugo', 'hugo', kitchenPasswordHash, 'cocina', 1, now],
    ['usr-cocina-3', 'Cocina Central', 'cocina', kitchenPasswordHash, 'cocina', 1, now],
  ];

  for (const u of users) {
    db.run(
      'INSERT INTO usuarios (id, nombre, usuario, contrasena_hash, rol, activo, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?);',
      u
    );
  }

  // 2. Mesas
  const tables = [
    ['mesa-1', 1, 4, 'libre', 1],
    ['mesa-2', 2, 2, 'libre', 1],
    ['mesa-3', 3, 6, 'ocupada', 1],
    ['mesa-4', 4, 4, 'libre', 1],
    ['mesa-5', 5, 4, 'ocupada', 1],
    ['mesa-6', 6, 8, 'libre', 1],
    ['mesa-7', 7, 2, 'libre', 1],
    ['mesa-8', 8, 4, 'libre', 1],
    ['mesa-9', 9, 6, 'libre', 1],
    ['mesa-10', 10, 4, 'libre', 1],
  ];

  for (const t of tables) {
    db.run(
      'INSERT INTO mesas (id, numero, capacidad, estado, activa) VALUES (?, ?, ?, ?, ?);',
      t
    );
  }

  // 3. Platos
  const platos = [
    [
      'prod-1',
      'Bife de Chorizo Premium',
      'Corte tradicional argentino jugoso de 400g, asado a las brasas con sal en grano.',
      68.0,
      null,
      'carnes',
      18, // cantidad_disponible
      5,  // stock_minimo
      1,
      1,
      1, // supports_doneness
      '400g',
      'Especialidad',
      now,
    ],
    [
      'prod-2',
      'Ojo de Bife (Ribeye) Angus',
      'Veteado marmóreo excepcional, textura tierna y sabor concentrado a la parrilla.',
      75.0,
      null,
      'carnes',
      12,
      4,
      1,
      1,
      1,
      '380g',
      'Más Pedido',
      now,
    ],
    [
      'prod-3',
      'Entraña Fina a la Parrilla',
      'Corte delgado de cocción rápida con crocante piel exterior y centro tierno.',
      62.0,
      null,
      'carnes',
      15,
      4,
      1,
      1,
      1,
      '320g',
      null,
      now,
    ],
    [
      'prod-4',
      'Picaña Prime Brasileña',
      'Corte con capa dorada de grasa natural que funde sobre el hierro caliente.',
      72.0,
      null,
      'carnes',
      9,
      3,
      1,
      1,
      1,
      '400g',
      'Prime',
      now,
    ],
    [
      'prod-5',
      'Hamburguesa Carneriks Doble Brasa',
      '300g blend de costillar y picaña, queso provolone fundido, panceta y cebolla caramelizada.',
      42.0,
      null,
      'carnes',
      25,
      5,
      1,
      1,
      1,
      '300g',
      null,
      now,
    ],
    [
      'prod-6',
      'Provoleta Asada al Oreganato',
      'Queso provolone fundido al hierro con orégano fresco, ají molido y aceite de oliva virgen.',
      28.0,
      null,
      'entradas_guarniciones',
      20,
      5,
      1,
      1,
      0,
      null,
      'Entrada Clásica',
      now,
    ],
    [
      'prod-7',
      'Papas Rústicas con Romero & Ajo',
      'Papas doradas en doble cocción con romero de huerta y alioli de ajo asado.',
      19.0,
      null,
      'entradas_guarniciones',
      35,
      8,
      1,
      1,
      0,
      null,
      null,
      now,
    ],
    [
      'prod-8',
      'Ensalada Parrillera Carneriks',
      'Rúcula fresca silvestre, tomates cherry asados, lascas de parmesano reggiano y vinagreta.',
      22.0,
      null,
      'entradas_guarniciones',
      20,
      5,
      1,
      1,
      0,
      null,
      null,
      now,
    ],
    [
      'prod-9',
      'Limonada de Hierbabuena & Jengibre',
      'Refrescante, preparada al momento con limones frescos y hojas de hierbabuena maceradas.',
      14.0,
      null,
      'bebidas',
      40,
      10,
      1,
      1,
      0,
      null,
      null,
      now,
    ],
    [
      'prod-10',
      'Copa Tinto Malbec Reserva',
      'Mendoza, Argentina. Notas de frutos rojos maduros, taninos redondos, ideal para carnes rojas.',
      24.0,
      null,
      'bebidas',
      30,
      6,
      1,
      1,
      0,
      null,
      null,
      now,
    ],
    [
      'prod-11',
      'Cerveza Artesanal Roja / IPA',
      'Elaboración local bien fría en botella de 500ml.',
      18.0,
      null,
      'bebidas',
      22,
      6,
      1,
      1,
      0,
      null,
      null,
      now,
    ],
    [
      'prod-12',
      'Flan Casero con Dulce de Leche',
      'Receta tradicional con 8 yemas, caramelo dorado y generosa porción de dulce de leche.',
      20.0,
      null,
      'postres',
      14,
      4,
      1,
      1,
      0,
      null,
      null,
      now,
    ],
  ];

  for (const p of platos) {
    db.run(
      `INSERT INTO platos (
        id, nombre, descripcion, precio, imagen, categoria,
        cantidad_disponible, stock_minimo, disponible, activo,
        supports_doneness, cut_weight, badge, fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      p
    );
  }

  // 4. Pedidos y Detalles Iniciales (Demo para cocina y mesero)
  const order1Time = new Date(Date.now() - 14 * 60 * 1000).toISOString();
  db.run(
    `INSERT INTO pedidos (id, numero_pedido, mesa_id, usuario_id, estado, total, notas, fecha_creacion, fecha_actualizacion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['ord-100', 100, 'mesa-5', 'usr-mesero-2', 'listo', 155.0, 'Mesa con niños, servir juntos.', order1Time, order1Time]
  );

  db.run(
    `INSERT INTO detalle_pedidos (id, pedido_id, plato_id, cantidad, precio_unitario, subtotal, estado, termino, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['det-1', 'ord-100', 'prod-1', 2, 68.0, 136.0, 'listo', 'Término Medio', 'Punto bajo de sal']
  );
  db.run(
    `INSERT INTO detalle_pedidos (id, pedido_id, plato_id, cantidad, precio_unitario, subtotal, estado, termino, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['det-2', 'ord-100', 'prod-7', 1, 19.0, 19.0, 'listo', null, null]
  );

  const order2Time = new Date(Date.now() - 6 * 60 * 1000).toISOString();
  db.run(
    `INSERT INTO pedidos (id, numero_pedido, mesa_id, usuario_id, estado, total, notas, fecha_creacion, fecha_actualizacion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['ord-101', 101, 'mesa-3', 'usr-mesero-1', 'en_preparacion', 165.0, null, order2Time, order2Time]
  );

  db.run(
    `INSERT INTO detalle_pedidos (id, pedido_id, plato_id, cantidad, precio_unitario, subtotal, estado, termino, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['det-3', 'ord-101', 'prod-2', 1, 75.0, 75.0, 'en_preparacion', 'Tres Cuartos', 'Con chimichurri aparte']
  );
  db.run(
    `INSERT INTO detalle_pedidos (id, pedido_id, plato_id, cantidad, precio_unitario, subtotal, estado, termino, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['det-4', 'ord-101', 'prod-3', 1, 62.0, 62.0, 'en_preparacion', 'Término Medio', null]
  );
  db.run(
    `INSERT INTO detalle_pedidos (id, pedido_id, plato_id, cantidad, precio_unitario, subtotal, estado, termino, notas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ['det-5', 'ord-101', 'prod-6', 1, 28.0, 28.0, 'en_preparacion', null, null]
  );

  saveDatabase();
  console.log('✅ SQLite Database successfully initialized and seeded with Carneriks entities.');
}

export async function initDatabase(): Promise<void> {
  if (db) return;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      console.log(`📂 Loaded existing SQLite database from ${DB_FILE}`);
    } catch (err) {
      console.warn('Could not read existing DB file, creating fresh database:', err);
      db = new SQL.Database();
    }
  } else {
    console.log(`Creating fresh SQLite database at ${DB_FILE}`);
    db = new SQL.Database();
  }

  initializeSchema();
}
