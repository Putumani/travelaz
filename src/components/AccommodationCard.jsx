import { useState, useContext, useEffect, useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import ComparisonCard from './ComparisonCard';
import { CurrencyContext } from '../context/CurrencyContext';
import { useTranslation } from '../i18n/useTranslation';
import ErrorBoundary from './ErrorBoundary'; 

function AccommodationCard({ accommodation }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [convertedPrice, setConvertedPrice] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const { convertAmount, getCurrencySymbol } = useContext(CurrencyContext);
  const { t } = useTranslation();
  const lastPriceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const currentPrice = accommodation?.price;

    if (lastPriceRef.current === currentPrice) {
      return;
    }

    const updatePrice = async () => {
      if (currentPrice != null && typeof currentPrice === 'number') {
        setIsLoadingPrice(true);
        try {
          const price = await convertAmount(currentPrice, 'USD');
          if (isMounted) {
            setConvertedPrice(price);
            lastPriceRef.current = currentPrice; 
          }
        } catch (error) {
          console.error('Error converting price:', error);
          if (isMounted) {
            setConvertedPrice(currentPrice.toFixed(2));
            lastPriceRef.current = currentPrice;
          }
        } finally {
          if (isMounted) {
            setIsLoadingPrice(false);
          }
        }
      } else {
        if (isMounted) {
          setConvertedPrice(null);
          lastPriceRef.current = currentPrice;
        }
      }
    };

    updatePrice();

    return () => {
      isMounted = false;
    };
  }, [accommodation?.price, convertAmount]); 

  const handleCardClick = () => {
    setIsPopupOpen(true);
  };

  const handleBookClick = (e) => {
    e.stopPropagation();
    setIsPopupOpen(true);
  };

  const comparisonCardFallback = ({ error, retry }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-red-800">
            {t('errorLoadingHotel', { defaultValue: 'Error loading hotel comparison' })}
          </h3>
          <button
            onClick={retry}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          {t('errorLoadingComparison', { defaultValue: 'We encountered an error while loading hotel prices. Please try again.' })}
        </p>
        <button
          onClick={retry}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          {t('tryAgain', { defaultValue: 'Try Again' })}
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-sm text-red-700">
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto text-xs">
              {error && error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );

  if (!accommodation || !accommodation.name) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 min-h-[300px] animate-pulse">
        <div className="h-40 bg-gray-200"></div>
        <div className="p-4 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded mt-3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 flex flex-col h-full">
      <div
        className="relative h-40 w-full bg-gray-100 cursor-pointer"
        onClick={handleCardClick}
      >
        <LazyLoadImage
          src={
            accommodation.image_url ||
            `https://via.placeholder.com/600x400?text=${encodeURIComponent(
              accommodation.name
            )}`
          }
          alt={accommodation.name}
          className="w-full h-full object-cover"
          effect="blur"
          width="100%"
          height="100%"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/600x400?text=${encodeURIComponent(
              accommodation.name
            )}`;
          }}
        />
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <h3
          className="text-lg font-semibold text-gray-900 mb-1 cursor-pointer line-clamp-1"
          onClick={handleCardClick}
        >
          {accommodation.name}
        </h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-1">
          {accommodation.description || t('noDescription', { defaultValue: 'No description available' })}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div>
            {isLoadingPrice ? (
              <p className="text-gray-900 font-medium animate-pulse">
                {t('loadingPrice', { defaultValue: 'Loading price...' })}
              </p>
            ) : (
              <p className="text-gray-900 font-medium">
                {convertedPrice ? (
                  <>
                    {getCurrencySymbol()}
                    {convertedPrice}
                    <span className="text-gray-500 text-sm"> {t('PerNight')}</span>
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">
                    {t('priceNotAvailable', { defaultValue: 'Price not available' })}
                  </span>
                )}
              </p>
            )}
            <div className="flex items-center">
              <span className="text-yellow-500">★</span>
              <span className="text-gray-700 ml-1 text-sm">
                {accommodation.rating || t('noRating', { defaultValue: 'N/A' })}
              </span>
            </div>
          </div>
          <button
            onClick={handleBookClick}
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded transition-colors"
            disabled={isLoadingPrice}
          >
            {t('BookNow')}
          </button>
        </div>
      </div>

      <ErrorBoundary
        fallback={comparisonCardFallback}
        onError={(error) => console.error('ComparisonCard error:', error)}
      >
        <ComparisonCard
          accommodation={accommodation}
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
        />
      </ErrorBoundary>
    </div>
  );
}

export default AccommodationCard;