import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './lang/fr.json';
import en from './lang/en.json';

const defaultLanguage = navigator.language.split(/[-_]/)[0];

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;