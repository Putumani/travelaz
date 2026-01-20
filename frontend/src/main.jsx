import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CurrencyProvider } from './context/CurrencyProvider';
import { LanguageProvider } from './context/LanguageProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CurrencyProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </CurrencyProvider>
    </BrowserRouter>
  </React.StrictMode>
);