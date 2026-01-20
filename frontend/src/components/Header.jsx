import { Link } from 'react-router-dom';
import { useState, useContext, useEffect, useRef } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { LanguageContext } from '../context/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const { currentCurrency, setCurrentCurrency } = useContext(CurrencyContext);
  const { language: currentLanguage, setLanguage } = useContext(LanguageContext);
  const { t } = useTranslation();

  const languageDropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);
  const mobileLanguageDropdownRef = useRef(null);
  const mobileCurrencyDropdownRef = useRef(null);

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'EUR', name: 'Euro' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'THB', name: 'Thai Baht' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target) &&
        mobileLanguageDropdownRef.current &&
        !mobileLanguageDropdownRef.current.contains(event.target)
      ) {
        setIsLanguageOpen(false);
      }
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target) &&
        mobileCurrencyDropdownRef.current &&
        !mobileCurrencyDropdownRef.current.contains(event.target)
      ) {
        setIsCurrencyOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (language) => {
    setLanguage(language.code);
    setIsLanguageOpen(false);
    localStorage.setItem('preferredLanguage', language.code);
  };

  const handleCurrencyChange = (currency) => {
    setCurrentCurrency(currency.code);
    setIsCurrencyOpen(false);
    localStorage.setItem('preferredCurrency', currency.code);
  };

  return (
    <header className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center relative">
        <Link to="/" className="text-xl sm:text-2xl font-bold mr-4">
          travelaz
        </Link>

        <nav className={`sm:flex ${isMenuOpen ? 'block' : 'hidden'} sm:block mx-auto`}>
          <ul className="flex flex-col sm:flex-row sm:space-x-6 p-4 sm:p-0">
            <li className="mb-2 sm:mb-0">
              <Link
                to="/"
                className="text-base sm:text-lg hover:text-gray-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('Home')}
              </Link>
            </li>
            <li className="mb-2 sm:mb-0">
              <Link
                to="/durban"
                className="text-base sm:text-lg hover:text-gray-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('Durban')}
              </Link>
            </li>
            <li className="mb-2 sm:mb-0">
              <Link
                to="/capetown"
                className="text-base sm:text-lg hover:text-gray-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('CapeTown')}
              </Link>
            </li>
            <li className="mb-2 sm:mb-0">
              <Link
                to="/bangkok"
                className="text-base sm:text-lg hover:text-gray-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('Bangkok')}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center ml-auto space-x-4">
          <button
            className="sm:hidden focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>

          <div className="relative hidden sm:block" ref={currencyDropdownRef}>
            <button
              className="flex items-center text-sm hover:text-gray-300 focus:outline-none"
              onClick={() => {
                setIsCurrencyOpen(!isCurrencyOpen);
                setIsLanguageOpen(false);
              }}
            >
              {currentCurrency}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isCurrencyOpen && (
              <div
                className="absolute right-0 mt-2 w-40 bg-black border border-gray-700 rounded-md shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${
                      currentCurrency === currency.code ? 'text-gray-300' : ''
                    }`}
                    onClick={() => handleCurrencyChange(currency)}
                  >
                    {currency.code} - {currency.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative hidden sm:block" ref={languageDropdownRef}>
            <button
              className="flex items-center text-sm hover:text-gray-300 focus:outline-none"
              onClick={() => {
                setIsLanguageOpen(!isLanguageOpen);
                setIsCurrencyOpen(false);
              }}
            >
              {languages.find((l) => l.code === currentLanguage)?.name || 'Language'}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLanguageOpen && (
              <div
                className="absolute right-0 mt-2 w-40 bg-black border border-gray-700 rounded-md shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {languages.map((language) => (
                  <button
                    key={language.code}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${
                      currentLanguage === language.code ? 'text-gray-300' : ''
                    }`}
                    onClick={() => handleLanguageChange(language)}
                  >
                    {language.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sm:hidden bg-gray-900 px-4 py-2 flex justify-between">
        <div className="relative w-1/2 pr-2" ref={mobileCurrencyDropdownRef}>
          <button
            className="w-full flex justify-between items-center text-sm"
            onClick={() => {
              setIsCurrencyOpen(!isCurrencyOpen);
              setIsLanguageOpen(false);
            }}
          >
            {currentCurrency}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isCurrencyOpen && (
            <div
              className="absolute left-0 right-0 mt-1 bg-black border border-gray-700 rounded-md shadow-lg z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${
                    currentCurrency === currency.code ? 'text-gray-300' : ''
                  }`}
                  onClick={() => handleCurrencyChange(currency)}
                >
                  {currency.code} - {currency.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-1/2 pl-2" ref={mobileLanguageDropdownRef}>
          <button
            className="w-full flex justify-between items-center text-sm"
            onClick={() => {
              setIsLanguageOpen(!isLanguageOpen);
              setIsCurrencyOpen(false);
            }}
          >
            {languages.find((l) => l.code === currentLanguage)?.name || 'Language'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isLanguageOpen && (
            <div
              className="absolute left-0 right-0 mt-1 bg-black border border-gray-700 rounded-md shadow-lg z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {languages.map((language) => (
                <button
                  key={language.code}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${
                    currentLanguage === language.code ? 'text-gray-300' : ''
                  }`}
                  onClick={() => handleLanguageChange(language)}
                >
                  {language.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;