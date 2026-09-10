import { Request, Response } from 'express';
import db from '../config/db.js';

export const triageAssessment = async (req: Request, res: Response) => {
  const { symptoms, duration, severity, vitals, is_pregnant, age } = req.body;

  const symLower = (symptoms || '').toLowerCase();
  let category: 'Emergency' | 'Urgent' | 'Priority' | 'Routine' = 'Routine';
  let advice = 'Your symptoms appear mild. A routine consultation at your nearest Primary Health Centre (PHC) is recommended.';
  let requiresImmediateAttention = false;

  // Emergency red flags
  if (
    symLower.includes('chest pain') ||
    symLower.includes('breathless') ||
    symLower.includes('unconscious') ||
    symLower.includes('severe bleeding') ||
    symLower.includes('convulsion') ||
    symLower.includes('seizure') ||
    (vitals?.spo2 && parseInt(vitals.spo2) < 90) ||
    (vitals?.bp && parseInt(vitals.bp.split('/')[0]) > 180)
  ) {
    category = 'Emergency';
    requiresImmediateAttention = true;
    advice = 'EMERGENCY WARNING: These symptoms suggest a potential medical emergency. Please seek immediate professional care at the nearest 24/7 Emergency Facility or call 108 Ambulance.';
  } else if (
    is_pregnant ||
    symLower.includes('fever') && (duration?.includes('week') || duration?.includes('5') || duration?.includes('6')) ||
    symLower.includes('abdominal pain') ||
    severity === 'severe'
  ) {
    category = 'Urgent';
    advice = 'Urgent Attention Advised: Due to maternal status or persistent symptoms, please consult a medical officer at your nearest PHC or Rural Hospital within 12-24 hours.';
  } else if (severity === 'moderate' || symLower.includes('cough') || symLower.includes('weakness')) {
    category = 'Priority';
    advice = 'Priority Care: Schedule an OPD slot at PHC Shirwal. Drink clean boiled water and monitor your vitals.';
  }

  // Nearest emergency capable facility
  const nearestEmergency = await db.prepare('SELECT name, address, phone FROM facilities WHERE emergency_24x7 = 1 ORDER BY id LIMIT 1').get();

  res.json({
    category,
    requiresImmediateAttention,
    advice,
    nearestEmergencyFacility: nearestEmergency,
    emergencyHelplines: [
      { label: 'Maharashtra Emergency Medical Ambulance Service', number: '108' },
      { label: 'National Health Helpline', number: '104' },
      { label: 'Women & Child Helpline', number: '1098 / 181' }
    ],
    safetyDisclaimer: 'CLINICAL DECISION SUPPORT NOTICE: This triage assessment is an automated preliminary guidance tool designed for public health navigation. It does NOT constitute a formal medical diagnosis or replace clinical judgment by a qualified medical professional.'
  });
};

export const healthAssistant = (req: Request, res: Response) => {
  const { question, language } = req.body;
  const q = (question || '').toLowerCase();

  let responseText = '';
  if (q.includes('phc') || q.includes('hospital') || q.includes('रुग्णालय') || q.includes('दवाखाना')) {
    responseText = 'You can find all nearby Primary Health Centres (PHC), Rural Hospitals, and District Hospitals using the "Find Facilities" map on AROHA+. You can also view live doctor availability, bed counts, and medicine stock before traveling.';
  } else if (q.includes('medicine') || q.includes('औषध') || q.includes('दवा') || q.includes('paracetamol')) {
    responseText = 'Public health facilities in Maharashtra provide essential medicines free of charge under the Mahatma Jyotirao Phule Jan Arogya Yojana & National Health Mission. You can check real-time stock levels of Paracetamol, ORS, IFA, Metformin and others in the "Medicine Availability" tab.';
  } else if (q.includes('referral') || q.includes('रेफरल') || q.includes('specialist')) {
    responseText = 'If your PHC medical officer determines you require specialist care (like OB-GYN, Surgery, Cardiology, or Sonography), they generate a digital referral on AROHA+. Your appointment at the District Hospital is automatically prioritized, and your ASHA worker will coordinate your follow-up.';
  } else {
    responseText = 'AROHA+ connects you directly to public healthcare services in your district. You can book doctor appointments, track your OPD queue token in real time, check medicine stock, or consult an ASHA worker for home visits.';
  }

  res.json({
    answer: responseText,
    language: language || 'en',
    disclaimer: 'Informational decision support for public healthcare services.'
  });
};
