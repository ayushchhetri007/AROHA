import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertTriangle, Loader2, X } from 'lucide-react';
import api from '../../api/client';
import { TriageLevel } from './triageEngine';

export interface GeminiTriageResult {
  triage_level: TriageLevel;
  emergency_flag: boolean;
  identified_symptoms: string[];
  recommendation: string;
  patient_message: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface SymptomSuggestion {
  id: string;
  label: { en: string; hi: string; mr: string };
}

const SYMPTOM_SUGGESTIONS: SymptomSuggestion[] = [
  { id: 'fever', label: { en: 'Fever', hi: 'बुखार', mr: 'ताप' } },
  { id: 'cough', label: { en: 'Cough', hi: 'खांसी', mr: 'खोकला' } },
  { id: 'headache', label: { en: 'Headache', hi: 'सिरदर्द', mr: 'डोकेदुखी' } },
  { id: 'body_ache', label: { en: 'Body Ache', hi: 'बदन दर्द', mr: 'अंगदुखी' } },
  { id: 'fatigue', label: { en: 'Fatigue', hi: 'थकान', mr: 'थकवा' } },
  { id: 'nausea', label: { en: 'Nausea', hi: 'जी मिचलाना', mr: 'मळमळ' } },
  { id: 'chest_pain', label: { en: 'Chest Pain', hi: 'सीने में दर्द', mr: 'छातीत दुखणे' } },
  { id: 'dizziness', label: { en: 'Dizziness', hi: 'चक्कर आना', mr: 'चक्कर येणे' } }
];

interface SymptomChatAssessmentProps {
  currentLang: 'en' | 'hi' | 'mr';
  onComplete: (result: GeminiTriageResult, reportedSymptomsText: string) => void;
}

// Replaces the old fixed 10-question Yes/No assessment. The patient picks
// zero or more optional symptom-tag suggestions and/or types their own
// description, then sends it to the real Gemini API (via the backend) for
// analysis. Gemini's structured response (triage_level/emergency_flag) maps
// directly onto the same contract the old Yes/No engine used to produce, so
// the facility-recommendation step downstream is untouched.
export const SymptomChatAssessment: React.FC<SymptomChatAssessmentProps> = ({ currentLang, onComplete }) => {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeminiTriageResult | null>(null);
  const [reportedSymptomsText, setReportedSymptomsText] = useState('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const canSend = !isSending && (selectedTagIds.length > 0 || inputText.trim().length > 0);

  const handleSend = async () => {
    if (!canSend) return;
    const trimmedText = inputText.trim();
    const tagLabels = selectedTagIds.map((id) => SYMPTOM_SUGGESTIONS.find((s) => s.id === id)?.label.en || id);

    const userDisplayParts: string[] = [];
    if (tagLabels.length > 0) userDisplayParts.push(tagLabels.join(', '));
    if (trimmedText) userDisplayParts.push(trimmedText);
    const userDisplayText = userDisplayParts.join(' — ');

    setMessages((prev) => [...prev, { role: 'user', text: userDisplayText }]);
    setSelectedTagIds([]);
    setInputText('');
    setIsSending(true);
    setError(null);

    try {
      const res = await api.getGeminiSymptomTriage(tagLabels, trimmedText, currentLang);
      setResult(res);
      setReportedSymptomsText(res.reportedSymptomsText || userDisplayText);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.patient_message }]);
    } catch (e: any) {
      setError(
        currentLang === 'mr'
          ? 'AI सहाय्यकापर्यंत पोहोचता आले नाही. कृपया पुन्हा प्रयत्न करा.'
          : currentLang === 'hi'
            ? 'AI सहायक तक नहीं पहुंच सके। कृपया पुनः प्रयास करें।'
            : e.message || 'Could not reach the AI assistant. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* SUGGESTED SYMPTOM SHORTCUTS - optional, not questions */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          {currentLang === 'mr' ? 'सुचवलेली लक्षणे (ऐच्छिक):' : currentLang === 'hi' ? 'सुझाए गए लक्षण (वैकल्पिक):' : 'Suggested Symptoms (Optional):'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {SYMPTOM_SUGGESTIONS.map((s) => {
            const selected = selectedTagIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleTag(s.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  border: selected ? '1.5px solid #0d9488' : '1.5px solid #cbd5e1',
                  background: selected ? '#0d9488' : '#ffffff',
                  color: selected ? '#ffffff' : '#334155',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {s.label[currentLang]}
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT TRANSCRIPT */}
      {messages.length > 0 && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '0.9rem',
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}
        >
          {messages.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '85%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  lineHeight: 1.45,
                  background: m.role === 'user' ? '#0d9488' : '#ffffff',
                  color: m.role === 'user' ? '#ffffff' : '#1e293b',
                  border: m.role === 'assistant' ? '1px solid #e2e8f0' : 'none'
                }}
              >
                {m.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#0d9488' }}>
                    <Sparkles size={12} />
                    <span>{currentLang === 'mr' ? 'AI सहाय्यक' : currentLang === 'hi' ? 'AI सहायक' : 'AI Assistant'}</span>
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {isSending && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.85rem', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
                <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                <span>{currentLang === 'mr' ? 'विचार करत आहे...' : currentLang === 'hi' ? 'सोच रहा है...' : 'Thinking...'}</span>
              </div>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      )}

      {/* SELECTED SYMPTOM CHIPS - shown above the chat input */}
      {selectedTagIds.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {selectedTagIds.map((id) => {
            const tag = SYMPTOM_SUGGESTIONS.find((s) => s.id === id);
            if (!tag) return null;
            return (
              <span
                key={id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  color: '#0f766e',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                {tag.label[currentLang]}
                <button
                  type="button"
                  onClick={() => toggleTag(id)}
                  aria-label={`Remove ${tag.label.en}`}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0f766e', display: 'flex', padding: 0 }}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* CHAT INPUT */}
      {!result && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              currentLang === 'mr'
                ? 'तुमची लक्षणे इथे टाइप करा...'
                : currentLang === 'hi'
                  ? 'अपने लक्षण यहाँ टाइप करें...'
                  : 'Type your symptoms here...'
            }
            disabled={isSending}
            style={{
              flex: 1,
              padding: '0.7rem 0.9rem',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.7rem 1.1rem',
              borderRadius: '10px',
              border: 'none',
              background: canSend ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : '#e2e8f0',
              color: canSend ? '#ffffff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: canSend ? 'pointer' : 'not-allowed'
            }}
          >
            <Send size={16} />
            <span>{currentLang === 'mr' ? 'पाठवा' : currentLang === 'hi' ? 'भेजें' : 'Send'}</span>
          </button>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309', fontSize: '0.82rem' }}>
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* IDENTIFIED SYMPTOMS + CONTINUE, once Gemini has responded */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {result.identified_symptoms.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                {currentLang === 'mr' ? 'ओळखलेली लक्षणे:' : currentLang === 'hi' ? 'पहचाने गए लक्षण:' : 'Symptoms Identified:'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {result.identified_symptoms.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      color: '#b45309',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.emergency_flag && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                background: '#fef2f2',
                border: '1.5px solid #fca5a5',
                borderRadius: '10px',
                padding: '0.75rem 0.9rem'
              }}
            >
              <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 600, lineHeight: 1.4 }}>
                {currentLang === 'mr'
                  ? 'हे तातडीचे लक्षण असू शकते. कृपया तातडीने वैद्यकीय मदत घ्या.'
                  : currentLang === 'hi'
                    ? 'यह एक आपातकालीन लक्षण हो सकता है। कृपया तुरंत चिकित्सा सहायता लें।'
                    : 'This may be an emergency symptom. Please seek immediate medical attention.'}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => onComplete(result, reportedSymptomsText)}
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              background: result.emergency_flag
                ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              fontSize: '0.98rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
            }}
          >
            {currentLang === 'mr'
              ? 'माझी आरोग्य शिफारस पहा →'
              : currentLang === 'hi'
                ? 'मेरी स्वास्थ्य सिफारिश देखें →'
                : 'View My Health Recommendation →'}
          </button>
        </div>
      )}
    </div>
  );
};
