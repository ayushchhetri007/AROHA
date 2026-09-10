// Minimal client for Google's Gemini generateContent API, used to power the
// symptom-triage chatbot. Kept deliberately small: one function, structured
// JSON output only (no streaming, no multi-turn history server-side - the
// frontend sends the full combined symptom text each time).

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeminiTriageResult {
  triage_level: 'EMERGENCY' | 'HIGHER_LEVEL' | 'PHC' | 'SELF_CARE';
  emergency_flag: boolean;
  identified_symptoms: string[];
  recommendation: string;
  patient_message: string;
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    triage_level: { type: 'STRING', enum: ['EMERGENCY', 'HIGHER_LEVEL', 'PHC', 'SELF_CARE'] },
    emergency_flag: { type: 'BOOLEAN' },
    identified_symptoms: { type: 'ARRAY', items: { type: 'STRING' } },
    recommendation: { type: 'STRING' },
    patient_message: { type: 'STRING' }
  },
  required: ['triage_level', 'emergency_flag', 'identified_symptoms', 'recommendation', 'patient_message']
};

function systemPromptFor(language: 'en' | 'hi' | 'mr'): string {
  const languageName = language === 'mr' ? 'Marathi' : language === 'hi' ? 'Hindi' : 'English';
  return `You are a non-diagnostic clinical decision-support triage assistant for a rural Indian public healthcare app (Maharashtra). A patient describes their symptoms in free text and/or selects optional symptom tags. Your job:
1. Classify their care need into exactly one of these four levels: EMERGENCY (needs 108 ambulance / immediate casualty care - chest pain, severe breathing difficulty, unconsciousness/seizure, uncontrolled bleeding or sudden paralysis, or similarly acute red-flag presentations), HIGHER_LEVEL (persistent/multi-symptom or complicated by a chronic condition or pregnancy - needs a Rural/Sub-District Hospital or CHC), PHC (a common acute complaint like fever, cough, body ache, or mild gastro issue - needs a Primary Health Centre), or SELF_CARE (mild/isolated symptoms manageable at home with monitoring).
2. List the specific symptoms you identified from what the patient said, as short plain-language phrases (not medical jargon, not a diagnosis), written in ${languageName}.
3. Write "recommendation": one or two sentences, in ${languageName}, stating the appropriate facility tier and next step.
4. Write "patient_message": a warm, reassuring, non-alarming 2-3 sentence message to the patient, in ${languageName}, summarizing what you understood and why you're recommending this care level.
Never state or imply a specific disease diagnosis. Never invent symptoms the patient did not mention or select. If the input is empty or too vague to assess, default to PHC and ask them to describe their main symptom in the patient_message. Respond only in the given JSON schema.`;
}

/**
 * Calls Gemini with the patient's combined symptom text and returns a
 * structured triage result matching the app's existing TriageLevel /
 * emergency_flag contract, so downstream facility-matching and DB storage
 * (health_assessments.triage_level, .emergency_flag) work unchanged.
 */
export async function getGeminiTriage(
  symptomText: string,
  language: 'en' | 'hi' | 'mr' = 'en'
): Promise<GeminiTriageResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const body = {
    contents: [{ parts: [{ text: symptomText }] }],
    systemInstruction: { parts: [{ text: systemPromptFor(language) }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as any;
  const text = data?.candidates?.[0]?.content?.parts?.find((p: any) => typeof p.text === 'string')?.text;
  if (!text) {
    throw new Error('Gemini returned no usable response');
  }

  const parsed = JSON.parse(text) as GeminiTriageResult;
  const validLevels = ['EMERGENCY', 'HIGHER_LEVEL', 'PHC', 'SELF_CARE'];
  if (!validLevels.includes(parsed.triage_level)) {
    throw new Error('Gemini returned an invalid triage_level');
  }
  return parsed;
}
