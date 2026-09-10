export type UserRole = 'patient' | 'asha_worker' | 'doctor' | 'facility_staff' | 'hospital' | 'admin';


export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  facility_id?: string | null;
  language: string;
  created_at: string;
}

export interface Patient {
  id: string;
  user_id?: string | null;
  abha_id: string;
  full_name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  phone: string;
  village: string;
  taluka: string;
  district: string;
  blood_group?: string;
  emergency_contact?: string;
  consent_status: number;
  created_at: string;
}

export type FacilityType = 'Sub-Centre' | 'PHC' | 'Rural Hospital' | 'Sub-District Hospital' | 'District Hospital';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  district: string;
  taluka: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  emergency_24x7: number;
  total_beds: number;
  available_beds: number;
  queue_wait_minutes: number;
  last_updated: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  facility_id: string;
  full_name: string;
  specialty: string;
  qualification: string;
  experience_years: number;
  room_number: string;
  is_available_today: number;
  teleconsult_available: number;
}

export interface Appointment {
  id: string;
  appointment_number: string;
  patient_id: string;
  facility_id: string;
  doctor_id?: string | null;
  service_name: string;
  appointment_date: string;
  time_slot: string;
  status: 'scheduled' | 'in_queue' | 'in_consultation' | 'completed' | 'cancelled';
  priority: 'normal' | 'urgent' | 'maternal' | 'emergency';
  reason: string;
  created_at: string;
}

export interface QueueToken {
  id: string;
  token_number: number;
  appointment_id: string;
  facility_id: string;
  doctor_id?: string | null;
  patient_id: string;
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'skipped';
  estimated_wait_minutes: number;
  counter_room: string;
  called_at?: string | null;
  created_at: string;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  facility_id: string;
  symptoms: string;
  diagnosis: string;
  vitals_json: string; // { bp: "120/80", pulse: 74, spo2: 98, temp: 98.6, weight: 58 }
  clinical_notes: string;
  follow_up_date?: string | null;
  created_at: string;
}

export interface Prescription {
  id: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string;
  medicines_json: string; // [{ name, dosage, frequency, days, instructions }]
  instructions: string;
  created_at: string;
}

export interface DiagnosticTest {
  id: string;
  consultation_id?: string | null;
  patient_id: string;
  facility_id: string;
  test_name: string;
  category: string;
  priority: 'routine' | 'urgent' | 'emergency';
  status: 'ordered' | 'sample_collected' | 'processing' | 'completed';
  result_summary?: string | null;
  report_url?: string | null;
  turnaround_time: string;
  created_at: string;
  completed_at?: string | null;
}

export interface Medicine {
  id: string;
  facility_id: string;
  name: string;
  generic_name: string;
  category: string;
  dosage_form: string;
  stock_quantity: number;
  reorder_level: number;
  unit: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_restocked: string;
}

export interface Referral {
  id: string;
  referral_code: string;
  patient_id: string;
  referring_facility_id: string;
  referring_doctor_id: string;
  receiving_facility_id: string;
  specialty_required: string;
  priority: 'routine' | 'priority' | 'emergency';
  clinical_reason: string;
  summary: string;
  status: 'created' | 'accepted' | 'scheduled' | 'attended' | 'completed' | 'counter_referred';
  target_date: string;
  completed_at?: string | null;
  outcome_notes?: string | null;
  created_at: string;
}

export interface MaternalRecord {
  id: string;
  patient_id: string;
  lmp_date: string;
  edd_date: string;
  anc_visit_count: number;
  gravidity: number;
  parity: number;
  high_risk_flag: number;
  risk_factors?: string | null;
  assigned_asha_id: string;
  notes?: string | null;
  created_at: string;
}

export interface ChildHealthRecord {
  id: string;
  patient_id: string;
  child_name: string;
  dob: string;
  gender: 'M' | 'F';
  birth_weight: number;
  current_weight: number;
  height: number;
  immunization_status_json: string;
  nutritional_grade: 'normal' | 'moderate' | 'severe';
  assigned_asha_id: string;
  created_at: string;
}

export interface ChronicCareRecord {
  id: string;
  patient_id: string;
  condition_type: string; // 'Hypertension' | 'Type 2 Diabetes' | 'Asthma' | 'COPD'
  diagnosed_year: number;
  current_bp?: string;
  blood_sugar_fasting?: number;
  last_follow_up: string;
  next_follow_up: string;
  medication_adherence: 'good' | 'moderate' | 'poor';
  risk_level: 'low' | 'moderate' | 'high';
  assigned_asha_id: string;
}

export interface HomeVisit {
  id: string;
  asha_id: string;
  patient_id: string;
  visit_date: string;
  vitals_json: string;
  observations: string;
  pregnancy_notes?: string | null;
  child_growth_notes?: string | null;
  symptoms?: string | null;
  sync_status: 'synced' | 'pending';
  created_at: string;
}

export interface Grievance {
  id: string;
  grievance_code: string;
  citizen_name: string;
  phone: string;
  category: string;
  facility_id?: string | null;
  description: string;
  status: 'submitted' | 'under_review' | 'resolved' | 'closed';
  resolution_notes?: string | null;
  created_at: string;
}

export type BedStatus = 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' | 'Maintenance';

export interface Ward {
  id: string;
  facility_id: string;
  name: string;
  department: string;
  gender_allowed: string;
  capacity: number;
  floor: string;
}

export interface Bed {
  id: string;
  ward_id: string;
  facility_id: string;
  room_number: string;
  bed_number: string;
  status: BedStatus;
  current_patient_id?: string | null;
  last_cleaned_at?: string | null;
  notes?: string | null;
  ward_name?: string;
  patient_name?: string;
}

export type AdmissionStatus =
  | 'Referred'
  | 'Awaiting Assessment'
  | 'Approved'
  | 'Admitted'
  | 'Under Treatment'
  | 'Discharged'
  | 'Referred Onward';

export interface Admission {
  id: string;
  admission_number: string;
  patient_id: string;
  facility_id: string;
  ward_id?: string | null;
  bed_id?: string | null;
  doctor_id?: string | null;
  referral_id?: string | null;
  department: string;
  priority: 'Normal' | 'Urgent' | 'Emergency' | 'Maternal';
  admission_date: string;
  discharge_date?: string | null;
  status: AdmissionStatus;
  provisional_diagnosis: string;
  reason?: string | null;
  created_at: string;
  patient_name?: string;
  doctor_name?: string;
  ward_name?: string;
  bed_number?: string;
}

export interface Discharge {
  id: string;
  admission_id: string;
  patient_id: string;
  discharge_date: string;
  discharge_condition: string;
  treatment_summary: string;
  discharge_medicines_json: string;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  responsible_asha_id?: string | null;
  follow_up_completed: number;
  created_at: string;
  patient_name?: string;
}

export interface HospitalStaff {
  id: string;
  user_id?: string | null;
  facility_id: string;
  full_name: string;
  role: string;
  employee_id: string;
  department: string;
  shift: 'Morning' | 'Evening' | 'Night' | 'On-Call';
  is_available: number;
  phone?: string;
  email?: string;
}

