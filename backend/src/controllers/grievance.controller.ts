import { Request, Response } from 'express';
import db from '../config/db.js';

export const submitGrievance = async (req: Request, res: Response) => {
  const { citizen_name, phone, category, facility_id, description } = req.body;

  const id = `grv-${Date.now()}`;
  const grievanceCode = `MH-GRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  await db.prepare(`
    INSERT INTO grievances (id, grievance_code, citizen_name, phone, category, facility_id, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')
  `).run(id, grievanceCode, citizen_name || 'Anonymous Citizen', phone || '9876543210', category || 'General', facility_id || null, description || 'Grievance submitted');

  res.status(201).json({
    message: 'Grievance registered successfully with Maharashtra Public Health Redressal Cell',
    grievanceCode,
    id
  });
};

export const getGrievances = async (_req: Request, res: Response) => {
  const grievances = await db.prepare(`
    SELECT g.*, f.name as facility_name
    FROM grievances g
    LEFT JOIN facilities f ON g.facility_id = f.id
    ORDER BY g.created_at DESC
  `).all();
  res.json(grievances);
};
