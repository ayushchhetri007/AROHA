"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.db = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/swasthyasetu'
});
exports.pool = pool;
pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
});
// Converts SQLite-style positional `?` placeholders (as used throughout the
// existing controllers) into PostgreSQL's `$1, $2, ...` placeholders, while
// leaving any literal `?` inside single-quoted string literals untouched.
function toPgPlaceholders(sql) {
    let result = '';
    let inQuote = false;
    let paramIndex = 0;
    for (let i = 0; i < sql.length; i++) {
        const ch = sql[i];
        if (ch === "'")
            inQuote = !inQuote;
        if (ch === '?' && !inQuote) {
            paramIndex++;
            result += `$${paramIndex}`;
        }
        else {
            result += ch;
        }
    }
    return result;
}
function flattenParams(params) {
    return params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
}
// Wraps a Pool or a single PoolClient (used inside transactions) behind the
// same prepare().get()/.all()/.run() shape the app's controllers already use
// for SQLite, so query call sites only need `await` added, not rewriting.
function createDbLike(executor) {
    return {
        prepare(sql) {
            const pgSql = toPgPlaceholders(sql);
            return {
                get: async (...params) => {
                    const res = await executor.query(pgSql, flattenParams(params));
                    return res.rows[0];
                },
                all: async (...params) => {
                    const res = await executor.query(pgSql, flattenParams(params));
                    return res.rows;
                },
                run: async (...params) => {
                    const res = await executor.query(pgSql, flattenParams(params));
                    return { changes: res.rowCount ?? 0 };
                }
            };
        },
        exec: async (sql) => {
            await executor.query(sql);
        },
        transaction(fn) {
            return async () => {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    const trx = createDbLike(client);
                    await fn(trx);
                    await client.query('COMMIT');
                }
                catch (err) {
                    await client.query('ROLLBACK');
                    throw err;
                }
                finally {
                    client.release();
                }
            };
        }
    };
}
exports.db = createDbLike(pool);
exports.default = exports.db;
