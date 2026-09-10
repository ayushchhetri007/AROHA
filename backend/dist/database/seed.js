"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const db_js_1 = __importDefault(require("../config/db.js"));
const schema_js_1 = require("./schema.js");
function seedDatabase() {
    (0, schema_js_1.initializeDatabase)();
    // Clear existing tables for clean seed
    const tables = [
        'audit_logs', 'grievances', 'home_visits', 'chronic_care_records',
        'child_health_records', 'maternal_records', 'referral_events', 'referrals',
        'discharges', 'admissions', 'beds', 'wards', 'hospital_staff',
        'medicines', 'diagnostic_tests', 'prescriptions', 'consultations',
        'queue_tokens', 'appointments', 'doctors', 'facility_equipment', 'facility_services',
        'facilities', 'family_members', 'patients', 'users'
    ];
    db_js_1.default.transaction(() => {
        for (const table of tables) {
            db_js_1.default.prepare(`DELETE FROM ${table}`).run();
        }
        // 1. Users
        const insertUser = db_js_1.default.prepare(`
      INSERT INTO users (id, full_name, email, phone, role, facility_id, language)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        insertUser.run('usr-patient-1', 'Meera Patil', 'meera.patil@example.com', '9876543210', 'patient', null, 'mr');
        insertUser.run('usr-asha-1', 'Asha Tai Shinde', 'asha.shinde@example.com', '9876543211', 'asha_worker', 'fac-phc-shirwal', 'mr');
        insertUser.run('usr-doc-1', 'Dr. Anand Deshmukh', 'dr.deshmukh@example.com', '9876543212', 'doctor', 'fac-phc-shirwal', 'en');
        insertUser.run('usr-doc-2', 'Dr. Rajiv Joshi', 'dr.joshi@example.com', '9876543215', 'doctor', 'fac-dh-satara', 'en');
        insertUser.run('usr-staff-1', 'Ramesh Gaikwad', 'phc.staff@example.com', '9876543213', 'facility_staff', 'fac-phc-shirwal', 'mr');
        insertUser.run('usr-admin-1', 'Dr. Sunita Kulkarni', 'admin.mh@example.com', '9876543214', 'admin', null, 'en');
        // 2. Facilities (20+ realistic facilities in Maharashtra)
        const insertFacility = db_js_1.default.prepare(`
      INSERT INTO facilities (id, name, type, district, taluka, address, phone, latitude, longitude, emergency_24x7, total_beds, available_beds, queue_wait_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const facilities = [
            ['fac-phc-shirwal', 'Primary Health Centre Shirwal', 'PHC', 'Satara', 'Khandala', 'Near Main Bazaar, Shirwal, Maharashtra 412801', '02169-244120', 18.1345, 73.9856, 1, 12, 5, 20],
            ['fac-sc-shirwal-wadi', 'Sub-Centre Shirwal Wadi', 'Sub-Centre', 'Satara', 'Khandala', 'Post Shirwal, Khandala Taluka, Satara', '02169-244121', 18.1450, 73.9920, 0, 2, 1, 10],
            ['fac-sc-pargaon', 'Sub-Centre Pargaon', 'Sub-Centre', 'Satara', 'Khandala', 'Village Pargaon, Khandala Taluka', '02169-244122', 18.1120, 73.9710, 0, 2, 2, 12],
            ['fac-rh-khandala', 'Rural Hospital Khandala', 'Rural Hospital', 'Satara', 'Khandala', 'State Highway 138, Khandala, Satara', '02169-252240', 18.0621, 74.0245, 1, 30, 11, 25],
            ['fac-rh-wai', 'Rural Hospital Wai', 'Rural Hospital', 'Satara', 'Wai', 'Dhom Dam Road, Wai, Satara 412803', '02167-222340', 17.9482, 73.8924, 1, 50, 18, 30],
            ['fac-sdh-karad', 'Sub-District Hospital Karad', 'Sub-District Hospital', 'Satara', 'Karad', 'Malkapur Road, Karad, Satara 415110', '02164-222890', 17.2885, 74.1843, 1, 100, 32, 35],
            ['fac-dh-satara', 'District Hospital Satara', 'District Hospital', 'Satara', 'Satara', 'Civil Hospital Road, Sadar Bazar, Satara 415001', '02162-234500', 17.6805, 73.9930, 1, 350, 84, 40],
            ['fac-phc-narayangaon', 'PHC Narayangaon', 'PHC', 'Pune', 'Junnar', 'Old Pune-Nashik Road, Narayangaon, Pune', '02132-242100', 19.1234, 73.9765, 1, 10, 4, 18],
            ['fac-rh-junnar', 'Rural Hospital Junnar', 'Rural Hospital', 'Pune', 'Junnar', 'Shivaji Chowk, Junnar, Pune 410502', '02132-222410', 19.2086, 73.8761, 1, 40, 14, 25],
            ['fac-sdh-manchar', 'Sub-District Hospital Manchar', 'Sub-District Hospital', 'Pune', 'Ambegaon', 'Manchar-Bhimashankar Road, Pune', '02133-223120', 19.0062, 73.9392, 1, 80, 26, 30],
            ['fac-dh-aundh', 'District Hospital Aundh', 'District Hospital', 'Pune', 'Haveli', 'Aundh Camp, Pune 411027', '020-27271400', 18.5724, 73.8118, 1, 400, 95, 45],
            ['fac-phc-sangamner', 'PHC Ashwi Khurd', 'PHC', 'Ahmednagar', 'Sangamner', 'Ashwi, Sangamner Taluka, Ahmednagar', '02425-241200', 19.6200, 74.3100, 1, 12, 6, 22],
            ['fac-dh-nagar', 'Civil Hospital Ahmednagar', 'District Hospital', 'Ahmednagar', 'Ahmednagar', 'Station Road, Ahmednagar 414001', '0241-2323456', 19.0948, 74.7480, 1, 300, 70, 38],
            ['fac-phc-dhadgaon', 'PHC Dhadgaon (Akrani)', 'PHC', 'Nandurbar', 'Dhadgaon', 'Akrani Taluka, Nandurbar 425414', '02568-242210', 21.8340, 74.2210, 1, 10, 3, 20],
            ['fac-rh-molgi', 'Rural Hospital Molgi', 'Rural Hospital', 'Nandurbar', 'Akkalkuwa', 'Molgi Village, Nandurbar', '02567-251200', 21.6500, 74.0500, 1, 30, 12, 28],
            ['fac-dh-nandurbar', 'District Hospital Nandurbar', 'District Hospital', 'Nandurbar', 'Nandurbar', 'Sakri Road, Nandurbar 425412', '02564-222300', 21.3697, 74.2405, 1, 250, 60, 35],
            ['fac-phc-bhamragad', 'PHC Bhamragad', 'PHC', 'Gadchiroli', 'Bhamragad', 'Hemalkasa Road, Bhamragad 442710', '07134-220110', 19.2430, 80.3540, 1, 10, 5, 15],
            ['fac-sc-hemalkasa', 'Sub-Centre Hemalkasa', 'Sub-Centre', 'Gadchiroli', 'Bhamragad', 'Near Lok Biradari, Hemalkasa', '07134-220115', 19.2550, 80.3680, 0, 2, 1, 10],
            ['fac-rh-aheri', 'Rural Hospital Aheri', 'Rural Hospital', 'Gadchiroli', 'Aheri', 'Pranhita Road, Aheri, Gadchiroli 442705', '07133-272200', 19.4140, 79.9920, 1, 45, 16, 22],
            ['fac-dh-gadchiroli', 'District General Hospital Gadchiroli', 'District Hospital', 'Gadchiroli', 'Gadchiroli', 'Chamorshi Road, Gadchiroli 442605', '07132-222120', 20.1833, 79.9944, 1, 200, 48, 30]
        ];
        for (const f of facilities) {
            insertFacility.run(...f);
        }
        // 3. Facility Services
        const insertService = db_js_1.default.prepare(`
      INSERT INTO facility_services (id, facility_id, service_name, category, is_available)
      VALUES (?, ?, ?, ?, ?)
    `);
        const services = [
            ['General Medicine OPD', 'OPD', 1],
            ['Maternal & Child Health (MCH)', 'MCH', 1],
            ['Immunization & Vaccination', 'Preventive', 1],
            ['Minor OT & Wound Dressing', 'Surgical', 1],
            ['Pharmacy & Medicine Dispensation', 'Pharmacy', 1],
            ['Basic Diagnostic Lab (CBC, Malaria, Sugar)', 'Laboratory', 1],
            ['Teleconsultation with District Specialist', 'Telemedicine', 1],
            ['Emergency & 24/7 Ambulance Referral', 'Emergency', 1]
        ];
        let sIdx = 1;
        for (const f of facilities) {
            for (const s of services) {
                insertService.run(`srv-${sIdx++}`, f[0], s[0], s[1], s[2]);
            }
        }
        // 3b. Facility Equipment - tiered by facility type, since a Sub-Centre
        // genuinely does not stock the same equipment as a District Hospital.
        const insertEquipment = db_js_1.default.prepare(`
      INSERT INTO facility_equipment (id, facility_id, equipment_name, category, quantity_available, is_available)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        // Cumulative equipment catalog: each tier includes everything from the
        // tiers before it, reflecting real capability escalation.
        const equipmentByTier = {
            'Sub-Centre': [
                ['Digital BP Apparatus', 'Diagnostic', 2],
                ['Digital Weighing Scale', 'Diagnostic', 2],
                ['Infrared Thermometer', 'Diagnostic', 3],
                ['First Aid & Emergency Kit', 'Emergency', 1]
            ],
            'PHC': [
                ['ECG Machine', 'Diagnostic', 1],
                ['Oxygen Concentrator', 'Emergency', 2],
                ['Nebulizer', 'Respiratory', 2],
                ['Autoclave Sterilizer', 'Sterilization', 1]
            ],
            'Rural Hospital': [
                ['X-Ray Machine', 'Diagnostic', 1],
                ['Ultrasound Machine', 'Diagnostic', 1],
                ['Minor OT Equipment Set', 'Surgical', 1],
                ['Suction Machine', 'Emergency', 2]
            ],
            'Sub-District Hospital': [
                ['Ventilator', 'Critical Care', 2],
                ['Defibrillator', 'Emergency', 2],
                ['Anesthesia Workstation', 'Surgical', 1],
                ['Blood Bank Refrigerator', 'Laboratory', 1]
            ],
            'District Hospital': [
                ['CT Scan Machine', 'Diagnostic', 1],
                ['Dialysis Machine', 'Critical Care', 2],
                ['ICU Multi-Para Monitor', 'Critical Care', 6],
                ['Advanced Ventilator Bank', 'Critical Care', 4]
            ]
        };
        const tierOrder = ['Sub-Centre', 'PHC', 'Rural Hospital', 'Sub-District Hospital', 'District Hospital'];
        function equipmentForFacilityType(type) {
            const upToTier = tierOrder.indexOf(type);
            if (upToTier === -1)
                return equipmentByTier['PHC'];
            return tierOrder.slice(0, upToTier + 1).flatMap((tier) => equipmentByTier[tier]);
        }
        let eIdx = 1;
        for (const f of facilities) {
            const facilityId = f[0];
            const facilityType = f[2];
            const catalog = equipmentForFacilityType(facilityType);
            for (const [name, category, qty] of catalog) {
                insertEquipment.run(`eqp-${eIdx++}`, facilityId, name, category, qty, 1);
            }
        }
        // 4. Doctors
        const insertDoctor = db_js_1.default.prepare(`
      INSERT INTO doctors (id, user_id, facility_id, full_name, specialty, qualification, experience_years, room_number, is_available_today, teleconsult_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertDoctor.run('doc-1', 'usr-doc-1', 'fac-phc-shirwal', 'Dr. Anand Deshmukh', 'General Medicine & Public Health', 'MBBS, DNB', 8, 'OPD Room 2', 1, 1);
        insertDoctor.run('doc-2', 'usr-doc-2', 'fac-dh-satara', 'Dr. Rajiv Joshi', 'Obstetrics & Gynecology (OB-GYN)', 'MBBS, MD (OB-GYN)', 15, 'Cabin 104, 1st Floor', 1, 1);
        insertDoctor.run('doc-3', 'usr-doc-1', 'fac-rh-khandala', 'Dr. Priya Salunkhe', 'Pediatrics & Neonatology', 'MBBS, DCH', 6, 'OPD Room 1', 1, 1);
        insertDoctor.run('doc-4', 'usr-doc-2', 'fac-dh-satara', 'Dr. Vinod Mane', 'Cardiology & Internal Medicine', 'MBBS, MD, DM', 12, 'Cardio OPD 12', 1, 1);
        insertDoctor.run('doc-5', 'usr-doc-1', 'fac-phc-dhadgaon', 'Dr. Ramesh Vasave', 'General Practice', 'MBBS', 5, 'Room 1', 1, 1);
        // Sub-District Hospital Karad
        insertDoctor.run('doc-sdh-1', 'usr-doc-1', 'fac-sdh-karad', 'Dr. Anand Deshmukh', 'General Medicine', 'MBBS, MD', 10, 'OPD', 1, 1);
        insertDoctor.run('doc-sdh-2', 'usr-doc-2', 'fac-sdh-karad', 'Dr. Priya Patil', 'Maternal & Child Health', 'MBBS, DGO', 8, 'MCH', 1, 1);
        insertDoctor.run('doc-sdh-3', 'usr-doc-1', 'fac-sdh-karad', 'Dr. Rahul Joshi', 'General Medicine', 'MBBS', 6, 'OPD', 1, 1);
        // Rural Hospital Wai
        insertDoctor.run('doc-wai-1', 'usr-doc-1', 'fac-rh-wai', 'Dr. Smita Kadam', 'General Medicine', 'MBBS', 7, 'OPD Room 1', 1, 1);
        insertDoctor.run('doc-wai-2', 'usr-doc-2', 'fac-rh-wai', 'Dr. Abhay Shinde', 'Orthopedics', 'MBBS, MS (Ortho)', 11, 'OPD Room 3', 1, 1);
        // District Hospital Satara additional
        insertDoctor.run('doc-dh-3', 'usr-doc-1', 'fac-dh-satara', 'Dr. Swati Kulkarni', 'Pediatrics', 'MBBS, MD (Pediatrics)', 9, 'Pediatric OPD 5', 1, 1);
        // 5. Patients
        const insertPatient = db_js_1.default.prepare(`
      INSERT INTO patients (id, user_id, abha_id, full_name, age, gender, phone, village, taluka, district, blood_group, emergency_contact, consent_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertPatient.run('pat-meera', 'usr-patient-1', '91-8834-2910-1029', 'Meera Patil', 28, 'F', '9876543210', 'Shirwal', 'Khandala', 'Satara', 'B+', 'Suresh Patil (Husband) - 9876543299', 1);
        insertPatient.run('P-10452', 'usr-patient-1', '91-4921-8392-1045', 'Rahul Kumar', 34, 'M', '9823455789', 'Shirwal', 'Khandala', 'Satara', 'O+', 'Anjali Kumar (Wife) - 9823455788', 1);
        insertPatient.run('pat-prakash', null, '91-4421-9982-3341', 'Prakash Jadhav', 54, 'M', '9822334455', 'Khed', 'Khandala', 'Satara', 'O+', 'Sunita Jadhav - 9822334456', 1);
        insertPatient.run('pat-aarav', null, '91-1122-3344-5566', 'Baby Aarav Shinde', 2, 'M', '9876543211', 'Shirwal', 'Khandala', 'Satara', 'B+', 'Asha Shinde - 9876543211', 1);
        insertPatient.run('pat-sunita', null, '91-7788-9900-1122', 'Sunita Pawar', 32, 'F', '9890123456', 'Pargaon', 'Khandala', 'Satara', 'A+', 'Vikram Pawar - 9890123457', 1);
        insertPatient.run('pat-maruti', null, '91-3344-5566-7788', 'Maruti Shinde', 68, 'M', '9850987654', 'Shirwal', 'Khandala', 'Satara', 'O-', 'Sachin Shinde - 9850987655', 1);
        // 6. Family Members for Meera Patil
        const insertFamily = db_js_1.default.prepare(`
      INSERT INTO family_members (id, patient_id, full_name, relationship, age, gender, blood_group)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        insertFamily.run('fam-1', 'pat-meera', 'Suresh Patil', 'Husband', 32, 'M', 'O+');
        insertFamily.run('fam-2', 'pat-meera', 'Ananya Patil', 'Daughter', 4, 'F', 'B+');
        insertFamily.run('fam-3', 'pat-meera', 'Kausalya Patil', 'Mother-in-law', 58, 'F', 'A+');
        // 7. Maternal Record for Meera Patil
        const insertMaternal = db_js_1.default.prepare(`
      INSERT INTO maternal_records (id, patient_id, lmp_date, edd_date, anc_visit_count, gravidity, parity, high_risk_flag, risk_factors, assigned_asha_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertMaternal.run('mat-meera', 'pat-meera', '2026-03-10', '2026-12-15', 3, 2, 1, 1, 'Mild anemia (Hb 9.2 g/dL), previous caesarean delivery (scar tenderness check required)', 'usr-asha-1', 'Scheduled for third trimester ultrasound and anomaly confirmation at District Hospital Satara.');
        insertMaternal.run('mat-sunita', 'pat-sunita', '2026-02-01', '2026-11-08', 4, 3, 2, 1, 'Gestational Hypertension (BP 145/95 mmHg), Albumin trace in urine', 'usr-asha-1', 'High risk alert sent. Weekly BP tracking by ANM.');
        // 8. Child Health Record
        const insertChild = db_js_1.default.prepare(`
      INSERT INTO child_health_records (id, patient_id, child_name, dob, gender, birth_weight, current_weight, height, immunization_status_json, nutritional_grade, assigned_asha_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertChild.run('ch-aarav', 'pat-aarav', 'Aarav Shinde', '2025-03-12', 'M', 2.8, 11.4, 82.0, JSON.stringify([
            { vaccine: 'BCG + Hep B + OPV-0', date: '2025-03-12', status: 'completed' },
            { vaccine: 'Pentavalent 1 + Rota 1 + fIPV 1', date: '2025-04-25', status: 'completed' },
            { vaccine: 'Pentavalent 2 + Rota 2', date: '2025-05-28', status: 'completed' },
            { vaccine: 'Pentavalent 3 + Rota 3 + fIPV 2', date: '2025-07-02', status: 'completed' },
            { vaccine: 'MR 1 + PCV Booster + Vit A', date: '2025-12-18', status: 'completed' },
            { vaccine: 'DPT Booster 1 + MR 2', date: '2026-09-20', status: 'due_soon' }
        ]), 'normal', 'usr-asha-1');
        // 9. Chronic Care Record
        const insertChronic = db_js_1.default.prepare(`
      INSERT INTO chronic_care_records (id, patient_id, condition_type, diagnosed_year, current_bp, blood_sugar_fasting, last_follow_up, next_follow_up, medication_adherence, risk_level, assigned_asha_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertChronic.run('chr-prakash', 'pat-prakash', 'Type 2 Diabetes & Hypertension', 2021, '138/88', 142, '2026-08-15', '2026-09-15', 'good', 'moderate', 'usr-asha-1');
        insertChronic.run('chr-maruti', 'pat-maruti', 'COPD (Chronic Bronchitis)', 2018, '124/80', 98, '2026-08-10', '2026-09-10', 'moderate', 'high', 'usr-asha-1');
        // 10. Medicines Inventory across facilities
        const insertMedicine = db_js_1.default.prepare(`
      INSERT INTO medicines (id, facility_id, name, generic_name, category, dosage_form, stock_quantity, reorder_level, unit, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const standardMedicines = [
            ['Paracetamol 500mg', 'Paracetamol IP', 'Analgesic / Antipyretic', 'Tablet', 4500, 1000, 'Tablets', 'in_stock'],
            ['Amoxicillin 500mg', 'Amoxicillin Trihydrate', 'Antibiotic', 'Capsule', 1800, 500, 'Capsules', 'in_stock'],
            ['Oral Rehydration Salts (ORS)', 'WHO Formula ORS', 'Electrolyte', 'Sachet', 950, 300, 'Sachets', 'in_stock'],
            ['Iron & Folic Acid (IFA)', 'Ferrous Sulphate 100mg + FA 0.5mg', 'Maternal Supplement', 'Tablet', 6200, 1500, 'Tablets', 'in_stock'],
            ['Calcium & Vitamin D3', 'Calcium Carbonate 500mg', 'Supplement', 'Tablet', 3100, 800, 'Tablets', 'in_stock'],
            ['Metformin 500mg', 'Metformin Hydrochloride', 'Antidiabetic', 'Tablet', 2400, 600, 'Tablets', 'in_stock'],
            ['Amlodipine 5mg', 'Amlodipine Besylate', 'Antihypertensive', 'Tablet', 380, 500, 'Tablets', 'low_stock'],
            ['Ciprofloxacin Eye/Ear Drops', 'Ciprofloxacin 0.3%', 'Antibiotic', 'Drops', 85, 50, 'Bottles', 'in_stock'],
            ['Albendazole 400mg', 'Albendazole', 'Anthelmintic', 'Tablet', 1200, 400, 'Tablets', 'in_stock'],
            ['Zinc Sulfate 20mg', 'Zinc Sulfate Monohydrate', 'Pediatric Mineral', 'Tablet', 1400, 300, 'Tablets', 'in_stock'],
            ['Cetirizine 10mg', 'Cetirizine Dihydrochloride', 'Antihistamine', 'Tablet', 2100, 500, 'Tablets', 'in_stock'],
            ['Azithromycin 500mg', 'Azithromycin IP', 'Antibiotic', 'Tablet', 0, 200, 'Tablets', 'out_of_stock']
        ];
        let medIdx = 1;
        for (const f of facilities) {
            for (const m of standardMedicines) {
                // Vary stock slightly per facility
                const mult = String(f[1]).includes('District') ? 4 : String(f[1]).includes('Rural') ? 2 : 1;
                const qty = m[7] === 'out_of_stock' ? 0 : Math.floor(Number(m[4]) * mult * (0.8 + Math.random() * 0.4));
                const status = qty === 0 ? 'out_of_stock' : qty <= Number(m[5]) * mult ? 'low_stock' : 'in_stock';
                insertMedicine.run(`med-${medIdx++}`, f[0], m[0], m[1], m[2], m[3], qty, Number(m[5]) * mult, m[6], status);
            }
        }
        // 11. Appointments & Queue Tokens
        const insertAppt = db_js_1.default.prepare(`
      INSERT INTO appointments (id, appointment_number, patient_id, facility_id, doctor_id, service_name, appointment_date, time_slot, status, priority, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const insertToken = db_js_1.default.prepare(`
      INSERT INTO queue_tokens (id, token_number, appointment_id, facility_id, doctor_id, patient_id, status, estimated_wait_minutes, counter_room, called_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        // Meera Patil's active appointment today
        insertAppt.run('apt-meera-101', 'MH-APT-2026-0014', 'pat-meera', 'fac-phc-shirwal', 'doc-1', 'Maternal & Child Health (MCH)', '2026-09-05', '10:30 AM', 'in_queue', 'maternal', 'ANC 2nd Trimester Checkup & Persistent Fatigue');
        insertToken.run('tok-meera-14', 14, 'apt-meera-101', 'fac-phc-shirwal', 'doc-1', 'pat-meera', 'waiting', 12, 'OPD Room 2 (Dr. Deshmukh)', null);
        // Other patients in queue today to show realistic OPD
        insertAppt.run('apt-prakash-102', 'MH-APT-2026-0012', 'pat-prakash', 'fac-phc-shirwal', 'doc-1', 'General Medicine OPD', '2026-09-05', '10:00 AM', 'in_consultation', 'normal', 'Blood sugar monthly review');
        insertToken.run('tok-prakash-12', 12, 'apt-prakash-102', 'fac-phc-shirwal', 'doc-1', 'pat-prakash', 'in_progress', 0, 'OPD Room 2 (Dr. Deshmukh)', '2026-09-05 10:20:00');
        insertAppt.run('apt-sunita-103', 'MH-APT-2026-0013', 'pat-sunita', 'fac-phc-shirwal', 'doc-1', 'MCH Priority', '2026-09-05', '10:15 AM', 'completed', 'urgent', 'High BP monitoring');
        insertToken.run('tok-sunita-13', 13, 'apt-sunita-103', 'fac-phc-shirwal', 'doc-1', 'pat-sunita', 'completed', 0, 'OPD Room 2', '2026-09-05 10:05:00');
        // 12. Consultations & Prescriptions & Diagnostics (Longitudinal Record for Meera)
        const insertConsultation = db_js_1.default.prepare(`
      INSERT INTO consultations (id, appointment_id, patient_id, doctor_id, facility_id, symptoms, diagnosis, vitals_json, clinical_notes, follow_up_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const insertRx = db_js_1.default.prepare(`
      INSERT INTO prescriptions (id, consultation_id, patient_id, doctor_id, medicines_json, instructions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        const insertDiag = db_js_1.default.prepare(`
      INSERT INTO diagnostic_tests (id, consultation_id, patient_id, facility_id, test_name, category, priority, status, result_summary, report_url, turnaround_time, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        // Past consultation (2 months ago)
        insertConsultation.run('cns-meera-prev', 'apt-sunita-103', // using as reference
        'pat-meera', 'doc-1', 'fac-phc-shirwal', 'Mild weakness, morning sickness, dizziness during walking', 'ANC 16 Weeks Gestation, Mild Microcytic Hypochromic Anemia', JSON.stringify({ bp: '112/74 mmHg', pulse: '76 bpm', spo2: '98%', temp: '98.4 F', weight: '54 kg', hb: '9.4 g/dL' }), 'Patient advised increased iron-rich green leafy diet. Prescribed daily IFA supplements. Vitals stable.', '2026-09-05');
        insertRx.run('rx-meera-prev', 'cns-meera-prev', 'pat-meera', 'doc-1', JSON.stringify([
            { name: 'Iron & Folic Acid (IFA)', dosage: '1 Tab', frequency: 'Once daily after dinner', days: '60 days', instructions: 'Take with lemon water, do not take with tea/milk' },
            { name: 'Calcium & Vitamin D3', dosage: '500mg', frequency: 'Once daily after lunch', days: '60 days', instructions: 'Take 2 hours apart from IFA' }
        ]), 'Regular maternal nutrition diet and hydrate with 3 litres water daily.');
        insertDiag.run('diag-meera-1', 'cns-meera-prev', 'pat-meera', 'fac-phc-shirwal', 'Complete Blood Count (CBC) with Peripheral Smear', 'Hematology', 'routine', 'completed', 'Hb: 9.4 g/dL (Mild Anemia), RBC: 3.8 mil, Platelets: 240k, TLC: 7,800. Microcytic RBCs observed.', '/reports/cbc_meera_20260710.pdf', '2 hours', '2026-07-10 12:30:00');
        // Active diagnostic for Meera
        insertDiag.run('diag-meera-active', null, 'pat-meera', 'fac-phc-shirwal', 'Obstetric Ultrasound Scan (Level II / TIFFA)', 'Radiology / Sonography', 'priority', 'ordered', null, null, 'Same Day at District Hospital', null);
        // 13. Inter-Facility Referral Workflow
        const insertReferral = db_js_1.default.prepare(`
      INSERT INTO referrals (id, referral_code, patient_id, referring_facility_id, referring_doctor_id, receiving_facility_id, specialty_required, priority, clinical_reason, summary, status, target_date, outcome_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const insertRefEvent = db_js_1.default.prepare(`
      INSERT INTO referral_events (id, referral_id, event_type, description, actor_role)
      VALUES (?, ?, ?, ?, ?)
    `);
        insertReferral.run('ref-meera-satara', 'MH-REF-2026-7841', 'pat-meera', 'fac-phc-shirwal', 'doc-1', 'fac-dh-satara', 'Obstetrics & Fetal Medicine', 'priority', 'High-Risk Pregnancy Evaluation: Previous LSCS scar evaluation + 2nd trimester target anomaly scan + Persistent Anemia management', '28-year-old Gravida 2 Para 1 at 24 weeks gestation. Previous lower segment caesarean section. Current Hb 9.2 g/dL. Requires specialist obstetric ultrasound and specialist consultation at District Hospital Satara.', 'accepted', '2026-09-08', 'Referral accepted by Dr. Rajiv Joshi (OB-GYN, DH Satara). Dedicated appointment slot reserved.');
        insertRefEvent.run('re-1', 'ref-meera-satara', 'Referral Created', 'Referral generated by Dr. Anand Deshmukh at PHC Shirwal', 'doctor');
        insertRefEvent.run('re-2', 'ref-meera-satara', 'Notification Dispatched', 'Automated SMS/WhatsApp notification delivered to patient & ASHA worker', 'system');
        insertRefEvent.run('re-3', 'ref-meera-satara', 'Referral Accepted', 'District Hospital Satara OB-GYN Department accepted the referral. Slot booked for Sept 8th, 11:00 AM.', 'specialist');
        // 14. Home Visits by ASHA Worker (Asha Tai Shinde)
        const insertVisit = db_js_1.default.prepare(`
      INSERT INTO home_visits (id, asha_id, patient_id, visit_date, vitals_json, observations, pregnancy_notes, child_growth_notes, symptoms, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertVisit.run('vis-1', 'usr-asha-1', 'pat-meera', '2026-09-02', JSON.stringify({ bp: '114/76', pulse: 78, weight: '55 kg' }), 'Home visit conducted at Shirwal-Wadi. Meera is taking IFA tablets daily. Diet adequate. Advised her to attend PHC OPD on Sept 5th for doctor checkup and referral paperwork.', 'Fetal movements active, no bleeding or fluid leakage.', null, 'Occasional fatigue after household chores', 'synced');
        insertVisit.run('vis-2', 'usr-asha-1', 'pat-prakash', '2026-08-28', JSON.stringify({ bp: '136/86', blood_sugar: '138 mg/dL' }), 'Monitored sugar and blood pressure. Patient taking Metformin and Amlodipine regularly. Advised to reduce salt intake.', null, null, 'No chest pain or breathlessness', 'synced');
        // 15. Grievances
        const insertGrievance = db_js_1.default.prepare(`
      INSERT INTO grievances (id, grievance_code, citizen_name, phone, category, facility_id, description, status, resolution_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertGrievance.run('grv-1', 'MH-GRV-2026-109', 'Ramesh Jadhav', '9822334455', 'Medicine Availability', 'fac-phc-shirwal', 'Amlodipine 5mg was low in stock last Thursday during OPD visit.', 'resolved', 'Fresh consignment of 2,000 Amlodipine 5mg tablets received from Satara District Medical Warehouse on Monday.');
        // 16. Audit Log
        const insertAudit = db_js_1.default.prepare(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        insertAudit.run('aud-1', 'usr-doc-1', 'VIEW_EHR', 'Patient', 'pat-meera', 'Accessed longitudinal health record during OPD', '127.0.0.1');
        insertAudit.run('aud-2', 'usr-doc-1', 'CREATE_REFERRAL', 'Referral', 'ref-meera-satara', 'Dispatched inter-facility referral to DH Satara', '127.0.0.1');
        // 17. Wards (District Hospital Satara, RH Khandala, PHC Shirwal)
        const insertWard = db_js_1.default.prepare(`
      INSERT INTO wards (id, facility_id, name, department, gender_allowed, capacity, floor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        // Satara District Hospital Wards
        insertWard.run('w-dh-a', 'fac-dh-satara', 'Ward A - General Medicine', 'General Medicine', 'Male', 20, '1st Floor East');
        insertWard.run('w-dh-b', 'fac-dh-satara', 'Ward B - Maternity & Neonatal', 'Obstetrics & Gynecology', 'Female', 24, '2nd Floor North');
        insertWard.run('w-dh-c', 'fac-dh-satara', 'Ward C - Intensive Care (ICU)', 'Critical Care', 'Any', 12, 'Ground Floor Emergency');
        insertWard.run('w-dh-d', 'fac-dh-satara', 'Ward D - Post-Operative Surgery', 'General Surgery', 'Any', 16, '3rd Floor');
        // Rural Hospital Khandala Wards
        insertWard.run('w-rh-a', 'fac-rh-khandala', 'Ward A - General & Pediatric', 'General Practice', 'Any', 15, 'Ground Floor');
        insertWard.run('w-rh-b', 'fac-rh-khandala', 'Ward B - Maternity', 'Obstetrics', 'Female', 10, '1st Floor');
        // PHC Shirwal Day Care Ward
        insertWard.run('w-phc-a', 'fac-phc-shirwal', 'Ward A - Day Care & Observation', 'Emergency & Triage', 'Any', 6, 'Ground Floor');
        // 18. Beds (Demonstrating all 5 required statuses: Available, Occupied, Reserved, Cleaning, Maintenance)
        const insertBed = db_js_1.default.prepare(`
      INSERT INTO beds (id, ward_id, facility_id, room_number, bed_number, status, current_patient_id, last_cleaned_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        // District Hospital Satara - Ward B (Maternity)
        insertBed.run('bed-b-01', 'w-dh-b', 'fac-dh-satara', 'Room 201', 'B-01', 'Occupied', 'pat-meera', '2026-09-08 08:00:00', 'Maternal High-Risk (ANC 24 Wks, Anemia, LSCS scar)');
        insertBed.run('bed-b-02', 'w-dh-b', 'fac-dh-satara', 'Room 201', 'B-02', 'Available', null, '2026-09-08 09:30:00', 'Clean linen ready, oxygen outlet active');
        insertBed.run('bed-b-03', 'w-dh-b', 'fac-dh-satara', 'Room 202', 'B-03', 'Cleaning', null, '2026-09-08 10:15:00', 'Disinfected following morning discharge');
        insertBed.run('bed-b-04', 'w-dh-b', 'fac-dh-satara', 'Room 202', 'B-04', 'Reserved', null, '2026-09-07 18:00:00', 'Reserved for incoming emergency referral from PHC Shirwal');
        insertBed.run('bed-b-05', 'w-dh-b', 'fac-dh-satara', 'Room 203', 'B-05', 'Available', null, '2026-09-08 07:00:00', 'Ready for admission');
        insertBed.run('bed-b-06', 'w-dh-b', 'fac-dh-satara', 'Room 203', 'B-06', 'Maintenance', null, '2026-09-06 14:00:00', 'Bed motorized elevation repair in progress');
        // District Hospital Satara - Ward A (General Medicine)
        insertBed.run('bed-a-01', 'w-dh-a', 'fac-dh-satara', 'Room 101', 'A-01', 'Occupied', 'pat-prakash', '2026-09-07 10:00:00', 'Type 2 Diabetes stabilization, IV line connected');
        insertBed.run('bed-a-02', 'w-dh-a', 'fac-dh-satara', 'Room 101', 'A-02', 'Available', null, '2026-09-08 06:00:00', 'Sanitized and inspected');
        insertBed.run('bed-a-03', 'w-dh-a', 'fac-dh-satara', 'Room 102', 'A-03', 'Cleaning', null, '2026-09-08 11:00:00', 'Under ultraviolet air purification');
        insertBed.run('bed-a-04', 'w-dh-a', 'fac-dh-satara', 'Room 102', 'A-04', 'Reserved', null, '2026-09-08 08:30:00', 'Pre-admission booking for cardiac evaluation');
        // District Hospital Satara - Ward C (ICU)
        insertBed.run('bed-c-01', 'w-dh-c', 'fac-dh-satara', 'ICU Bay 1', 'ICU-01', 'Available', null, '2026-09-08 05:00:00', 'Ventilator & Multipara Monitor tested');
        insertBed.run('bed-c-02', 'w-dh-c', 'fac-dh-satara', 'ICU Bay 1', 'ICU-02', 'Occupied', 'pat-maruti', '2026-09-07 22:00:00', 'Acute COPD exacerbation with nebulizer support');
        insertBed.run('bed-c-03', 'w-dh-c', 'fac-dh-satara', 'ICU Bay 2', 'ICU-03', 'Available', null, '2026-09-08 07:45:00', 'Defibrillator and suction ready');
        // PHC Shirwal Day Care Beds
        insertBed.run('bed-phc-01', 'w-phc-a', 'fac-phc-shirwal', 'Observation Bay', 'PHC-01', 'Available', null, '2026-09-08 08:00:00', 'Day care IV drip ready');
        insertBed.run('bed-phc-02', 'w-phc-a', 'fac-phc-shirwal', 'Observation Bay', 'PHC-02', 'Occupied', 'pat-sunita', '2026-09-08 09:15:00', 'Post-consultation 2hr BP monitoring');
        insertBed.run('bed-phc-03', 'w-phc-a', 'fac-phc-shirwal', 'Observation Bay', 'PHC-03', 'Available', null, '2026-09-08 07:00:00', 'Clean & ready');
        // 19. Hospital Staff Roster
        const insertStaff = db_js_1.default.prepare(`
      INSERT INTO hospital_staff (id, user_id, facility_id, full_name, role, employee_id, department, shift, is_available, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertStaff.run('stf-1', 'usr-doc-2', 'fac-dh-satara', 'Dr. Rajiv Joshi', 'Doctor (Senior Specialist)', 'MH-MED-2011-89', 'Obstetrics & Gynecology', 'Morning', 1, '02162-234501', 'dr.joshi@example.com');
        insertStaff.run('stf-2', null, 'fac-dh-satara', 'Dr. Vinod Mane', 'Doctor (Cardiologist)', 'MH-MED-2015-42', 'Cardiology & Emergency', 'Morning', 1, '02162-234502', 'dr.mane@example.com');
        insertStaff.run('stf-3', null, 'fac-dh-satara', 'Sister Anjali Kamble', 'Staff Nurse (In-Charge)', 'MH-NUR-2018-09', 'Ward B (Maternity)', 'Morning', 1, '9822114433', 'anjali.kamble@dh-satara.gov.in');
        insertStaff.run('stf-4', null, 'fac-dh-satara', 'Sister Priya Sawant', 'Staff Nurse', 'MH-NUR-2020-55', 'Ward A (General)', 'Evening', 1, '9822114434', 'priya.sawant@dh-satara.gov.in');
        insertStaff.run('stf-5', null, 'fac-dh-satara', 'Sunil Deshmukh', 'Chief Diagnostic Technologist', 'MH-LAB-2019-12', 'Central Pathology & Biochemistry', 'Morning', 1, '9822114435', 'lab.satara@dh-satara.gov.in');
        insertStaff.run('stf-6', 'usr-doc-1', 'fac-phc-shirwal', 'Dr. Anand Deshmukh', 'Doctor (Medical Officer)', 'MH-MO-2016-77', 'Primary Healthcare OPD', 'Morning', 1, '02169-244120', 'dr.deshmukh@example.com');
        insertStaff.run('stf-7', 'usr-asha-1', 'fac-phc-shirwal', 'Asha Tai Shinde', 'ANM / Frontline Coordinator', 'MH-ANM-2017-31', 'Community Health & Maternal Care', 'Morning', 1, '9876543211', 'asha.shinde@example.com');
        // 20. Admissions (Clinical Lifecycle Flow)
        const insertAdmission = db_js_1.default.prepare(`
      INSERT INTO admissions (id, admission_number, patient_id, facility_id, ward_id, bed_id, doctor_id, referral_id, department, priority, admission_date, discharge_date, status, provisional_diagnosis, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        // Meera Patil's Admission at DH Satara
        insertAdmission.run('adm-meera-101', 'MH-ADM-2026-0042', 'pat-meera', 'fac-dh-satara', 'w-dh-b', 'bed-b-01', 'doc-2', 'ref-meera-satara', 'Obstetrics & Gynecology', 'Maternal', '2026-09-08 09:00:00', null, 'Under Treatment', '24 Weeks Gestation, Moderate Anemia, Prior LSCS with Scar Thickness Monitoring', 'Inpatient observation required for Level-II Fetal Doppler scan, intravenous iron sucrose infusion, and fetal heart rate surveillance.');
        // Prakash Jadhav's Admission at DH Satara
        insertAdmission.run('adm-prakash-102', 'MH-ADM-2026-0038', 'pat-prakash', 'fac-dh-satara', 'w-dh-a', 'bed-a-01', 'doc-4', null, 'General Medicine', 'Urgent', '2026-09-07 14:00:00', null, 'Under Treatment', 'Uncontrolled Type 2 Diabetes with Hypertensive Urgency (BP 168/104)', 'Intravenous insulin infusion protocol and continuous BP titration.');
        // Sunita Pawar's Previous Discharge at DH Satara
        insertAdmission.run('adm-sunita-100', 'MH-ADM-2026-0019', 'pat-sunita', 'fac-dh-satara', 'w-dh-b', null, 'doc-2', null, 'Obstetrics & Gynecology', 'Normal', '2026-08-25 10:00:00', '2026-08-30 15:30:00', 'Discharged', 'Gestational Hypertension with Trace Proteinuria', 'Pre-eclampsia screening and BP stabilization complete.');
        // Maruti Shinde's Admission at DH Satara
        insertAdmission.run('adm-maruti-103', 'MH-ADM-2026-0045', 'pat-maruti', 'fac-dh-satara', 'w-dh-c', 'bed-c-02', 'doc-4', null, 'Critical Care / Pulmonology', 'Emergency', '2026-09-07 22:30:00', null, 'Admitted', 'Acute Exacerbation of COPD, Hypoxemia (SpO2 86%)', 'Requires ICU high-flow oxygen, systemic corticosteroids, and bronchodilators.');
        // 21. Discharges & Automated ANM Follow-Up
        const insertDischarge = db_js_1.default.prepare(`
      INSERT INTO discharges (id, admission_id, patient_id, discharge_date, discharge_condition, treatment_summary, discharge_medicines_json, follow_up_date, follow_up_notes, responsible_asha_id, follow_up_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        insertDischarge.run('dsc-sunita-1', 'adm-sunita-100', 'pat-sunita', '2026-08-30 15:30:00', 'Stable - Blood Pressure under therapeutic control (122/78 mmHg), no headache or visual blurring', 'Patient was stabilized with Tab Labetalol 100mg BD. Fetal biophysical profile scored 8/8. Patient educated on danger signs of pre-eclampsia and low-salt nutrition.', JSON.stringify([
            { name: 'Labetalol 100mg', dosage: '1 Tablet', frequency: 'Twice daily after breakfast & dinner', days: '30 days', instructions: 'Never miss dose; monitor for dizziness' },
            { name: 'Calcium Carbonate 500mg', dosage: '1 Tablet', frequency: 'Once daily after lunch', days: '30 days', instructions: 'Hydrate well' },
            { name: 'Iron & Folic Acid', dosage: '1 Tablet', frequency: 'Once daily after dinner', days: '30 days', instructions: 'With lemon water' }
        ]), '2026-09-12', 'ANM Asha Tai Shinde assigned: Check BP twice weekly, verify protein test strips, and report any systolic BP above 140 mmHg immediately.', 'usr-asha-1', 0);
        console.log('✅ Seed completed successfully with 20+ facilities, users, patients, medicines, referrals, beds, admissions, discharges, and hospital staff.');
    })();
}
// Run directly if invoked via CLI
if (process.argv[1]?.endsWith('seed.ts')) {
    seedDatabase();
    process.exit(0);
}
