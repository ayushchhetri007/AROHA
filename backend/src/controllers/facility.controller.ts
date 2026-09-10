import { Request, Response } from 'express';
import db from '../config/db.js';

export const getAllFacilities = async (req: Request, res: Response) => {
  const { district, type, emergency, search } = req.query;

  let query = 'SELECT * FROM facilities WHERE 1=1';
  const params: any[] = [];

  if (district) {
    query += ' AND district = ?';
    params.push(district);
  }

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (emergency === '1' || emergency === 'true') {
    query += ' AND emergency_24x7 = 1';
  }

  if (search) {
    query += ' AND (name ILIKE ? OR taluka ILIKE ? OR district ILIKE ? OR address ILIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += ' ORDER BY type DESC, name ASC';
  const facilities = await db.prepare(query).all(...params);

  res.json(facilities);
};

export const getFacilityById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const facility = await db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
  if (!facility) return res.status(404).json({ error: 'Facility not found' });

  const services = await db.prepare('SELECT * FROM facility_services WHERE facility_id = ?').all(id);
  const doctors = await db.prepare('SELECT * FROM doctors WHERE facility_id = ?').all(id);
  const medicines = await db.prepare('SELECT * FROM medicines WHERE facility_id = ? LIMIT 20').all(id);
  const equipment = await db.prepare('SELECT * FROM facility_equipment WHERE facility_id = ?').all(id);
  const wards = await db.prepare('SELECT * FROM wards WHERE facility_id = ?').all(id) as any[];
  const staff = await db.prepare('SELECT * FROM hospital_staff WHERE facility_id = ?').all(id);

  const bedsByWard = db.prepare('SELECT * FROM beds WHERE ward_id = ?');
  const wardsWithBeds = await Promise.all(wards.map(async (w) => ({ ...w, beds: await bedsByWard.all(w.id) })));

  res.json({
    facility,
    services,
    doctors,
    medicines,
    equipment,
    wards: wardsWithBeds,
    staff
  });
};
