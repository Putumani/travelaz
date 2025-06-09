import { Link } from 'react-router-dom';
import { useState } from 'react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [currentCurrency, setCurrentCurrency] = useState('USD');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'th', name: 'Thai' }
  ];

  const currencies = [
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
  ];

  return (
    <header className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center relative">
        <Link to="/" className="text-xl sm:text-2xl font-bold mr-4">travelaz</Link>
        
        <nav className={`sm:flex ${isMenuOpen ? 'block' : 'hidden'} sm:block mx-auto`}>
          <ul className="flex flex-col sm:flex-row sm:space-x-6 p-4 sm:p-0">
            <li className="mb-2 sm:mb-0"><Link to="/" className="text-base sm:text-lg hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
            <li className="mb-2 sm:mb-0"><Link to="/durban" className="text-base sm:text-lg hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Durban</Link></li>
            <li className="mb-2 sm:mb-0"><Link to="/capetown" className="text-base sm:text-lg hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Cape Town</Link></li>
            <li className="mb-2 sm:mb-0"><Link to="/bangkok" className="text-base sm:text-lg hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Bangkok</Link></li>
          </ul>
        </nav>

        <div className="flex items-center ml-auto space-x-4">
          <button
            className="sm:hidden focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>

          <div className="relative hidden sm:block">
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
              <div className="absolute right-0 mt-2 w-32 bg-black border border-gray-700 rounded-md shadow-lg z-50">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${currentCurrency === currency.code ? 'text-gray-300' : ''}`}
                    onClick={() => {
                      setCurrentCurrency(currency.code);
                      setIsCurrencyOpen(false);
                    }}
                  >
                    {currency.code} ({currency.symbol})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative hidden sm:block">
            <button
              className="flex items-center text-sm hover:text-gray-300 focus:outline-none"
              onClick={() => {
                setIsLanguageOpen(!isLanguageOpen);
                setIsCurrencyOpen(false);
              }}
            >
              {currentLanguage}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-black border border-gray-700 rounded-md shadow-lg z-50">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${currentLanguage === language.name ? 'text-gray-300' : ''}`}
                    onClick={() => {
                      setCurrentLanguage(language.name);
                      setIsLanguageOpen(false);
                    }}
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
        <div className="relative w-1/2 pr-2">
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
            <div className="absolute left-0 right-0 mt-1 bg-black border border-gray-700 rounded-md shadow-lg z-50">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${currentCurrency === currency.code ? 'text-gray-300' : ''}`}
                  onClick={() => {
                    setCurrentCurrency(currency.code);
                    setIsCurrencyOpen(false);
                  }}
                >
                  {currency.code} ({currency.symbol})
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-1/2 pl-2">
          <button
            className="w-full flex justify-between items-center text-sm"
            onClick={() => {
              setIsLanguageOpen(!isLanguageOpen);
              setIsCurrencyOpen(false);
            }}
          >
            {currentLanguage}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isLanguageOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-black border border-gray-700 rounded-md shadow-lg z-50">
              {languages.map((language) => (
                <button
                  key={language.code}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${currentLanguage === language.name ? 'text-gray-300' : ''}`}
                  onClick={() => {
                    setCurrentLanguage(language.name);
                    setIsLanguageOpen(false);
                  }}
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