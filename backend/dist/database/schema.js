"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const db_js_1 = __importDefault(require("../config/db.js"));
function initializeDatabase() {
    db_js_1.default.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      facility_id TEXT,
      language TEXT DEFAULT 'mr',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      abha_id TEXT UNIQUE,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT NOT NULL,
      village TEXT NOT NULL,
      taluka TEXT NOT NULL,
      district TEXT NOT NULL,
      blood_group TEXT,
      emergency_contact TEXT,
      consent_status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS family_members (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      relationship TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      blood_group TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      district TEXT NOT NULL,
      taluka TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      emergency_24x7 INTEGER DEFAULT 0,
      total_beds INTEGER DEFAULT 0,
      available_beds INTEGER DEFAULT 0,
      queue_wait_minutes INTEGER DEFAULT 15,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS facility_services (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      category TEXT NOT NULL,
      is_available INTEGER DEFAULT 1,
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS facility_equipment (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      equipment_name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity_available INTEGER,
      is_available INTEGER DEFAULT 1,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      qualification TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      room_number TEXT NOT NULL,
      is_available_today INTEGER DEFAULT 1,
      teleconsult_available INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      appointment_number TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      doctor_id TEXT,
      service_name TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      priority TEXT DEFAULT 'normal',
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS queue_tokens (
      id TEXT PRIMARY KEY,
      token_number INTEGER NOT NULL,
      appointment_id TEXT UNIQUE NOT NULL,
      facility_id TEXT NOT NULL,
      doctor_id TEXT,
      patient_id TEXT NOT NULL,
      status TEXT DEFAULT 'waiting',
      estimated_wait_minutes INTEGER DEFAULT 15,
      counter_room TEXT NOT NULL,
      called_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      appointment_id TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      vitals_json TEXT NOT NULL,
      clinical_notes TEXT,
      follow_up_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      consultation_id TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      medicines_json TEXT NOT NULL,
      instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS diagnostic_tests (
      id TEXT PRIMARY KEY,
      consultation_id TEXT,
      patient_id TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      test_name TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT DEFAULT 'routine',
      status TEXT DEFAULT 'ordered',
      result_summary TEXT,
      report_url TEXT,
      turnaround_time TEXT DEFAULT '2 hours',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      name TEXT NOT NULL,
      generic_name TEXT NOT NULL,
      category TEXT NOT NULL,
      dosage_form TEXT NOT NULL,
      stock_quantity INTEGER NOT NULL,
      reorder_level INTEGER NOT NULL,
      unit TEXT NOT NULL,
      status TEXT NOT NULL,
      last_restocked DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      referral_code TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL,
      referring_facility_id TEXT NOT NULL,
      referring_doctor_id TEXT NOT NULL,
      receiving_facility_id TEXT NOT NULL,
      specialty_required TEXT NOT NULL,
      priority TEXT DEFAULT 'priority',
      clinical_reason TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT DEFAULT 'created',
      target_date TEXT NOT NULL,
      completed_at DATETIME,
      outcome_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (referring_facility_id) REFERENCES facilities(id),
      FOREIGN KEY (receiving_facility_id) REFERENCES facilities(id)
    );

    CREATE TABLE IF NOT EXISTS referral_events (
      id TEXT PRIMARY KEY,
      referral_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS maternal_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      lmp_date TEXT NOT NULL,
      edd_date TEXT NOT NULL,
      anc_visit_count INTEGER DEFAULT 1,
      gravidity INTEGER DEFAULT 1,
      parity INTEGER DEFAULT 0,
      high_risk_flag INTEGER DEFAULT 0,
      risk_factors TEXT,
      assigned_asha_id TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS child_health_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      child_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      birth_weight REAL NOT NULL,
      current_weight REAL NOT NULL,
      height REAL NOT NULL,
      immunization_status_json TEXT NOT NULL,
      nutritional_grade TEXT DEFAULT 'normal',
      assigned_asha_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS chronic_care_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      condition_type TEXT NOT NULL,
      diagnosed_year INTEGER NOT NULL,
      current_bp TEXT,
      blood_sugar_fasting REAL,
      last_follow_up TEXT NOT NULL,
      next_follow_up TEXT NOT NULL,
      medication_adherence TEXT DEFAULT 'good',
      risk_level TEXT DEFAULT 'low',
      assigned_asha_id TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS home_visits (
      id TEXT PRIMARY KEY,
      asha_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      visit_date TEXT NOT NULL,
      vitals_json TEXT NOT NULL,
      observations TEXT NOT NULL,
      pregnancy_notes TEXT,
      child_growth_notes TEXT,
      symptoms TEXT,
      sync_status TEXT DEFAULT 'synced',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS wards (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      gender_allowed TEXT DEFAULT 'Any',
      capacity INTEGER NOT NULL DEFAULT 10,
      floor TEXT DEFAULT 'Ground Floor',
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS beds (
      id TEXT PRIMARY KEY,
      ward_id TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      room_number TEXT NOT NULL,
      bed_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Available',
      current_patient_id TEXT,
      last_cleaned_at DATETIME,
      notes TEXT,
      FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE CASCADE,
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
      FOREIGN KEY (current_patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS admissions (
      id TEXT PRIMARY KEY,
      admission_number TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      ward_id TEXT,
      bed_id TEXT,
      doctor_id TEXT,
      referral_id TEXT,
      department TEXT NOT NULL,
      priority TEXT DEFAULT 'Normal',
      admission_date TEXT NOT NULL,
      discharge_date TEXT,
      status TEXT DEFAULT 'Awaiting Assessment',
      provisional_diagnosis TEXT NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (facility_id) REFERENCES facilities(id),
      FOREIGN KEY (ward_id) REFERENCES wards(id),
      FOREIGN KEY (bed_id) REFERENCES beds(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS discharges (
      id TEXT PRIMARY KEY,
      admission_id TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL,
      discharge_date TEXT NOT NULL,
      discharge_condition TEXT NOT NULL,
      treatment_summary TEXT NOT NULL,
      discharge_medicines_json TEXT NOT NULL,
      follow_up_date TEXT,
      follow_up_notes TEXT,
      responsible_asha_id TEXT,
      follow_up_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admission_id) REFERENCES admissions(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS hospital_staff (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      facility_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      shift TEXT NOT NULL DEFAULT 'Morning',
      is_available INTEGER DEFAULT 1,
      phone TEXT,
      email TEXT,
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS grievances (
      id TEXT PRIMARY KEY,
      grievance_code TEXT UNIQUE NOT NULL,
      citizen_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      category TEXT NOT NULL,
      facility_id TEXT,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'submitted',
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS health_assessments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      symptoms_json TEXT NOT NULL,
      triage_level TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      recommended_facility_id TEXT,
      emergency_flag INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
  `);
    // Migration helpers for existing columns on medicines and diagnostic_tests
    const tryAddColumn = (table, columnDef) => {
        try {
            db_js_1.default.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef};`);
        }
        catch {
            // Column already exists, safe to ignore
        }
    };
    tryAddColumn('medicines', 'batch_number TEXT DEFAULT "BATCH-2026-A"');
    tryAddColumn('medicines', 'expiry_date TEXT DEFAULT "2027-12-31"');
    tryAddColumn('medicines', 'storage_location TEXT DEFAULT "Main Pharmacy Rack A"');
    tryAddColumn('diagnostic_tests', 'sample_status TEXT DEFAULT "collected"');
    tryAddColumn('diagnostic_tests', 'processing_status TEXT DEFAULT "in_progress"');
    tryAddColumn('diagnostic_tests', 'equipment_name TEXT DEFAULT "Automated Hematology Analyzer 5-Part"');
    tryAddColumn('diagnostic_tests', 'technician_notes TEXT DEFAULT "Sample validated by Senior Lab Technician"');
    // Address and demographic extension for patient registration
    tryAddColumn('patients', 'dob TEXT');
    tryAddColumn('patients', 'address TEXT');
    tryAddColumn('patients', 'pin_code TEXT');
    tryAddColumn('patients', 'state TEXT DEFAULT "Maharashtra"');
    // Ensure abha_id is nullable (optional) for patient registration
    try {
        const pInfo = db_js_1.default.prepare('PRAGMA table_info(patients)').all();
        const abhaCol = pInfo.find(c => c.name === 'abha_id');
        if (abhaCol && abhaCol.notnull === 1) {
            db_js_1.default.pragma('foreign_keys = OFF');
            db_js_1.default.exec(`
        CREATE TABLE patients_migrated (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          abha_id TEXT UNIQUE,
          full_name TEXT NOT NULL,
          age INTEGER NOT NULL,
          gender TEXT NOT NULL,
          phone TEXT NOT NULL,
          village TEXT NOT NULL,
          taluka TEXT NOT NULL,
          district TEXT NOT NULL,
          blood_group TEXT,
          emergency_contact TEXT,
          consent_status INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          dob TEXT,
          address TEXT,
          pin_code TEXT,
          state TEXT DEFAULT 'Maharashtra'
        );
        INSERT INTO patients_migrated SELECT id, user_id, abha_id, full_name, age, gender, phone, village, taluka, district, blood_group, emergency_contact, consent_status, created_at, dob, address, pin_code, state FROM patients;
        DROP TABLE patients;
        ALTER TABLE patients_migrated RENAME TO patients;
      `);
            db_js_1.default.pragma('foreign_keys = ON');
        }
    }
    catch (err) {
        console.error('Migration check on patients.abha_id:', err);
    }
    console.log('✅ SQLite Database schema initialized successfully');
}
