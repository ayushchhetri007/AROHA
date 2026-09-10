"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const db_js_1 = __importDefault(require("../config/db.js"));
function auditLog(action, resourceType, getResourceId) {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id || 'anonymous';
            const resourceId = getResourceId ? getResourceId(req) : req.params.id || null;
            const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
            await db_js_1.default.prepare(`
        INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(`aud-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, userId, action, resourceType, resourceId, JSON.stringify({ method: req.method, path: req.path }), ip);
        }
        catch (e) {
            console.error('Audit log error:', e);
        }
        next();
    };
}
