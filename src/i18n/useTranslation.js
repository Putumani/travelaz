import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import translations from './translations';

export function useTranslation() {
  const { language } = useContext(LanguageContext);

  const t = (key, params = {}) => {
    let text = translations[language]?.[key] || translations['en-US'][key] || key;

    Object.keys(params).forEach((param) => {
      text = text.replace(`{${param}}`, params[param]);
    });

    return text;
  };

  return { t };
}