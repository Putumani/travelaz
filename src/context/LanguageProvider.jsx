import { useState, useEffect } from 'react';
import { LanguageContext } from './LanguageContext';
import translations from '../i18n/translations'; 

const supportedLanguages = Object.keys(translations); 

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en-US');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('preferredLanguage');
      if (savedLang) {
        const normalizedLang = savedLang.split('-')[0]; 
        const selectedLang = supportedLanguages.includes(normalizedLang) ? normalizedLang : 'en-US';
        setLanguage(selectedLang);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', language);
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}