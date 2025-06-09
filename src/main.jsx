// src/main.jsx (or App.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
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