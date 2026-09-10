import { Request, Response, NextFunction } from 'express';
import db from '../config/db.js';
import { User } from '../types/index.js';

export interface AuthRequest extends Request {
  user?: User;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Allow demo authorization header or session simulation
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-demo-role'] as string;
  const userIdHeader = req.headers['x-user-id'] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token.startsWith('demo-token-')) {
      const uId = token.replace('demo-token-', '');
      let user = await db.prepare('SELECT * FROM users WHERE id = ?').get(uId) as User | undefined;
      if (!user) {
        const patId = uId.replace(/^usr-/, '');
        const patient = await db.prepare('SELECT * FROM patients WHERE UPPER(id) = UPPER(?) OR UPPER(id) = UPPER(?) OR phone = ?').get(patId, uId, patId) as any;
        if (patient) {
          user = {
            id: uId,
            full_name: patient.full_name,
            email: `${patient.id.toLowerCase()}@sevahealth.local`,
            phone: patient.phone,
            role: 'patient',
            language: 'mr'
          } as User;
        }
      }
      if (user) {
        req.user = user;
        return next();
      }
    }
  }

  if (userIdHeader) {
    let user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userIdHeader) as User | undefined;
    if (!user) {
      const patId = userIdHeader.replace(/^usr-/, '');
      const patient = await db.prepare('SELECT * FROM patients WHERE UPPER(id) = UPPER(?) OR UPPER(id) = UPPER(?) OR phone = ?').get(patId, userIdHeader, patId) as any;
      if (patient) {
        user = {
          id: userIdHeader,
          full_name: patient.full_name,
          email: `${patient.id.toLowerCase()}@sevahealth.local`,
          phone: patient.phone,
          role: 'patient',
          language: 'mr'
        } as User;
      }
    }
    if (user) {
      req.user = user;
      return next();
    }
  }

  if (roleHeader) {
    const mappedRole = roleHeader === 'hospital' ? 'facility_staff' : roleHeader;
    const user = await db.prepare('SELECT * FROM users WHERE role = ? OR role = ? LIMIT 1').get(roleHeader, mappedRole) as User | undefined;
    if (user) {
      req.user = roleHeader === 'hospital' ? { ...user, role: 'hospital' as any } : user;
      return next();
    }
  }

  // Fallback to default demo user (Meera Patil) ONLY if no specific authorization header was provided
  if (!authHeader && !userIdHeader) {
    const defaultUser = await db.prepare('SELECT * FROM users WHERE id = ?').get('usr-patient-1') as User;
    req.user = defaultUser;
    return next();
  }

  return res.status(401).json({ error: 'Invalid authentication credentials' });
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions for this role' });
    }
    next();
  };
}
