export async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    
    if (!data.rates || !data.rates[toCurrency]) {
      throw new Error('Invalid currency conversion');
    }
    
    const rate = data.rates[toCurrency];
    return (amount * rate).toFixed(2);
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw error;
  }
}

export function getCurrencySymbol(currencyCode) {
  const symbols = {
    USD: '$',
    ZAR: 'R',
    GBP: '£',
    AUD: 'A$',
    EUR: '€'
  };
  return symbols[currencyCode] || currencyCode;
}