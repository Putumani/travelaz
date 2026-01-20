// ErrorBoundary.jsx
import { useState, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';

export function ErrorBoundary({ children, fallback, onError }) {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  
  const handleRetry = () => {
    setError(null);
    if (onError) onError(null);
  };
  
  if (error) {
    if (fallback) {
      return fallback({ error, retry: handleRetry });
    }
    
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto mt-8">
        <h2 className="text-red-800 font-bold text-lg mb-2">
          {t('errorLoadingHotel', { defaultValue: 'Error loading hotel. Please try again later.' })}
        </h2>
        <p className="text-red-600 mb-4">
          {t('errorBoundaryMessage', { defaultValue: 'Something went wrong while loading this component.' })}
        </p>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          {t('tryAgain', { defaultValue: 'Try Again' })}
        </button>
        
        {/* Show error details in development mode */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-sm text-red-700">
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto text-xs">
              {error && error.toString()}
            </pre>
          </details>
        )}
      </div>
    );
  }
  
  return children;
}

export default ErrorBoundary;
