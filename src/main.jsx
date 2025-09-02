import React from 'react';
import { HashRouter } from 'react-router-dom'; 
import ReactDOM from 'react-dom/client';
import { CurrencyProvider } from './context/CurrencyProvider';
import { LanguageProvider } from './context/LanguageProvider';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <CurrencyProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </CurrencyProvider>
    </HashRouter>
  </React.StrictMode>
);