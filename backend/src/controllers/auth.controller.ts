import { Request, Response } from 'express';
import db from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getMe = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  // If patient, fetch patient details
  let patientProfile = null;
  if (user.role === 'patient') {
    patientProfile = await db.prepare('SELECT * FROM patients WHERE user_id = ? OR phone = ?').get(user.id, user.phone);
  }

  res.json({
    user,
    patientProfile
  });
};

// In-memory OTP store for simulated demo authentication with expiry and cooldown
interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  maskedPhone: string;
}

const otpCache = new Map<string, OtpEntry>();

export const sendPatientOtp = async (req: Request, res: Response) => {
  const { patientId } = req.body;
  if (!patientId || !String(patientId).trim()) {
    return res.status(400).json({ error: 'Please enter your Seva Health Patient ID.' });
  }

  const cleanId = String(patientId).trim();

  // Search by Patient ID (case-insensitive) or user_id or abha_id
  const patient = await db.prepare(`
    SELECT * FROM patients
    WHERE UPPER(id) = UPPER(?) OR UPPER(user_id) = UPPER(?) OR abha_id = ?
    LIMIT 1
  `).get(cleanId, cleanId, cleanId) as any;

  if (!patient) {
    return res.status(404).json({
      error: `Patient ID "${cleanId}" not found. Please verify your ID or complete registration.`
    });
  }

  if (!patient.phone || String(patient.phone).trim().length < 4) {
    return res.status(400).json({
      error: 'No registered mobile number found associated with this Patient ID.'
    });
  }

  const phone = String(patient.phone).trim();
  const last4 = phone.slice(-4);
  const maskedPhone = `****${last4}`;

  // Cooldown check (30 seconds)
  const existing = otpCache.get(patient.id);
  const now = Date.now();
  if (existing && now - existing.lastSentAt < 30000) {
    const waitSec = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
    return res.status(429).json({
      error: `Please wait ${waitSec} seconds before requesting a new OTP.`
    });
  }

  // Simulated Demo OTP (SIH Prototype standard: 123456)
  const otp = '123456';
  otpCache.set(patient.id, {
    otp,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes validity
    attempts: 0,
    lastSentAt: now,
    maskedPhone
  });

  return res.json({
    success: true,
    message: `OTP sent to your registered mobile number ending in ****${last4}`,
    maskedPhone,
    patientId: patient.id,
    patientName: patient.full_name,
    demoOtp: otp,
    expiresInSeconds: 300,
    isDemoMode: true
  });
};

export const verifyPatientOtp = async (req: Request, res: Response) => {
  const { patientId, otp } = req.body;
  if (!patientId || !otp) {
    return res.status(400).json({ error: 'Patient ID and OTP code are required.' });
  }

  const cleanId = String(patientId).trim();
  const cleanOtp = String(otp).trim();

  const patient = await db.prepare(`
    SELECT * FROM patients
    WHERE UPPER(id) = UPPER(?) OR UPPER(user_id) = UPPER(?) OR abha_id = ?
    LIMIT 1
  `).get(cleanId, cleanId, cleanId) as any;

  if (!patient) {
    return res.status(404).json({ error: 'Patient ID not found.' });
  }

  const cached = otpCache.get(patient.id);
  const now = Date.now();

  let isValid = false;
  // Demo Mode acceptance: 123456 or cached OTP if not expired
  if (cleanOtp === '123456') {
    isValid = true;
  } else if (cached && cached.otp === cleanOtp && now <= cached.expiresAt) {
    isValid = true;
  }

  if (!isValid) {
    if (cached) {
      cached.attempts += 1;
      if (cached.attempts >= 5) {
        otpCache.delete(patient.id);
        return res.status(400).json({ error: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' });
      }
    }
    return res.status(400).json({ error: 'Invalid or expired OTP code. Enter 123456 or request a new OTP.' });
  }

  // Clear OTP on successful verification
  otpCache.delete(patient.id);

  // Retrieve or create User session
  let user: any = null;
  if (patient.user_id) {
    user = await db.prepare('SELECT * FROM users WHERE id = ?').get(patient.user_id);
  }
  if (!user && patient.phone) {
    user = await db.prepare('SELECT * FROM users WHERE phone = ?').get(patient.phone);
  }
  if (!user) {
    user = {
      id: `usr-${patient.id}`,
      full_name: patient.full_name,
      email: `${patient.id.toLowerCase()}@sevahealth.local`,
      phone: patient.phone,
      role: 'patient',
      language: 'mr'
    };
  }

  return res.json({
    message: 'Authentication successful',
    token: `demo-token-${user.id}`,
    user: {
      ...user,
      role: 'patient'
    },
    patientProfile: patient
  });
};

export const login = async (req: Request, res: Response) => {
  const { identifier, role: requestedRole, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Identification (Patient ID, Mobile, ABHA ID, or Employee ID) is required' });
  }

  const idClean = String(identifier).trim().toLowerCase();

  let patientProfile = null;
  let user: any = null;

  // 1. Direct Patient ID or ABHA ID lookup (e.g. P-10452, P-10453, P-10454)
  if (idClean.startsWith('p-') || requestedRole === 'patient') {
    const patientRecord = await db.prepare('SELECT * FROM patients WHERE UPPER(id) = UPPER(?) OR abha_id = ?').get(identifier, identifier) as any;
    if (patientRecord) {
      patientProfile = patientRecord;
      if (patientRecord.user_id) {
        user = await db.prepare('SELECT * FROM users WHERE id = ?').get(patientRecord.user_id);
      }
      if (!user) {
        user = {
          id: `usr-${patientRecord.id}`,
          full_name: patientRecord.full_name,
          email: `${patientRecord.id.toLowerCase()}@sevahealth.local`,
          phone: patientRecord.phone,
          role: 'patient',
          language: 'mr'
        };
      }
    }
  }

  // 2. Direct Demo Account Shortcuts
  if (!user) {
    // Demo credentials for the 4 staff roles: ASHA001, DOC001, ADMIN001, HOSP001 (Password: Demo@123)
    const staffDemoMap: Record<string, { userId: string; role: string; demoId: string; facilityId?: string }> = {
      'asha001': { userId: 'usr-asha-1', role: 'asha_worker', demoId: 'ASHA001' },
      'doc001': { userId: 'usr-doc-1', role: 'doctor', demoId: 'DOC001' },
      'admin001': { userId: 'usr-admin-1', role: 'admin', demoId: 'ADMIN001' },
      'hosp001': { userId: 'usr-staff-1', role: 'hospital', demoId: 'HOSP001', facilityId: 'fac-dh-satara' }
    };

    if (staffDemoMap[idClean]) {
      if (password && password !== 'Demo@123' && password !== 'demo123') {
        return res.status(401).json({ error: 'Invalid credentials. Password for demo accounts is Demo@123' });
      }
      const demoAccount = staffDemoMap[idClean];
      user = await db.prepare('SELECT * FROM users WHERE id = ?').get(demoAccount.userId) as any;
      if (user) {
        user.role = demoAccount.role;
        user.demo_id = demoAccount.demoId;
        if (demoAccount.facilityId) user.facility_id = demoAccount.facilityId;
      }
    } else if (idClean === 'patient@demo.com') {
      const p10452 = await db.prepare('SELECT * FROM patients WHERE id = ?').get('P-10452') as any;
      if (p10452) {
        patientProfile = p10452;
        if (p10452.user_id) user = await db.prepare('SELECT * FROM users WHERE id = ?').get(p10452.user_id);
      }
      if (!user) {
        user = await db.prepare('SELECT * FROM users WHERE id = ?').get('usr-patient-1');
      }
    } else if (idClean === 'anm@demo.com' || (idClean.includes('anm') && requestedRole !== 'patient') || (idClean.includes('asha') && requestedRole !== 'patient')) {
      if (password && password !== 'Demo@123' && password !== 'demo123') {
        return res.status(401).json({ error: 'Invalid credentials. Password for demo accounts is Demo@123' });
      }
      user = await db.prepare('SELECT * FROM users WHERE id = ?').get('usr-asha-1');
    } else if (idClean === 'doctor@demo.com' || (idClean.includes('doc') && requestedRole !== 'patient')) {
      if (password && password !== 'Demo@123' && password !== 'demo123') {
        return res.status(401).json({ error: 'Invalid credentials. Password for demo accounts is Demo@123' });
      }
      user = await db.prepare('SELECT * FROM users WHERE id = ?').get('usr-doc-1');
    } else if (idClean === 'hospital@demo.com' || (idClean.includes('hosp') && requestedRole !== 'patient')) {
      if (password && password !== 'Demo@123' && password !== 'demo123') {
        return res.status(401).json({ error: 'Invalid credentials. Password for demo accounts is Demo@123' });
      }
      user = await db.prepare('SELECT * FROM users WHERE id = ?').get('usr-staff-1');
      if (user) user.role = 'hospital';
    } else if (idClean === 'admin@demo.com' || (idClean.includes('admin') && requestedRole !== 'patient')) {
      if (password && password !== 'Demo@123' && password !== 'demo123') {
        return res.status(401).json({ error: 'Invalid credentials. Password for demo accounts is Demo@123' });
      }
      user = await db.prepare('SELECT * FROM users WHERE id = ?').get('usr-admin-1');
    }
  }

  // 3. Query user by email, phone, or ID
  if (!user) {
    user = await db.prepare('SELECT * FROM users WHERE phone = ? OR email = ? OR id = ?').get(identifier, identifier, identifier) as any;
  }

  // 4. Query patient by phone or generic identifier if still not found
  if (!user && !patientProfile) {
    const patientRecord = await db.prepare('SELECT * FROM patients WHERE phone = ? OR UPPER(id) = UPPER(?)').get(identifier, identifier) as any;
    if (patientRecord) {
      patientProfile = patientRecord;
      if (patientRecord.user_id) {
        user = await db.prepare('SELECT * FROM users WHERE id = ?').get(patientRecord.user_id) as any;
      }
      if (!user) {
        user = {
          id: `usr-${patientRecord.id}`,
          full_name: patientRecord.full_name,
          email: `${patientRecord.id.toLowerCase()}@sevahealth.local`,
          phone: patientRecord.phone,
          role: 'patient',
          language: 'mr'
        };
      }
    }
  }

  // 4. If still not found and role is patient, register citizen user
  if (!user) {
    const newUserId = `usr-gen-${Date.now()}`;
    const isPhone = /^\d+$/.test(identifier);
    const phone = isPhone ? identifier : `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const email = isPhone ? `citizen_${phone}@example.com` : identifier;

    await db.prepare(`
      INSERT INTO users (id, full_name, email, phone, role, language)
      VALUES (?, ?, ?, ?, ?, 'mr')
    `).run(newUserId, 'Citizen Beneficiary', email, phone, requestedRole || 'patient');

    user = await db.prepare('SELECT * FROM users WHERE id = ?').get(newUserId) as any;

    const patientId = `pat-${Date.now()}`;
    await db.prepare(`
      INSERT INTO patients (id, user_id, abha_id, full_name, age, gender, phone, village, taluka, district, consent_status)
      VALUES (?, ?, ?, ?, 30, 'Other', ?, 'Shirwal', 'Khandala', 'Satara', 1)
    `).run(patientId, newUserId, `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`, 'Citizen Beneficiary', phone);

    patientProfile = await db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  }

  if (!patientProfile && (user.role === 'patient' || requestedRole === 'patient')) {
    patientProfile = await db.prepare('SELECT * FROM patients WHERE user_id = ? OR phone = ?').get(user.id, user.phone);
  }

  // Ensure hospital role is mapped cleanly
  const finalRole = requestedRole === 'hospital' ? 'hospital' : user.role;

  res.json({
    message: 'Authentication successful',
    token: `demo-token-${user.id}`,
    user: {
      ...user,
      role: finalRole,
      facility_id: user.facility_id || (finalRole === 'hospital' ? 'fac-dh-satara' : null)
    },
    patientProfile
  });
};

export const switchDemoRole = async (req: Request, res: Response) => {
  const { role } = req.body;
  const lookupRole = role === 'hospital' ? 'facility_staff' : role;
  let user = await db.prepare('SELECT * FROM users WHERE role = ? ORDER BY id ASC LIMIT 1').get(lookupRole) as any;

  if (!user && role === 'hospital') {
    user = await db.prepare('SELECT * FROM users WHERE id = ?').get('usr-staff-1') as any;
  }

  if (!user) {
    return res.status(404).json({ error: 'No demo account found for role: ' + role });
  }

  if (role === 'hospital') {
    user.role = 'hospital';
    user.facility_id = 'fac-dh-satara';
  }

  let patientProfile = null;
  if (user.role === 'patient') {
    patientProfile = await db.prepare('SELECT * FROM patients WHERE user_id = ? OR phone = ?').get(user.id, user.phone);
  }

  res.json({
    message: `Switched to role: ${role}`,
    user,
    patientProfile
  });
};


export const listDemoAccounts = async (_req: Request, res: Response) => {
  const accounts = await db.prepare(`
    SELECT u.id, u.full_name, u.email, u.phone, u.role, u.facility_id, f.name as facility_name
    FROM users u
    LEFT JOIN facilities f ON u.facility_id = f.id
  `).all();
  res.json(accounts);
};

export const register = async (req: Request, res: Response) => {
  const fullName = String(req.body.full_name || req.body.fullName || '').trim();
  const phoneRaw = req.body.phone || req.body.mobileNumber || req.body.mobile;
  const dob = req.body.dob || req.body.dateOfBirth;
  const gender = req.body.gender || 'Other';
  const email = String(req.body.email || '').trim();
  const bloodGroup = req.body.blood_group || req.body.bloodGroup || null;
  const emergencyContact = req.body.emergency_contact || req.body.emergencyContact || null;
  const preferredLanguage = req.body.preferred_language || req.body.preferredLanguage || 'en';
  const state = String(req.body.state || 'Maharashtra').trim();
  const district = String(req.body.district || '').trim();
  const taluka = String(req.body.taluka || '').trim();
  const village = String(req.body.village || '').trim();
  const pinCode = req.body.pin_code || req.body.pinCode;
  const address = req.body.address ? String(req.body.address).trim() : null;
  const aadhaarNumber = req.body.aadhaar_number || req.body.aadhaarNumber || req.body.demoAadhaar;

  // Validation
  if (!fullName) {
    return res.status(400).json({ error: 'Please enter your full name.' });
  }

  const cleanPhone = String(phoneRaw || '').replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
  }

  if (!district || !village) {
    return res.status(400).json({ error: 'Please enter your district and village/town.' });
  }

  if (pinCode && !/^\d{6}$/.test(String(pinCode).trim())) {
    return res.status(400).json({ error: 'Please enter a valid 6-digit Indian PIN code.' });
  }

  // Calculate age from DOB if present
  let age = 30;
  if (dob) {
    const birthYear = new Date(dob).getFullYear();
    if (!isNaN(birthYear) && birthYear > 1900) {
      age = Math.max(1, new Date().getFullYear() - birthYear);
    }
  }

  // Prevent duplicate patient registration for the exact same name and phone
  const existingPatientSame = await db.prepare('SELECT id, full_name, phone FROM patients WHERE phone = ? AND LOWER(full_name) = LOWER(?)').get(cleanPhone, fullName.toLowerCase()) as any;
  if (existingPatientSame) {
    return res.status(409).json({
      error: `An account already exists for ${fullName} with mobile number ${cleanPhone} (Patient ID: ${existingPatientSame.id}). Please log in with your Patient ID.`
    });
  }

  // Generate unique sequential Seva Health Patient ID (starting from P-10452)
  let nextIdNum = 10452;
  const pRows = await db.prepare("SELECT id FROM patients WHERE id LIKE 'P-1%'").all() as { id: string }[];
  for (const r of pRows) {
    const parsed = parseInt(r.id.replace('P-', ''), 10);
    if (!isNaN(parsed) && parsed >= nextIdNum && parsed < 20000) {
      nextIdNum = parsed + 1;
    }
  }

  let patientId = `P-${nextIdNum}`;
  while (
    (await db.prepare('SELECT id FROM patients WHERE id = ?').get(patientId)) ||
    (await db.prepare('SELECT id FROM users WHERE id = ?').get(`usr-${patientId.toLowerCase()}`))
  ) {
    nextIdNum += 1;
    patientId = `P-${nextIdNum}`;
  }

  // Create dedicated patient user session in users table
  const userId = `usr-${patientId.toLowerCase()}`;
  let safeEmail = email ? email : `${patientId.toLowerCase()}@sevahealth.local`;
  if (await db.prepare('SELECT id FROM users WHERE email = ?').get(safeEmail)) {
    safeEmail = `${patientId.toLowerCase()}.${cleanPhone}@sevahealth.local`;
  }

  let safePhone = cleanPhone;
  const existingUserPhone = await db.prepare('SELECT id, role FROM users WHERE phone = ?').get(cleanPhone) as any;
  if (existingUserPhone) {
    safePhone = `${cleanPhone}-${patientId.toLowerCase()}`;
  }

  // Optional ABHA ID (Only stored if provided by patient)
  const abhaIdRaw = req.body.abha_id || req.body.abhaId;
  const providedAbha = abhaIdRaw && String(abhaIdRaw).trim().length > 0 ? String(abhaIdRaw).trim() : null;

  await db.transaction(async (trx) => {
    await trx.prepare(`
      INSERT INTO users (id, full_name, email, phone, role, language)
      VALUES (?, ?, ?, ?, 'patient', ?)
    `).run(
      userId,
      fullName,
      safeEmail,
      safePhone,
      preferredLanguage
    );

    await trx.prepare(`
      INSERT INTO patients (
        id, user_id, abha_id, full_name, age, gender, phone,
        village, taluka, district, blood_group, emergency_contact,
        consent_status, dob, address, pin_code, state
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(
      patientId,
      userId,
      providedAbha,
      fullName,
      age,
      gender,
      cleanPhone,
      village,
      taluka ? taluka : 'District Taluka',
      district,
      bloodGroup,
      emergencyContact ? String(emergencyContact).trim() : null,
      dob || null,
      address,
      pinCode ? String(pinCode).trim() : null,
      state
    );
  })();

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const patientProfile = await db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);

  res.status(201).json({
    message: 'Registration Successful',
    patientId,
    identityVerification: {
      status: 'VERIFIED',
      mode: 'Demo Identity Verification (Simulated for SIH prototype)',
      maskedAadhaar: aadhaarNumber ? `XXXX-XXXX-${String(aadhaarNumber).slice(-4)}` : 'XXXX-XXXX-8921'
    },
    user,
    patientProfile
  });
};

// ============================================================================
// AUTHENTICATED USER PROFILE API (FOR ALL 5 ROLES)
// ============================================================================
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const profileData: any = {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone ? `******${String(user.phone).slice(-4)}` : null,
      role: user.role,
      facility_id: user.facility_id,
      language: user.language || 'mr',
      created_at: user.created_at
    },
    role: user.role,
    roleTitle: '',
    attributes: {}
  };

  if (user.role === 'patient') {
    profileData.roleTitle = 'Patient';
    let p = await db.prepare('SELECT * FROM patients WHERE user_id = ? OR phone = ? OR id = ?').get(user.id, user.phone, user.id) as any;
    if (!p && user.phone) {
      p = await db.prepare('SELECT * FROM patients WHERE phone = ?').get(user.phone) as any;
    }
    if (p) {
      const maskedPhone = p.phone && p.phone.length >= 4 ? `******${p.phone.slice(-4)}` : '******5789';
      const hasAbha = p.abha_id && String(p.abha_id).trim().length > 0;
      profileData.attributes = {
        patientId: p.id,
        fullName: p.full_name,
        dob: p.dob || null,
        age: p.age || null,
        gender: p.gender === 'F' ? 'Female' : p.gender === 'M' ? 'Male' : p.gender || null,
        bloodGroup: p.blood_group || null,
        mobile: maskedPhone,
        address: `${p.village || ''}, ${p.taluka || ''}, ${p.district || ''}`.replace(/^[,\s]+|[,\s]+$/g, '') || null,
        village: p.village || null,
        taluka: p.taluka || null,
        district: p.district || null,
        abhaId: hasAbha ? String(p.abha_id).trim() : null,
        emergencyContact: p.emergency_contact || null,
        registrationDate: p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : 'Recent'
      };
    } else {
      profileData.attributes = {
        patientId: user.id,
        fullName: user.full_name,
        mobile: user.phone ? `******${user.phone.slice(-4)}` : null,
        registrationDate: 'Recent'
      };
    }
  } else if (user.role === 'asha_worker') {
    profileData.roleTitle = 'ANM / ASHA / Health Worker';
    const staff = await db.prepare('SELECT * FROM hospital_staff WHERE user_id = ? OR phone = ?').get(user.id, user.phone) as any;
    const fac = user.facility_id ? await db.prepare('SELECT * FROM facilities WHERE id = ?').get(user.facility_id) as any : null;
    const maskedPhone = user.phone && user.phone.length >= 4 ? `******${user.phone.slice(-4)}` : '******3211';

    profileData.attributes = {
      employeeId: staff?.employee_id || 'MH-ANM-2017-31',
      fullName: user.full_name,
      designation: staff?.role || 'ANM / Frontline Health Coordinator',
      department: staff?.department || 'Community Health & Maternal Care',
      facilityName: fac?.name || 'Primary Health Centre Shirwal',
      facilityType: fac?.type || 'PHC',
      district: fac?.district || 'Satara',
      taluka: fac?.taluka || 'Khandala',
      mobile: maskedPhone,
      email: user.email
    };
  } else if (user.role === 'doctor') {
    profileData.roleTitle = 'Doctor';
    const doc = await db.prepare('SELECT * FROM doctors WHERE user_id = ? OR full_name = ?').get(user.id, user.full_name) as any;
    const staff = await db.prepare('SELECT * FROM hospital_staff WHERE user_id = ? OR phone = ?').get(user.id, user.phone) as any;
    const facId = doc?.facility_id || user.facility_id;
    const fac = facId ? await db.prepare('SELECT * FROM facilities WHERE id = ?').get(facId) as any : null;
    const maskedPhone = user.phone && user.phone.length >= 4 ? `******${user.phone.slice(-4)}` : '******3212';

    profileData.attributes = {
      doctorId: doc?.id || staff?.employee_id || 'DOC-MH-2016',
      medicalRegistrationNumber: staff?.employee_id || 'MMC-49201',
      fullName: user.full_name,
      specialization: doc?.specialty || 'General Medicine & Public Health',
      qualification: doc?.qualification || 'MBBS, DNB',
      experienceYears: doc?.experience_years ? `${doc.experience_years} Years` : '8 Years',
      assignedFacility: fac?.name || 'Primary Health Centre Shirwal',
      department: staff?.department || 'Primary Healthcare OPD',
      roomNumber: doc?.room_number || 'OPD Room 2',
      mobile: maskedPhone,
      email: user.email
    };
  } else if (user.role === 'hospital' || user.role === 'facility_staff') {
    profileData.roleTitle = 'Hospital Management';
    const staff = await db.prepare('SELECT * FROM hospital_staff WHERE user_id = ? OR phone = ?').get(user.id, user.phone) as any;
    const facId = user.facility_id || staff?.facility_id || 'fac-phc-shirwal';
    const fac = facId ? await db.prepare('SELECT * FROM facilities WHERE id = ?').get(facId) as any : null;
    const maskedPhone = user.phone && user.phone.length >= 4 ? `******${user.phone.slice(-4)}` : '******3213';

    profileData.attributes = {
      staffId: staff?.employee_id || 'STAFF-MH-2021',
      fullName: user.full_name,
      designation: staff?.role || 'Hospital Operations & Bed Management Officer',
      department: staff?.department || 'Administration & Resource Allocation',
      authorizedHospital: fac?.name || 'Primary Health Centre Shirwal',
      facilityType: fac?.type || 'PHC',
      district: fac?.district || 'Satara',
      mobile: maskedPhone,
      email: user.email
    };
  } else if (user.role === 'admin') {
    profileData.roleTitle = 'Administrator';
    const maskedPhone = user.phone && user.phone.length >= 4 ? `******${user.phone.slice(-4)}` : '******3214';

    profileData.attributes = {
      adminId: 'ADMIN-MH-DIST-01',
      fullName: user.full_name,
      designation: 'State Health Administrator / District Collectorate',
      administrativeScope: 'Maharashtra State Health Directorate & Satara District',
      mobile: maskedPhone,
      email: user.email
    };
  }

  res.json(profileData);
};

// ============================================================================
// FORGOT PATIENT ID RECOVERY FLOW
// ============================================================================
interface ForgotIdEntry {
  patientId: string;
  phone: string;
  otp: string;
  expiresAt: number;
  maskedPhone: string;
}
const forgotIdCache = new Map<string, ForgotIdEntry>();

export const forgotPatientIdSendOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone || !String(phone).trim()) {
    return res.status(400).json({ error: 'Please enter your registered mobile number.' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }
  const last10 = cleanPhone.slice(-10);

  // Search for patient with this mobile number
  const patient = await db.prepare(`
    SELECT id, phone FROM patients
    WHERE phone LIKE ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(`%${last10}`) as any;

  if (!patient) {
    return res.status(404).json({
      error: 'No patient record found associated with this mobile number. Please register as a new patient.'
    });
  }

  const actualPhone = String(patient.phone).trim();
  const last4 = actualPhone.slice(-4);
  const maskedPhone = `****${last4}`;
  const recoveryToken = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const otp = '123456';

  forgotIdCache.set(recoveryToken, {
    patientId: patient.id,
    phone: actualPhone,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    maskedPhone
  });

  return res.json({
    success: true,
    message: `OTP sent to your registered mobile number ending in ****${last4}.`,
    recoveryToken,
    maskedPhone,
    demoOtp: otp,
    isDemoMode: true
  });
};

export const forgotPatientIdVerifyOtp = (req: Request, res: Response) => {
  const { recoveryToken, otp } = req.body;
  if (!recoveryToken || !otp) {
    return res.status(400).json({ error: 'Recovery token and OTP code are required.' });
  }

  const entry = forgotIdCache.get(recoveryToken);
  if (!entry) {
    return res.status(400).json({ error: 'OTP session expired or invalid. Please request a new OTP.' });
  }

  if (Date.now() > entry.expiresAt) {
    forgotIdCache.delete(recoveryToken);
    return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
  }

  if (String(otp).trim() !== entry.otp) {
    return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
  }

  const patientId = entry.patientId;
  forgotIdCache.delete(recoveryToken);

  return res.json({
    success: true,
    verified: true,
    patientId,
    message: 'Identity Verified ✓'
  });
};
