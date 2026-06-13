import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';

const detectedLang = (() => {
  const lang = (navigator.languages?.[0] ?? navigator.language ?? 'en').slice(
    0,
    2,
  );
  return lang in { en: 1, ja: 1 } ? lang : 'en';
})();

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
  },
  lng: detectedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18next;
