import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory:', dataDir);
}

const dbPath = path.join(dataDir, 'facewhiz.sqlite');
console.log('Database path:', dbPath);

let db;
try {
  // Create database connection
  const initializeDb = async () => {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Enable WAL mode for better concurrency
    await db.exec('PRAGMA journal_mode = WAL');
    
    // Test connection
    await db.get('SELECT 1');
    console.log('✓ Database connection successful');
    
    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        department TEXT,
        role TEXT,
        imageUrl TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS descriptors (
        id TEXT PRIMARY KEY,
        personId TEXT NOT NULL,
        descriptor TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (personId) REFERENCES people(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_descriptors_personId ON descriptors(personId);
    `);
    
    console.log('✓ Database tables initialized successfully');
    
    // Verify tables exist
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('✓ Database tables:', tables.map(t => t.name).join(', '));
    
    return db;
  };
  
  db = await initializeDb();
  
} catch (error) {
  console.error('✗ Database initialization error:', error);
  throw error;
}

export default db;