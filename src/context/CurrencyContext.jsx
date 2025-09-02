import React, { createContext, useContext } from 'react';

export const CurrencyContext = createContext();

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
