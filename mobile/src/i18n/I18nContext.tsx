import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { translations, Language } from './translations';
import { DEFAULT_LANGUAGE } from '../config/constants';

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: typeof translations.fr;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE as Language);

  useEffect(() => {
    // Charger la langue sauvegardée
    SecureStore.getItemAsync('language').then((savedLang) => {
      if (savedLang && (savedLang === 'fr' || savedLang === 'en')) {
        setLanguageState(savedLang);
      }
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await SecureStore.setItemAsync('language', lang);
  };

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
