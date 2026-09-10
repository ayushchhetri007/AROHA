import { Pool, PoolClient, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/swasthyasetu'
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

// Converts SQLite-style positional `?` placeholders (as used throughout the
// existing controllers) into PostgreSQL's `$1, $2, ...` placeholders, while
// leaving any literal `?` inside single-quoted string literals untouched.
function toPgPlaceholders(sql: string): string {
  let result = '';
  let inQuote = false;
  let paramIndex = 0;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") inQuote = !inQuote;
    if (ch === '?' && !inQuote) {
      paramIndex++;
      result += `$${paramIndex}`;
    } else {
      result += ch;
    }
  }
  return result;
}

function flattenParams(params: any[]): any[] {
  return params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
}

interface DbLike {
  prepare(sql: string): {
    get: <T extends QueryResultRow = any>(...params: any[]) => Promise<T | undefined>;
    all: <T extends QueryResultRow = any>(...params: any[]) => Promise<T[]>;
    run: (...params: any[]) => Promise<{ changes: number }>;
  };
  exec(sql: string): Promise<void>;
  transaction(fn: (trx: DbLike) => Promise<void> | void): () => Promise<void>;
}

// Wraps a Pool or a single PoolClient (used inside transactions) behind the
// same prepare().get()/.all()/.run() shape the app's controllers already use
// for SQLite, so query call sites only need `await` added, not rewriting.
function createDbLike(executor: Pool | PoolClient): DbLike {
  return {
    prepare(sql: string) {
      const pgSql = toPgPlaceholders(sql);
      return {
        get: async (...params: any[]) => {
          const res = await executor.query(pgSql, flattenParams(params));
          return res.rows[0];
        },
        all: async (...params: any[]) => {
          const res = await executor.query(pgSql, flattenParams(params));
          return res.rows;
        },
        run: async (...params: any[]) => {
          const res = await executor.query(pgSql, flattenParams(params));
          return { changes: res.rowCount ?? 0 };
        }
      };
    },
    exec: async (sql: string) => {
      await executor.query(sql);
    },
    transaction(fn: (trx: DbLike) => Promise<void> | void) {
      return async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const trx = createDbLike(client);
          await fn(trx);
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      };
    }
  };
}

export const db = createDbLike(pool);
export { pool };
export default db;
