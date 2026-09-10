"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGrievances = exports.submitGrievance = void 0;
const db_js_1 = __importDefault(require("../config/db.js"));
const submitGrievance = (req, res) => {
    const { citizen_name, phone, category, facility_id, description } = req.body;
    const id = `grv-${Date.now()}`;
    const grievanceCode = `MH-GRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    db_js_1.default.prepare(`
    INSERT INTO grievances (id, grievance_code, citizen_name, phone, category, facility_id, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')
  `).run(id, grievanceCode, citizen_name || 'Anonymous Citizen', phone || '9876543210', category || 'General', facility_id || null, description || 'Grievance submitted');
    res.status(201).json({
        message: 'Grievance registered successfully with Maharashtra Public Health Redressal Cell',
        grievanceCode,
        id
    });
};
exports.submitGrievance = submitGrievance;
const getGrievances = (_req, res) => {
    const grievances = db_js_1.default.prepare(`
    SELECT g.*, f.name as facility_name
    FROM grievances g
    LEFT JOIN facilities f ON g.facility_id = f.id
    ORDER BY g.created_at DESC
  `).all();
    res.json(grievances);
};
exports.getGrievances = getGrievances;
