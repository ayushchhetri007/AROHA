"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFacilityById = exports.getAllFacilities = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
const getAllFacilities = (req, res) => {
    const { district, type, emergency, search } = req.query;
    let query = 'SELECT * FROM facilities WHERE 1=1';
    const params = [];
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
        query += ' AND (name LIKE ? OR taluka LIKE ? OR district LIKE ? OR address LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term, term);
    }
    query += ' ORDER BY type DESC, name ASC';
    const facilities = db_js_1.default.prepare(query).all(...params);
    res.json(facilities);
};
exports.getAllFacilities = getAllFacilities;
const getFacilityById = (req, res) => {
    const { id } = req.params;
    const facility = db_js_1.default.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    if (!facility)
        return res.status(404).json({ error: 'Facility not found' });
    const services = db_js_1.default.prepare('SELECT * FROM facility_services WHERE facility_id = ?').all(id);
    const doctors = db_js_1.default.prepare('SELECT * FROM doctors WHERE facility_id = ?').all(id);
    const medicines = db_js_1.default.prepare('SELECT * FROM medicines WHERE facility_id = ? LIMIT 20').all(id);
    const equipment = db_js_1.default.prepare('SELECT * FROM facility_equipment WHERE facility_id = ?').all(id);
    const wards = db_js_1.default.prepare('SELECT * FROM wards WHERE facility_id = ?').all(id);
    const staff = db_js_1.default.prepare('SELECT * FROM hospital_staff WHERE facility_id = ?').all(id);
    const bedsByWard = db_js_1.default.prepare('SELECT * FROM beds WHERE ward_id = ?');
    const wardsWithBeds = wards.map((w) => ({ ...w, beds: bedsByWard.all(w.id) }));
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
exports.getFacilityById = getFacilityById;
