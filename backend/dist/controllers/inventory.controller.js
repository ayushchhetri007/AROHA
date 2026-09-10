"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEquipment = exports.addEquipment = exports.searchInventory = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
// "Find a facility that has this" - cross-facility search across medicines,
// equipment, specialists (doctors) and services, reusing the same tables
// the rest of the app already reads/writes. Connects Inventory search back
// to the existing Find Nearby Facility directory (returns facility rows).
const searchInventory = async (req, res) => {
    const type = req.query.type || '';
    const query = req.query.query || '';
    if (!query.trim()) {
        return res.json({ type, query, results: [] });
    }
    const term = `%${query}%`;
    let rows = [];
    if (type === 'equipment') {
        rows = await db_js_1.default.prepare(`
      SELECT f.id as facility_id, f.name as facility_name, f.type as facility_type,
             f.district, f.taluka, f.address, f.phone,
             e.equipment_name, e.category, e.quantity_available, e.is_available
      FROM facility_equipment e
      JOIN facilities f ON e.facility_id = f.id
      WHERE e.equipment_name ILIKE ? AND e.is_available = 1
      ORDER BY f.type DESC, f.name ASC
    `).all(term);
    }
    else if (type === 'specialist') {
        rows = await db_js_1.default.prepare(`
      SELECT f.id as facility_id, f.name as facility_name, f.type as facility_type,
             f.district, f.taluka, f.address, f.phone,
             d.full_name as doctor_name, d.specialty, d.is_available_today
      FROM doctors d
      JOIN facilities f ON d.facility_id = f.id
      WHERE d.specialty ILIKE ? AND d.is_available_today = 1
      ORDER BY f.type DESC, f.name ASC
    `).all(term);
    }
    else if (type === 'service') {
        rows = await db_js_1.default.prepare(`
      SELECT f.id as facility_id, f.name as facility_name, f.type as facility_type,
             f.district, f.taluka, f.address, f.phone,
             s.service_name, s.category, s.is_available
      FROM facility_services s
      JOIN facilities f ON s.facility_id = f.id
      WHERE s.service_name ILIKE ? AND s.is_available = 1
      ORDER BY f.type DESC, f.name ASC
    `).all(term);
    }
    else {
        // Default / 'medicine': reuse the same medicines table the existing
        // Medicine search already queries.
        rows = await db_js_1.default.prepare(`
      SELECT f.id as facility_id, f.name as facility_name, f.type as facility_type,
             f.district, f.taluka, f.address, f.phone,
             m.name as medicine_name, m.stock_quantity, m.status
      FROM medicines m
      JOIN facilities f ON m.facility_id = f.id
      WHERE (m.name ILIKE ? OR m.generic_name ILIKE ?) AND m.status != 'out_of_stock'
      ORDER BY f.type DESC, f.name ASC
    `).all(term, term);
    }
    res.json({ type: type || 'medicine', query, results: rows });
};
exports.searchInventory = searchInventory;
// Hospital-management write endpoints for facility equipment. Unlike the
// existing bed/admission endpoints, these ENFORCE that a hospital-role user
// may only modify their own assigned facility's equipment.
function assertOwnsFacility(req, facilityId, res) {
    const role = req.user?.role;
    if (role === 'admin')
        return true;
    if (role !== 'hospital' && role !== 'facility_staff') {
        res.status(403).json({ error: 'Access denied: only Hospital Management or Admin can modify facility inventory' });
        return false;
    }
    if (req.user?.facility_id !== facilityId) {
        res.status(403).json({ error: 'Access denied: you can only manage inventory for your own assigned facility' });
        return false;
    }
    return true;
}
const addEquipment = async (req, res) => {
    const { facility_id, equipment_name, category, quantity_available } = req.body;
    if (!facility_id || !equipment_name || !category) {
        return res.status(400).json({ error: 'facility_id, equipment_name and category are required' });
    }
    if (!assertOwnsFacility(req, facility_id, res))
        return;
    const id = `eqp-${Date.now()}`;
    await db_js_1.default.prepare(`
    INSERT INTO facility_equipment (id, facility_id, equipment_name, category, quantity_available, is_available)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(id, facility_id, equipment_name, category, quantity_available ?? null);
    const created = await db_js_1.default.prepare('SELECT * FROM facility_equipment WHERE id = ?').get(id);
    res.status(201).json({ message: 'Equipment added', equipment: created });
};
exports.addEquipment = addEquipment;
const updateEquipment = async (req, res) => {
    const { id } = req.params;
    const { quantity_available, is_available } = req.body;
    const existing = await db_js_1.default.prepare('SELECT * FROM facility_equipment WHERE id = ?').get(id);
    if (!existing)
        return res.status(404).json({ error: 'Equipment record not found' });
    if (!assertOwnsFacility(req, existing.facility_id, res))
        return;
    await db_js_1.default.prepare(`
    UPDATE facility_equipment
    SET quantity_available = COALESCE(?, quantity_available),
        is_available = COALESCE(?, is_available),
        last_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(quantity_available ?? null, is_available ?? null, id);
    const updated = await db_js_1.default.prepare('SELECT * FROM facility_equipment WHERE id = ?').get(id);
    res.json({ message: 'Equipment updated', equipment: updated });
};
exports.updateEquipment = updateEquipment;
