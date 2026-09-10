/**
 * Seva Health - Digital Health Assessment & Triage Decision-Support Engine
 *
 * Rural Healthcare Guidance:
 * A patient's symptoms (collected via the AI symptom chatbot) are classified
 * by Gemini into one of four care levels. This module holds only what stays
 * true regardless of who/what produced the category: the category type, its
 * display styling, and the facility-matching logic.
 *  - 🟢 SELF_CARE: Minor/transient complaints -> active home monitoring & ASHA follow-up
 *  - 🟡 PHC: Common acute illness -> nearest Primary Health Centre / Ayushman Arogya Mandir
 *  - 🟠 HIGHER_LEVEL: Persistent, multi-symptom, or high-risk -> CHC / Rural / Sub-District Hospital
 *  - 🔴 EMERGENCY: Acute red flags -> immediate 108 ambulance & 24/7 casualty hospital
 */

export type TriageLevel = 'SELF_CARE' | 'PHC' | 'HIGHER_LEVEL' | 'EMERGENCY';

export interface TriageResult {
  category: TriageLevel;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  title: {
    en: string;
    hi: string;
    mr: string;
  };
  recommendedCareLevel: {
    en: string;
    hi: string;
    mr: string;
  };
  recommendedFacilityType: string;
  isEmergency: boolean;
}

// Cosmetic/structural styling per triage category - badge colors, title, and
// the facility tier label. The actual clinical content (what's wrong, why
// this tier, the patient-facing message) comes from Gemini per-assessment,
// not from a static template here.
export const TRIAGE_CATEGORY_STYLES: Record<TriageLevel, TriageResult> = {
  EMERGENCY: {
    category: 'EMERGENCY',
    badgeColor: '#b45309',
    badgeBg: '#fffaf0',
    badgeBorder: '#d97706',
    isEmergency: true,
    title: {
      en: 'URGENT EMERGENCY CARE',
      hi: 'तातडीची वैद्यकीय मदत / आपत्कालीन सेवा',
      mr: 'तातडीची आपत्कालीन वैद्यकीय सेवा आवश्यक'
    },
    recommendedCareLevel: {
      en: '24/7 Emergency Casualty / District Hospital',
      hi: '24/7 आपातकालीन विभाग / जिला अस्पताल',
      mr: '२४/७ आपत्कालीन विभाग / जिल्हा रुग्णालय'
    },
    recommendedFacilityType: 'District Hospital'
  },
  HIGHER_LEVEL: {
    category: 'HIGHER_LEVEL',
    badgeColor: '#ea580c',
    badgeBg: '#fff7ed',
    badgeBorder: '#f97316',
    isEmergency: false,
    title: {
      en: 'HIGHER-LEVEL FACILITY / DOCTOR REVIEW',
      hi: 'उच्च-स्तरीय रुग्णालय / विशेषज्ञ डॉक्टर समीक्षा',
      mr: 'ग्रामीण / उप-जिल्हा रुग्णालय डॉक्टर तपासणी'
    },
    recommendedCareLevel: {
      en: 'Rural Hospital / Sub-District Hospital / CHC',
      hi: 'ग्रामीण अस्पताल / उप-जिला अस्पताल / सीएचसी',
      mr: 'ग्रामीण रुग्णालय / उप-जिल्हा रुग्णालय / सीएचसी'
    },
    recommendedFacilityType: 'Rural Hospital'
  },
  PHC: {
    category: 'PHC',
    badgeColor: '#d97706',
    badgeBg: '#fffbeb',
    badgeBorder: '#f59e0b',
    isEmergency: false,
    title: {
      en: 'PRIMARY CARE RECOMMENDED',
      hi: 'प्राथमिक आरोग्य केंद्र (PHC) सल्ला',
      mr: 'प्राथमिक आरोग्य केंद्र (PHC) तपासणी'
    },
    recommendedCareLevel: {
      en: 'Primary Health Centre (PHC) / Ayushman Arogya Mandir',
      hi: 'प्राथमिक स्वास्थ्य केंद्र (PHC) / आयुष्मान आरोग्य मंदिर',
      mr: 'प्राथमिक आरोग्य केंद्र (PHC) / आयुष्मान आरोग्य मंदिर'
    },
    recommendedFacilityType: 'PHC'
  },
  SELF_CARE: {
    category: 'SELF_CARE',
    badgeColor: '#059669',
    badgeBg: '#ecfdf5',
    badgeBorder: '#10b981',
    isEmergency: false,
    title: {
      en: 'SELF-CARE & ACTIVE MONITORING',
      hi: 'स्व-देखभाल और सक्रिय निगरानी',
      mr: 'स्वतःची काळजी आणि लक्षणांवर देखरेख'
    },
    recommendedCareLevel: {
      en: 'Home Self-Care & Local Sub-Centre / ASHA Support',
      hi: 'घरेलू देखभाल एवं स्थानीय उप-केंद्र / आशा कार्यकर्ता संपर्क',
      mr: 'घरगुती काळजी आणि स्थानिक उपकेंद्र / आशा ताईंशी संपर्क'
    },
    recommendedFacilityType: 'Sub-Centre'
  }
};

export interface MatchedFacilityInfo {
  facility: any;
  reason: {
    en: string;
    hi: string;
    mr: string;
  };
  distanceText: string;
  travelTimeText: string;
  doctorSummary?: {
    name: string;
    specialty: string;
  };
}

/**
 * Match the lowest appropriate facility based on triage level, patient location, and database facilities.
 */
export function matchRecommendedFacility(
  triageLevel: TriageLevel,
  facilities: any[],
  patientProfile?: { village?: string; taluka?: string; district?: string }
): MatchedFacilityInfo {
  const patientTaluka = (patientProfile?.taluka || '').toLowerCase().trim();
  const patientVillage = (patientProfile?.village || '').toLowerCase().trim();

  // 1. EMERGENCY -> Prioritize 24/7 Emergency Facility (District Hospital or high-capability hospital)
  if (triageLevel === 'EMERGENCY') {
    const emergencyFac =
      facilities.find(
        (f) =>
          f.emergency_24x7 === 1 &&
          (f.type === 'District Hospital' || f.name.toLowerCase().includes('district'))
      ) ||
      facilities.find((f) => f.emergency_24x7 === 1) ||
      facilities[0];

    return {
      facility: emergencyFac,
      reason: {
        en: 'Equipped with 24/7 emergency casualty ward, critical care stabilization, and round-the-clock medical officers.',
        hi: '24/7 आपातकालीन विभाग, क्रिटिकल केयर और चौबीसों घंटे डॉक्टर की सुविधा से सुसज्जित।',
        mr: '२४/७ आपत्कालीन वॉर्ड, अतिदक्षता सेवा आणि २४ तास उपस्थित वैद्यकीय अधिकारी उपलब्ध आहेत.'
      },
      distanceText: emergencyFac?.taluka?.toLowerCase() === patientTaluka ? '4.5 km away' : '38 km away',
      travelTimeText: emergencyFac?.taluka?.toLowerCase() === patientTaluka ? '~12 mins by ambulance' : '~45 mins by ambulance',
      doctorSummary: {
        name: 'Dr. Rajiv Joshi / Emergency On-Call Team',
        specialty: 'Emergency Medicine & Critical Care'
      }
    };
  }

  // 2. HIGHER_LEVEL -> Rural Hospital, Sub-District Hospital, or CHC
  if (triageLevel === 'HIGHER_LEVEL') {
    const higherFac =
      facilities.find(
        (f) =>
          (f.type === 'Rural Hospital' || f.type === 'Sub-District Hospital' || f.type === 'CHC') &&
          f.taluka?.toLowerCase() === patientTaluka
      ) ||
      facilities.find(
        (f) => f.type === 'Rural Hospital' || f.type === 'Sub-District Hospital' || f.type === 'CHC'
      ) ||
      facilities.find((f) => f.type === 'District Hospital') ||
      facilities[0];

    const isSameTaluka = higherFac?.taluka?.toLowerCase() === patientTaluka;

    return {
      facility: higherFac,
      reason: {
        en: 'Equipped with specialist doctors, inpatient observation beds, diagnostic lab tests, and advanced medication supply.',
        hi: 'विशेषज्ञ डॉक्टर, भर्ती वार्ड, पैथोलॉजी लैब परीक्षण और दवाओं की पूरी व्यवस्था उपलब्ध है।',
        mr: 'विशेषज्ञ डॉक्टर, दाखल रुग्णांसाठी खाटा, प्रयोगशाळा चाचण्या आणि औषधोपचारांची सोय उपलब्ध आहे.'
      },
      distanceText: isSameTaluka ? '8.5 km away' : '18.0 km away',
      travelTimeText: isSameTaluka ? '~15-20 mins by bus/auto' : '~30-40 mins by bus/auto',
      doctorSummary: {
        name: higherFac?.id === 'fac-rh-khandala' ? 'Dr. Priya Salunkhe' : 'Dr. Smita Kadam',
        specialty: 'General Medicine & Specialist OPD'
      }
    };
  }

  // 3. PHC -> Primary Health Centre
  if (triageLevel === 'PHC') {
    const phcFac =
      facilities.find(
        (f) =>
          f.type === 'PHC' &&
          (f.taluka?.toLowerCase() === patientTaluka ||
            f.name.toLowerCase().includes(patientVillage) ||
            f.address?.toLowerCase().includes(patientVillage))
      ) ||
      facilities.find((f) => f.type === 'PHC' && f.taluka?.toLowerCase() === patientTaluka) ||
      facilities.find((f) => f.type === 'PHC') ||
      facilities[0];

    return {
      facility: phcFac,
      reason: {
        en: 'Nearest public primary healthcare centre with daily outpatient doctor consultations, essential free medicines, and basic blood/urine diagnostics.',
        hi: 'नजदीकी प्राथमिक स्वास्थ्य केंद्र जहां डॉक्टर परामर्श, मुफ्त आवश्यक दवाइयां और बुनियादी जांच उपलब्ध हैं।',
        mr: 'जवळचे प्राथमिक आरोग्य केंद्र जेथे दररोज बाह्यरुग्ण तपासणी, मोफत औषधे आणि मूलभूत चाचण्या उपलब्ध आहेत.'
      },
      distanceText: phcFac?.name?.toLowerCase().includes(patientVillage) ? '1.2 km away' : '2.4 km away',
      travelTimeText: '~8-12 mins by auto / walk',
      doctorSummary: {
        name: 'Dr. Anand Deshmukh',
        specialty: 'General Medicine & Public Health (OPD Room 2)'
      }
    };
  }

  // 4. SELF_CARE -> Local Sub-Centre or nearest PHC
  const scFac =
    facilities.find(
      (f) =>
        f.type === 'Sub-Centre' &&
        (f.name.toLowerCase().includes(patientVillage) || f.taluka?.toLowerCase() === patientTaluka)
    ) ||
    facilities.find((f) => f.type === 'Sub-Centre') ||
    facilities.find((f) => f.type === 'PHC') ||
    facilities[0];

  return {
    facility: scFac,
    reason: {
      en: 'Local village health post for routine vitals check, health monitoring, and personalized guidance from your village ASHA worker.',
      hi: 'नियमित स्वास्थ्य जांच और आशा कार्यकर्ता से परामर्श के लिए स्थानीय उप-केंद्र।',
      mr: 'नियमित आरोग्य तपासणी आणि आशा ताईंच्या सल्ल्यासाठी स्थानिक आरोग्य उपकेंद्र.'
    },
    distanceText: '0.8 km away',
    travelTimeText: '~5-8 mins walking',
    doctorSummary: {
      name: 'Asha Tai Shinde / Community Health Officer',
      specialty: 'Community Health & Primary Wellness'
    }
  };
}
