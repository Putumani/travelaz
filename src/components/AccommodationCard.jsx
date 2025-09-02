import { useState, useContext, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import ComparisonCard from './ComparisonCard';
import { CurrencyContext } from '../context/CurrencyContext';
import { useTranslation } from '../i18n/useTranslation';

function AccommodationCard({ accommodation }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [convertedPrice, setConvertedPrice] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const { convertAmount, getCurrencySymbol } = useContext(CurrencyContext);
  const { t } = useTranslation();

  useEffect(() => {
    const updatePrice = async () => {
      if (accommodation?.price != null && typeof accommodation.price === 'number') {
        setIsLoadingPrice(true);
        try {
          const price = await convertAmount(accommodation.price, 'USD'); 
          setConvertedPrice(price);
        } catch (error) {
          console.error('Error converting price:', error);
          setConvertedPrice(accommodation.price.toFixed(2)); 
        } finally {
          setIsLoadingPrice(false);
        }
      } else {
        setConvertedPrice(null); 
      }
    };
    updatePrice();
  }, [accommodation, convertAmount]);

  const handleCardClick = () => {
    setIsPopupOpen(true);
  };

  const handleBookClick = (e) => {
    e.stopPropagation();
    setIsPopupOpen(true);
  };

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

      <ComparisonCard
        accommodation={accommodation}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </div>
  );
}

export default AccommodationCard; 