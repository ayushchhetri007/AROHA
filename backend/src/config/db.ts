import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_FILE || path.resolve(__dirname, '../../swasthyasetu.db');
export const db = new Database(dbPath);

// Performance & integrity pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
