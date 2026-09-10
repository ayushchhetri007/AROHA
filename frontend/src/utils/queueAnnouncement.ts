import { SupportedLanguage } from '../i18n/translations';

export interface QueueAnnouncementData {
  tokenNumber: number;
  patientsAhead: number;
  counterRoom: string;
}

// Builds the spoken OPD queue announcement in the given application
// language. The CONTENT is translated, not just the voice - a caller must
// never speak this in the wrong language relative to `language`.
export function buildQueueAnnouncement(language: SupportedLanguage, data: QueueAnnouncementData): string {
  const { tokenNumber, patientsAhead, counterRoom } = data;

  if (language === 'mr') {
    return `तुमचा टोकन क्रमांक ${tokenNumber} आहे. तुमच्यापुढे ${patientsAhead} रुग्ण आहेत. कृपया ${counterRoom} मध्ये या.`;
  }

  if (language === 'hi') {
    return `आपका टोकन नंबर ${tokenNumber} है। आपसे पहले ${patientsAhead} मरीज़ हैं। कृपया ${counterRoom} में जाएं।`;
  }

  return `Your token number is ${tokenNumber}. There are ${patientsAhead} patients ahead of you. Please proceed to ${counterRoom}.`;
}
