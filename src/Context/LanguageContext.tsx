import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, LanguageContextType } from './translations/types';
import { TRANSLATIONS } from './translations/masterTranslations';
import { QUICK_MAP } from './translations/quickMapTranslations';
import { getUrduText } from './utils/translationHelpers';
import { useDomAutoTranslator } from './hooks/useDomAutoTranslator';

// Re-export types, dictionaries, and utility helpers for consumers and backwards compatibility
export type { Language, LanguageContextType };
export { TRANSLATIONS, QUICK_MAP, getUrduText };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uj_language');
      if (saved === 'ur' || saved === 'en') return saved;
    }
    return 'en';
  });

  const isRTL = language === 'ur';

  // Apply dir & lang attributes on <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (language === 'ur') {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'ur');
      document.body.classList.add('rtl-active');
    } else {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
      document.body.classList.remove('rtl-active');
    }
    localStorage.setItem('uj_language', language);
    window.dispatchEvent(new CustomEvent('uj_language_changed', { detail: { language } }));
  }, [language]);

  // Automated DOM Translator for Table Headers, Action Buttons, Filter Controls, Page Titles
  useDomAutoTranslator(language);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, defaultText?: string): string => {
    if (language === 'en') {
      const entry = TRANSLATIONS[key];
      return entry ? entry.en : defaultText || key;
    }
    // Language is Urdu
    const entry = TRANSLATIONS[key];
    if (entry) return entry.ur;
    return getUrduText(defaultText || key);
  };

  return (
    <LanguageContext.Provider value={{ language, isRTL, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
