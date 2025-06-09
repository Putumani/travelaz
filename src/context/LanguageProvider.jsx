import { useState, useEffect } from 'react';
import { LanguageContext } from './LanguageContext';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en-US'); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('preferredLanguage');
      if (savedLang) setLanguage(savedLang);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}