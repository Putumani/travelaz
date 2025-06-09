import { useState, useEffect } from 'react';
import { CurrencyContext } from './CurrencyContext';

export function CurrencyProvider({ children }) {
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
      setCurrentCurrency(savedCurrency);
    }
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      const data = await response.json();
      setExchangeRates(data.rates || {});
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setExchangeRates({
        USD: 1,
        ZAR: 18.5,
        GBP: 0.79,
        EUR: 0.93,
        AUD: 1.52,
        THB: 33.5 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const convertAmount = (amount) => {
    if (currentCurrency === 'USD' || !amount) return amount;
    if (!exchangeRates[currentCurrency]) return amount;
    
    return (amount * exchangeRates[currentCurrency]).toFixed(2);
  };

  const getCurrencySymbol = () => {
    const symbols = {
      USD: '$',
      ZAR: 'R',
      GBP: '£',
      EUR: '€',
      AUD: 'A$',
      THB: '฿' 
    };
    return symbols[currentCurrency] || currentCurrency;
  };

  return (
    <CurrencyContext.Provider 
      value={{ 
        currentCurrency, 
        setCurrentCurrency,
        convertAmount,
        getCurrencySymbol,
        isLoading
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}