import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';

const resources = {
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
};

// Sprache aus localStorage lesen, sonst 'de'
const savedLang = localStorage.getItem('language') || 'de';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Sprache bei Wechsel in localStorage speichern
// (Das muss im Profil/Settings beim Wechsel gemacht werden)

export default i18n; 