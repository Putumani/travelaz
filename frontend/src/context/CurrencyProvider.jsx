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
  }, [currentCurrency]);

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

  const convertAmount = (amount, fromCurrency = 'USD') => {
    if (!amount || isNaN(amount) || fromCurrency === currentCurrency || !exchangeRates[fromCurrency] || !exchangeRates[currentCurrency]) {
      console.log(`Conversion skipped: amount=${amount}, from=${fromCurrency}, to=${currentCurrency}, rates=${JSON.stringify(exchangeRates)}`);
      return amount ? amount.toFixed(2) : '0.00';
    }
    const usdRateFrom = 1 / exchangeRates[fromCurrency]; // Convert fromCurrency to USD
    const usdRateTo = exchangeRates[currentCurrency];   // Convert USD to currentCurrency
    const amountInUSD = amount * usdRateFrom;
    const convertedAmount = amountInUSD * usdRateTo;
    if (isNaN(convertedAmount) || !isFinite(convertedAmount)) {
      console.error(`Invalid conversion: amount=${amount}, from=${fromCurrency}, to=${currentCurrency}, result=${convertedAmount}`);
      return amount.toFixed(2); // Fallback to original amount
    }
    console.log(`Converting ${amount} ${fromCurrency} to ${currentCurrency}: ${convertedAmount.toFixed(2)} (USD rate: ${usdRateFrom}, ${currentCurrency} rate: ${usdRateTo})`);
    return convertedAmount.toFixed(2);
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