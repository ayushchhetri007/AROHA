import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import db from '../config/db.js';

export function auditLog(action: string, resourceType: string, getResourceId?: (req: AuthRequest) => string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || 'anonymous';
      const resourceId = getResourceId ? getResourceId(req) : req.params.id || null;
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

      await db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(`aud-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, userId, action, resourceType, resourceId, JSON.stringify({ method: req.method, path: req.path }), ip);
    } catch (e) {
      console.error('Audit log error:', e);
    }
    next();
  };
}
