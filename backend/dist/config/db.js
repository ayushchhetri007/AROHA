"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbPath = process.env.DATABASE_FILE || path_1.default.resolve(__dirname, '../../swasthyasetu.db');
exports.db = new better_sqlite3_1.default(dbPath);
// Performance & integrity pragmas
exports.db.pragma('journal_mode = WAL');
exports.db.pragma('foreign_keys = ON');
exports.default = exports.db;
