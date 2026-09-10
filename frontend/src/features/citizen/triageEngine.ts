/**
 * Seva Health - Digital Health Assessment & Triage Decision-Support Engine
 * 
 * Rural Healthcare Guidance:
 * Evaluates patient-reported symptoms through structured YES/NO screening.
 * Does NOT diagnose illnesses (maintains strict decision-support disclaimers).
 * Categorizes responses into:
 *  - 🟢 SELF_CARE: Minor/transient complaints -> active home monitoring & ASHA follow-up
 *  - 🟡 PHC: Common acute illness -> nearest Primary Health Centre / Ayushman Arogya Mandir
 *  - 🟠 HIGHER_LEVEL: Persistent, multi-symptom, or high-risk -> CHC / Rural / Sub-District Hospital
 *  - 🔴 EMERGENCY: Acute red flags -> immediate 108 ambulance & 24/7 casualty hospital
 */

export type TriageLevel = 'SELF_CARE' | 'PHC' | 'HIGHER_LEVEL' | 'EMERGENCY';

export interface TriageQuestion {
  id: string;
  name: string;
  category: 'general' | 'respiratory' | 'gastro' | 'chronic' | 'red_flag';
  isEmergencyRedFlag: boolean;
  questionText: {
    en: string;
    hi: string;
    mr: string;
  };
  subText: {
    en: string;
    hi: string;
    mr: string;
  };
}

export const TRIAGE_QUESTIONS: TriageQuestion[] = [
  // 1. Common General Symptom
  {
    id: 'fever',
    name: 'Fever or Chills',
    category: 'general',
    isEmergencyRedFlag: false,
    questionText: {
      en: 'Do you have a fever, chills, or high body temperature?',
      hi: 'क्या आपको बुखार, ठंड लगना या तेज शरीर का तापमान है?',
      mr: 'तुम्हाला ताप, थंडी वाजून येणे किंवा अंग गरम असण्याचा त्रास आहे का?'
    },
    subText: {
      en: 'Warm forehead, shivering, or feeling unusually hot',
      hi: 'माथा गरम होना, कंपकंपी या अत्यधिक गर्मी लगना',
      mr: 'कपाळ गरम असणे, हुडहुडी भरणे किंवा अंगात उष्णता जाणवणे'
    }
  },
  // 2. Mild Respiratory
  {
    id: 'respiratory_mild',
    name: 'Cough, Cold, or Sore Throat',
    category: 'respiratory',
    isEmergencyRedFlag: false,
    questionText: {
      en: 'Do you have a cough, cold, runny nose, or sore throat?',
      hi: 'क्या आपको खांसी, जुकाम, बहती नाक या गले में खराश है?',
      mr: 'तुम्हाला खोकला, सर्दी, नाक वाहणे किंवा घसा खवखवण्याचा त्रास आहे का?'
    },
    subText: {
      en: 'Throat irritation, frequent sneezing, dry or productive cough',
      hi: 'गले में जलन, बार-बार छींकें, सूखी या बलगम वाली खांसी',
      mr: 'घशात खवखव, वारंवार शिंका, कोरडा किंवा कफयुक्त खोकला'
    }
  },
  // 3. Body Ache & Fatigue
  {
    id: 'body_ache_fatigue',
    name: 'Headache, Body Ache, or Fatigue',
    category: 'general',
    isEmergencyRedFlag: false,
    questionText: {
      en: 'Do you have a headache, severe body ache, or feeling very weak?',
      hi: 'क्या आपको सिरदर्द, शरीर में तेज दर्द या बहुत अधिक कमजोरी है?',
      mr: 'तुम्हाला डोकेदुखी, तीव्र अंगदुखी किंवा खूप जास्त अशक्तपणा जाणवत आहे का?'
    },
    subText: {
      en: 'Muscle soreness, difficulty doing daily chores, feeling exhausted',
      hi: 'मांसपेशियों में दर्द, दैनिक काम करने में असमर्थता, थकान',
      mr: 'स्नायू दुखणे, रोजची कामे करताना थकवा येणे'
    }
  },
  // 4. Mild Gastrointestinal
  {
    id: 'gastro_mild',
    name: 'Stomach Pain, Diarrhea, or Nausea',
    category: 'gastro',
    isEmergencyRedFlag: false,
    questionText: {
      en: 'Do you have stomach pain, loose motions, or nausea/vomiting?',
      hi: 'क्या आपको पेट दर्द, दस्त, या उल्टी/जी मिचलाने की समस्या है?',
      mr: 'तुम्हाला पोटदुखी, पातळ जुलाब किंवा मळमळ/उलट्यांचा त्रास होत आहे का?'
    },
    subText: {
      en: 'Abdominal cramps, repeated loose stools, or nausea',
      hi: 'पेट में मरोड़, बार-बार दस्त होना या उल्टी की इच्छा',
      mr: 'पोटात मुरडा येणे, वारंवार शौचास होणे किंवा उलटीचा त्रास'
    }
  },
  // 5. Symptom Duration
  {
    id: 'duration_persistent',
    name: 'Symptoms Lasting More Than 3-5 Days',
    category: 'general',
    isEmergencyRedFlag: false,
    questionText: {
      en: 'Have your symptoms lasted for more than 3 to 5 days without relief?',
      hi: 'क्या आपके लक्षण 3 से 5 दिनों से अधिक समय से लगातार बने हुए हैं?',
      mr: 'तुमची ही लक्षणे ३ ते ५ दिवसांपेक्षा जास्त काळ सतत टिकून आहेत का?'
    },
    subText: {
      en: 'Persistent illness that is not resolving with home care',
      hi: 'ऐसी बीमारी जो घरेलू देखभाल से ठीक नहीं हो रही',
      mr: 'घरगुती काळजी घेऊनही आराम न पडणारा आजार'
    }
  },
  // 6. Chronic Risk Factors
  {
    id: 'chronic_condition',
    name: 'Chronic Condition or Pregnancy',
    category: 'chronic',
    isEmergencyRedFlag: false,
    questionText: {
      en: 'Do you have diabetes, high BP, asthma, or is the patient pregnant?',
      hi: 'क्या आपको मधुमेह, उच्च रक्तचाप, दमा है या मरीज गर्भवती है?',
      mr: 'तुम्हाला मधुमेह, उच्च रक्तदाब, दमा आहे का किंवा रुग्ण गरोदर आहे का?'
    },
    subText: {
      en: 'Known pre-existing medical conditions needing careful monitoring',
      hi: 'पहले से मौजूद पुरानी बीमारियां जिनकी निगरानी जरूरी है',
      mr: 'आधीपासून असलेले जुनाट आजार ज्यांची विशेष काळजी घेणे आवश्यक आहे'
    }
  },
  // 7. Emergency Red Flag: Chest Pain
  {
    id: 'chest_pain',
    name: 'Severe Chest Pain or Pressure',
    category: 'red_flag',
    isEmergencyRedFlag: true,
    questionText: {
      en: 'Do you have sudden, severe crushing chest pain or tightness?',
      hi: 'क्या आपके सीने में अचानक तेज असहनीय दर्द, भारीपन या दबाव है?',
      mr: 'तुमच्या छातीत अचानक तीव्र असह्य दुखणे, जडपणा किंवा दाब जाणवत आहे का?'
    },
    subText: {
      en: 'Pain spreading to left arm, neck, or jaw with heavy sweating',
      hi: 'दर्द जो बाएं हाथ, गर्दन या जबड़े में फैले और पसीना आए',
      mr: 'डाव्या हाताकडे, मानेकडे किंवा जबड्याकडे जाणारी तीव्र वेदना'
    }
  },
  // 8. Emergency Red Flag: Severe Breathing Distress
  {
    id: 'breathing_distress',
    name: 'Severe Difficulty Breathing',
    category: 'red_flag',
    isEmergencyRedFlag: true,
    questionText: {
      en: 'Are you having severe difficulty breathing or gasping for air?',
      hi: 'क्या आपको सांस लेने में गंभीर तकलीफ हो रही है या सांस फूल रही है?',
      mr: 'तुम्हाला श्वास घेण्यास खूप तीव्र त्रास होत आहे किंवा धाप लागत आहे का?'
    },
    subText: {
      en: 'Unable to speak full sentences, blueish lips, or severe wheezing',
      hi: 'पूरा वाक्य बोलने में असमर्थ, होंठ नीले पड़ना या घरघराहट',
      mr: 'सलग बोलता न येणे, ओठ निळसर पडणे किंवा छातीत घरघर'
    }
  },
  // 9. Emergency Red Flag: Loss of Consciousness or Seizure
  {
    id: 'fainting_seizure',
    name: 'Unconsciousness, Fainting, or Seizures',
    category: 'red_flag',
    isEmergencyRedFlag: true,
    questionText: {
      en: 'Did the patient faint, lose consciousness, or have seizures/fits?',
      hi: 'क्या मरीज बेहोश हुआ, चक्कर खाकर गिरा या दौरा/झटके आए?',
      mr: 'रुग्ण बेशुद्ध पडला, चक्कर येऊन कोसळला किंवा फेफरे/आचके आले का?'
    },
    subText: {
      en: 'Unresponsive state, blackout, or uncontrolled shaking',
      hi: 'बेहोशी की हालत, होश खोना या शरीर का कांपना',
      mr: 'शुद्ध हरपणे, डोळ्यांसमोर अंधारी येऊन पडणे किंवा झटके येणे'
    }
  },
  // 10. Emergency Red Flag: Uncontrolled Bleeding or Sudden Paralysis
  {
    id: 'bleeding_paralysis',
    name: 'Severe Bleeding or Sudden Paralysis',
    category: 'red_flag',
    isEmergencyRedFlag: true,
    questionText: {
      en: 'Is there severe uncontrolled bleeding or sudden weakness on one side?',
      hi: 'क्या तेज न रुकने वाला रक्तस्राव है या शरीर के एक तरफ अचानक कमजोरी/लकवा है?',
      mr: 'न थांबणारा तीव्र रक्तस्त्राव किंवा एका बाजूला अचानक अर्धांगवायू/अशक्तपणा आहे का?'
    },
    subText: {
      en: 'Deep wound bleeding continuously, facial drooping, or slurred speech',
      hi: 'लगातार बहता खून, मुंह का टेढ़ा होना या आवाज लड़खड़ाना',
      mr: 'सतत वाहणारे रक्त, तोंड एका बाजूला वळणे किंवा बोलताना अडखळणे'
    }
  }
];

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
  summary: {
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
  actionGuidance: {
    en: string;
    hi: string;
    mr: string;
  };
  isEmergency: boolean;
  emergencyTriggeredId?: string;
}

/**
 * Pure Triage Evaluation Engine
 * Rules:
 *  1. Any emergency red flag (Q7-Q10) answered YES -> EMERGENCY CARE
 *  2. If symptoms have lasted >3-5 days combined with fever/gastro/chronic -> HIGHER_LEVEL (CHC / Rural Hospital)
 *  3. If chronic conditions exist alongside acute complaints -> HIGHER_LEVEL
 *  4. If fever, respiratory, body ache, or gastro complaints exist -> PHC (Primary Health Centre)
 *  5. If all NO, or only isolated mild body ache/headache without fever/duration -> SELF_CARE (Monitor & Rest)
 */
export function evaluateTriage(answers: Record<string, boolean>): TriageResult {
  // Check Emergency Red Flags
  const redFlags = ['chest_pain', 'breathing_distress', 'fainting_seizure', 'bleeding_paralysis'];
  const triggeredRedFlag = redFlags.find((rf) => answers[rf] === true);

  if (triggeredRedFlag) {
    return {
      category: 'EMERGENCY',
      badgeColor: '#b45309',
      badgeBg: '#fffaf0',
      badgeBorder: '#d97706',
      isEmergency: true,
      emergencyTriggeredId: triggeredRedFlag,
      title: {
        en: 'URGENT EMERGENCY CARE',
        hi: 'तातडीची वैद्यकीय मदत / आपत्कालीन सेवा',
        mr: 'तातडीची आपत्कालीन वैद्यकीय सेवा आवश्यक'
      },
      summary: {
        en: 'Your responses indicate a potentially serious symptom requiring immediate clinical intervention and stabilization.',
        hi: 'आपके उत्तर से एक गंभीर लक्षण का संकेत मिलता है जिसके लिए तुरंत चिकित्सीय सहायता और स्थिरीकरण आवश्यक है।',
        mr: 'तुमच्या उत्तरांवरून तातडीने वैद्यकीय तपासणी आणि उपचारांची गरज असल्याचे गंभीर लक्षण दिसून येत आहे.'
      },
      recommendedCareLevel: {
        en: '24/7 Emergency Casualty / District Hospital',
        hi: '24/7 आपातकालीन विभाग / जिला अस्पताल',
        mr: '२४/७ आपत्कालीन विभाग / जिल्हा रुग्णालय'
      },
      recommendedFacilityType: 'District Hospital',
      actionGuidance: {
        en: 'Call 108 immediately for free emergency ambulance transport or proceed straight to the nearest 24/7 emergency facility.',
        hi: 'मुफ्त आपातकालीन एम्बुलेंस के लिए तुरंत 108 पर कॉल करें या सीधे नजदीकी 24/7 अस्पताल जाएं।',
        mr: 'मोफत रुग्णवाहिकेसाठी ताबडतोब १०८ वर कॉल करा किंवा जवळच्या २४/७ आपत्कालीन रुग्णालयात त्वरित जा.'
      }
    };
  }

  const hasFever = answers.fever === true;
  const hasRespiratory = answers.respiratory_mild === true;
  const hasBodyAche = answers.body_ache_fatigue === true;
  const hasGastro = answers.gastro_mild === true;
  const isPersistent = answers.duration_persistent === true;
  const hasChronic = answers.chronic_condition === true;

  const acuteCount = [hasFever, hasRespiratory, hasBodyAche, hasGastro].filter(Boolean).length;

  // Check Higher-Level Facility Escalation
  // Condition: Persistent >3-5 days with fever/gastro, or multiple acute symptoms with chronic condition/pregnancy
  if (
    (isPersistent && (hasFever || hasGastro || hasRespiratory)) ||
    (hasChronic && acuteCount >= 2) ||
    (hasFever && hasGastro && isPersistent)
  ) {
    return {
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
      summary: {
        en: 'Your responses indicate prolonged symptoms, multiple complaints, or pre-existing health factors that warrant comprehensive evaluation by specialist doctors.',
        hi: 'आपके लक्षण लंबे समय से हैं या पुरानी बीमारी के साथ हैं, जिसके लिए विशेषज्ञ डॉक्टर द्वारा व्यापक जांच और परीक्षण की आवश्यकता है।',
        mr: 'तुमची लक्षणे दीर्घकाळापासून आहेत किंवा जुनाट आजाराशी संबंधित आहेत, ज्यासाठी तज्ज्ञ डॉक्टरांकडून सविस्तर तपासणीची गरज आहे.'
      },
      recommendedCareLevel: {
        en: 'Rural Hospital / Sub-District Hospital / CHC',
        hi: 'ग्रामीण अस्पताल / उप-जिला अस्पताल / सीएचसी',
        mr: 'ग्रामीण रुग्णालय / उप-जिल्हा रुग्णालय / सीएचसी'
      },
      recommendedFacilityType: 'Rural Hospital',
      actionGuidance: {
        en: 'Visit a Rural Hospital or Sub-District Hospital equipped with diagnostic pathology, radiology, and Medical Officers.',
        hi: 'पैथोलॉजी लैब और विशेषज्ञ डॉक्टरों से सुसज्जित ग्रामीण या उप-जिला अस्पताल में जाएं।',
        mr: 'प्रयोगशाळा चाचण्या आणि वैद्यकीय अधिकारी उपलब्ध असलेल्या ग्रामीण किंवा उप-जिल्हा रुग्णालयास भेट द्या.'
      }
    };
  }

  // Check Primary Health Centre (PHC)
  // Condition: Any common acute complaint (fever, cough, body ache, gastro)
  if (hasFever || hasRespiratory || hasGastro || (hasBodyAche && isPersistent)) {
    return {
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
      summary: {
        en: 'Based on your reported symptoms, we recommend evaluation at a Primary Health Centre (PHC) or Ayushman Arogya Mandir for examination by a Medical Officer and essential medications.',
        hi: 'आपके बताए गए लक्षणों के आधार पर, हम डॉक्टर से जांच और आवश्यक दवाओं के लिए नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) जाने की सलाह देते हैं।',
        mr: 'तुम्ही नोंदवलेल्या लक्षणांनुसार, वैद्यकीय अधिकाऱ्यांकडून तपासणी आणि मोफत औषधोपचारासाठी प्राथमिक आरोग्य केंद्रास (PHC) भेट देण्याची शिफारस आहे.'
      },
      recommendedCareLevel: {
        en: 'Primary Health Centre (PHC) / Ayushman Arogya Mandir',
        hi: 'प्राथमिक स्वास्थ्य केंद्र (PHC) / आयुष्मान आरोग्य मंदिर',
        mr: 'प्राथमिक आरोग्य केंद्र (PHC) / आयुष्मान आरोग्य मंदिर'
      },
      recommendedFacilityType: 'PHC',
      actionGuidance: {
        en: 'Consult the on-duty Medical Officer at your local PHC. Essential medications and basic diagnostics are available free of cost.',
        hi: 'अपने स्थानीय पीएचसी में उपस्थित डॉक्टर से परामर्श लें। आवश्यक दवाइयां और बुनियादी जांच मुफ्त उपलब्ध हैं।',
        mr: 'स्थानिक प्राथमिक आरोग्य केंद्रातील वैद्यकीय अधिकाऱ्यांचा सल्ला घ्या. मोफत औषधे आणि प्राथमिक तपासण्या उपलब्ध आहेत.'
      }
    };
  }

  // Default: Self-Care & Active Monitoring
  return {
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
    summary: {
      en: 'Your responses indicate mild or non-acute symptoms. Rest adequately, stay well-hydrated, and practice active home care.',
      hi: 'आपके लक्षण हल्के हैं और किसी गंभीर समस्या का संकेत नहीं है। पर्याप्त आराम करें, स्वच्छ पानी पिएं और घर पर देखभाल करें।',
      mr: 'तुमची लक्षणे सौम्य आहेत आणि कोणताही धोकादायक संकेत नाही. पुरेशी विश्रांती घ्या, भरपूर पाणी प्या आणि काळजी घ्या.'
    },
    recommendedCareLevel: {
      en: 'Home Self-Care & Local Sub-Centre / ASHA Support',
      hi: 'घरेलू देखभाल एवं स्थानीय उप-केंद्र / आशा कार्यकर्ता संपर्क',
      mr: 'घरगुती काळजी आणि स्थानिक उपकेंद्र / आशा ताईंशी संपर्क'
    },
    recommendedFacilityType: 'Sub-Centre',
    actionGuidance: {
      en: 'Monitor your temperature and hydration. If symptoms worsen or persist beyond 48 hours, consult your village ASHA worker or visit the nearest PHC.',
      hi: 'अपने स्वास्थ्य पर नजर रखें। यदि लक्षण 48 घंटों के बाद भी बने रहें या बढ़ें, तो आशा ताई या नजदीकी पीएचसी से संपर्क करें।',
      mr: 'शरीराच्या तापमानावर लक्ष ठेवा. ४८ तासांनंतरही त्रास राहिल्यास किंवा वाढल्यास गावातील आशा ताई किंवा जवळच्या प्राथमिक आरोग्य केंद्राचा सल्ला घ्या.'
    }
  };
}

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
