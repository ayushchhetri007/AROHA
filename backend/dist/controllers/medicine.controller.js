"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMedicineStock = exports.searchMedicines = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
const searchMedicines = (req, res) => {
    const { query, district, facility_id } = req.query;
    let sql = `
    SELECT m.*, f.name as facility_name, f.type as facility_type, f.district, f.taluka, f.phone as facility_phone
    FROM medicines m
    JOIN facilities f ON m.facility_id = f.id
    WHERE 1=1
  `;
    const params = [];
    if (query) {
        sql += ' AND (m.name LIKE ? OR m.generic_name LIKE ? OR m.category LIKE ?)';
        const term = `%${query}%`;
        params.push(term, term, term);
    }
    if (district) {
        sql += ' AND f.district = ?';
        params.push(district);
    }
    if (facility_id) {
        sql += ' AND m.facility_id = ?';
        params.push(facility_id);
    }
    sql += ' ORDER BY m.stock_quantity DESC, m.name ASC LIMIT 100';
    const medicines = db_js_1.default.prepare(sql).all(...params);
    res.json(medicines);
};
exports.searchMedicines = searchMedicines;
const updateMedicineStock = (req, res) => {
    const { id } = req.params;
    const { stock_quantity } = req.body;
    const current = db_js_1.default.prepare('SELECT * FROM medicines WHERE id = ?').get(id);
    if (!current)
        return res.status(404).json({ error: 'Medicine not found' });
    const qty = Number(stock_quantity);
    const status = qty === 0 ? 'out_of_stock' : qty <= current.reorder_level ? 'low_stock' : 'in_stock';
    db_js_1.default.prepare(`
    UPDATE medicines
    SET stock_quantity = ?, status = ?, last_restocked = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(qty, status, id);
    res.json({ message: 'Stock updated', id, stock_quantity: qty, status });
};
exports.updateMedicineStock = updateMedicineStock;
