import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { SupportedLanguage, translations, Translations } from '../i18n/translations';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'patient' | 'asha_worker' | 'doctor' | 'hospital' | 'admin';
  facility_id?: string | null;
  language: string;
}

interface DemoContextType {
  currentUser: User;
  patientProfile: any;
  isAuthenticated: boolean;
  activeFacilityId: string;
  setActiveFacilityId: (id: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
  lowLiteracyMode: boolean;
  setLowLiteracyMode: (val: boolean) => void;
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  offlineVisits: any[];
  addOfflineVisit: (visit: any) => void;
  syncOfflineVisits: () => Promise<number>;
  login: (role: string, identifier: string, passwordOrOtp?: string) => Promise<boolean>;
  loginWithPatientOtp: (patientId: string, otp: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
  currentView: string;
  setCurrentView: (view: string) => void;
  goBack: () => void;
  canGoBack: boolean;
  pendingFacilityType: string | null;
  setPendingFacilityType: (type: string | null) => void;
  pendingFocusedFacilityId: string | null;
  setPendingFocusedFacilityId: (id: string | null) => void;
  pendingInventoryFacilityId: string | null;
  setPendingInventoryFacilityId: (id: string | null) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (val: boolean) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  playAudioPrompt: (text: string, options?: { onStart?: () => void; onEnd?: () => void }) => void;
}



const defaultUser: User = {
  id: 'usr-patient-1',
  full_name: 'Meera Patil',
  email: 'meera.patil@example.com',
  phone: '9876543210',
  role: 'patient',
  language: 'mr'
};

const DemoContext = createContext<DemoContextType | null>(null);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('seva_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch {}
    return defaultUser;
  });

  const [patientProfile, setPatientProfile] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('seva_patient_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch {}
    return {
      id: 'pat-meera',
      full_name: 'Meera Patil',
      abha_id: '91-8834-2910-1029',
      village: 'Shirwal',
      taluka: 'Khandala',
      district: 'Satara',
      blood_group: 'B+',
      gender: 'F',
      age: 28
    };
  });

  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('swasthya_lang') as SupportedLanguage) || 'en';
  });

  const [lowLiteracyMode, setLowLiteracyModeState] = useState<boolean>(() => {
    return localStorage.getItem('swasthya_low_literacy') === 'true';
  });

  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineVisits, setOfflineVisits] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('swasthya_offline_visits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('seva_authenticated') === 'true';
  });

  const [activeFacilityId, setActiveFacilityId] = useState<string>('fac-dh-satara');
  const [currentView, setCurrentViewState] = useState<string>('citizen');
  // Tracks the sequence of views the user navigated through, so "Back" can
  // return to the screen they actually came from instead of a hardcoded root.
  const [viewHistory, setViewHistory] = useState<string[]>([]);

  // Wraps the raw view setter: every navigation to a *different* view pushes
  // the view being left onto the history stack, so goBack() can unwind it.
  const setCurrentView = (view: string) => {
    setCurrentViewState((prevView) => {
      if (prevView !== view) {
        setViewHistory((prevHistory) => [...prevHistory, prevView].slice(-20));
      }
      return view;
    });
  };

  const goBack = () => {
    setViewHistory((prevHistory) => {
      if (prevHistory.length === 0) {
        setCurrentViewState('citizen');
        return prevHistory;
      }
      const nextHistory = prevHistory.slice(0, -1);
      setCurrentViewState(prevHistory[prevHistory.length - 1]);
      return nextHistory;
    });
  };
  const [pendingFacilityType, setPendingFacilityType] = useState<string | null>(null);
  const [pendingFocusedFacilityId, setPendingFocusedFacilityId] = useState<string | null>(null);
  const [pendingInventoryFacilityId, setPendingInventoryFacilityId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync API auth headers whenever currentUser changes
  useEffect(() => {
    if (currentUser && currentUser.id) {
      const token = localStorage.getItem('seva_token') || `demo-token-${currentUser.id}`;
      api.setAuthHeaders(currentUser.role, currentUser.id, token);
    }
  }, [currentUser]);

  // Sync low literacy class with body
  useEffect(() => {
    if (lowLiteracyMode) {
      document.body.classList.add('low-literacy-mode');
    } else {
      document.body.classList.remove('low-literacy-mode');
    }
  }, [lowLiteracyMode]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('swasthya_lang', lang);
  };

  const setLowLiteracyMode = (val: boolean) => {
    setLowLiteracyModeState(val);
    localStorage.setItem('swasthya_low_literacy', String(val));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Resolves the browser's available speech voices, waiting once for the
  // async 'voiceschanged' event if the list isn't populated yet (a common
  // quirk on first call in Chromium-based browsers).
  const getSpeechVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      const existing = window.speechSynthesis.getVoices();
      if (existing.length > 0) {
        resolve(existing);
        return;
      }
      const handle = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handle);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener('voiceschanged', handle);
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handle);
        resolve(window.speechSynthesis.getVoices());
      }, 500);
    });
  };

  // Speaks `text` in the CURRENT application language. Always uses the live
  // `language` value at call time, so switching languages takes effect on
  // the very next announcement with no reload required.
  const playAudioPrompt = (text: string, options?: { onStart?: () => void; onEnd?: () => void }) => {
    if (!('speechSynthesis' in window)) {
      showToast(`[Audio Cue]: ${text}`, 'info');
      options?.onEnd?.();
      return;
    }

    // Stop any announcement already playing so speech never overlaps.
    window.speechSynthesis.cancel();

    const langTag = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

    getSpeechVoices().then((voices) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langTag;

      const langPrefix = langTag.split('-')[0].toLowerCase();
      const exactVoice = voices.find((v) => v.lang === langTag);
      const familyVoice = voices.find((v) => v.lang?.toLowerCase().startsWith(langPrefix));
      const chosenVoice = exactVoice || familyVoice;

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      } else if (voices.length === 0) {
        showToast('Audio voice is not available on this device.', 'info');
      }

      utterance.onstart = () => options?.onStart?.();
      utterance.onend = () => options?.onEnd?.();
      utterance.onerror = () => options?.onEnd?.();

      window.speechSynthesis.speak(utterance);
    });
  };

  const addOfflineVisit = (visit: any) => {
    const updated = [...offlineVisits, { ...visit, id: `offline-${Date.now()}` }];
    setOfflineVisits(updated);
    localStorage.setItem('swasthya_offline_visits', JSON.stringify(updated));
    showToast('Home visit saved offline. Ready to sync when online.', 'info');
  };

  const syncOfflineVisits = async (): Promise<number> => {
    if (offlineVisits.length === 0) return 0;
    try {
      const res = await api.syncOfflineVisits(offlineVisits);
      setOfflineVisits([]);
      localStorage.removeItem('swasthya_offline_visits');
      showToast(res.message || `Synchronized ${res.syncedCount} records`, 'success');
      return res.syncedCount || 0;
    } catch (err: any) {
      showToast('Failed to synchronize records: ' + err.message, 'error');
      return 0;
    }
  };

  const login = async (role: string, identifier: string, passwordOrOtp?: string): Promise<boolean> => {
    try {
      const res = await api.login(identifier, role, passwordOrOtp);
      setCurrentUser(res.user);
      localStorage.setItem('seva_current_user', JSON.stringify(res.user));

      if (res.patientProfile) {
        setPatientProfile(res.patientProfile);
        localStorage.setItem('seva_patient_profile', JSON.stringify(res.patientProfile));
      } else {
        setPatientProfile(null);
        localStorage.removeItem('seva_patient_profile');
      }

      const token = res.token || `demo-token-${res.user.id}`;
      localStorage.setItem('seva_token', token);
      api.setAuthHeaders(res.user.role, res.user.id, token);

      setIsAuthenticated(true);
      localStorage.setItem('seva_authenticated', 'true');
      showToast(`Welcome ${res.user.full_name}! Signed in successfully.`, 'success');

      // Fresh session: no prior screen to go "back" to.
      setViewHistory([]);

      // Direct redirection to role dashboard
      const targetRole = res.user?.role || role;
      if (targetRole === 'patient') setCurrentView('citizen');
      else if (targetRole === 'asha_worker') setCurrentView('frontline');
      else if (targetRole === 'doctor') setCurrentView('doctor');
      else if (targetRole === 'hospital') setCurrentView('hospital');
      else if (targetRole === 'admin') setCurrentView('admin');
      return true;
    } catch (err: any) {
      showToast('Authentication failed: ' + err.message, 'error');
      return false;
    }
  };

  const loginWithPatientOtp = async (patientId: string, otp: string): Promise<boolean> => {
    try {
      const res = await api.verifyPatientOtp(patientId, otp);
      setCurrentUser(res.user);
      localStorage.setItem('seva_current_user', JSON.stringify(res.user));

      if (res.patientProfile) {
        setPatientProfile(res.patientProfile);
        localStorage.setItem('seva_patient_profile', JSON.stringify(res.patientProfile));
      } else {
        setPatientProfile(null);
        localStorage.removeItem('seva_patient_profile');
      }

      const token = res.token || `demo-token-${res.user.id}`;
      localStorage.setItem('seva_token', token);
      api.setAuthHeaders(res.user.role, res.user.id, token);

      setIsAuthenticated(true);
      localStorage.setItem('seva_authenticated', 'true');
      showToast(`Welcome ${res.user.full_name}! Signed in successfully.`, 'success');
      setViewHistory([]);
      setCurrentView('citizen');
      return true;
    } catch (err: any) {
      showToast('OTP verification failed: ' + err.message, 'error');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsProfileOpen(false);
    localStorage.removeItem('seva_authenticated');
    localStorage.removeItem('seva_current_user');
    localStorage.removeItem('seva_patient_profile');
    localStorage.removeItem('seva_token');
    setCurrentUser(defaultUser);
    setPatientProfile(null);
    api.setAuthHeaders('patient', 'usr-patient-1', '');
    setViewHistory([]);
    showToast('Signed out of Seva Health platform.', 'info');
  };

  const switchRole = async (role: string) => {
    try {
      const res = await api.switchDemoRole(role);
      setCurrentUser(res.user);
      if (res.patientProfile) {
        setPatientProfile(res.patientProfile);
      }
      api.setAuthHeaders(res.user.role, res.user.id);
      showToast(`Switched active role to: ${res.user.role.toUpperCase()}`, 'success');
      setViewHistory([]);
      // Set appropriate initial view based on role
      if (role === 'patient') setCurrentView('citizen');
      else if (role === 'asha_worker') setCurrentView('frontline');
      else if (role === 'doctor') setCurrentView('doctor');
      else if (role === 'hospital') setCurrentView('hospital');
      else if (role === 'admin') setCurrentView('admin');
    } catch (err: any) {
      showToast('Error switching demo role: ' + err.message, 'error');
    }
  };

  const t = translations[language] || translations.en;

  return (
    <DemoContext.Provider
      value={{
        currentUser,
        patientProfile,
        isAuthenticated,
        activeFacilityId,
        setActiveFacilityId,
        language,
        setLanguage,
        t,
        lowLiteracyMode,
        setLowLiteracyMode,
        isOffline,
        setIsOffline,
        offlineVisits,
        addOfflineVisit,
        syncOfflineVisits,
        login,
        loginWithPatientOtp,
        logout,
        switchRole,
        currentView,
        setCurrentView,
        goBack,
        canGoBack: viewHistory.length > 0,
        pendingFacilityType,
        setPendingFacilityType,
        pendingFocusedFacilityId,
        setPendingFocusedFacilityId,
        pendingInventoryFacilityId,
        setPendingInventoryFacilityId,
        isProfileOpen,
        setIsProfileOpen,
        toast,
        showToast,
        playAudioPrompt
      }}
    >

      {children}
    </DemoContext.Provider>

  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
};
