import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { useTranslation } from '../i18n/useTranslation';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import LoadingSpinner from './LoadingSpinner';

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function ComparisonCard({ accommodation, isOpen, onClose }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  });
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [alternativeDates, setAlternativeDates] = useState([]);
  const { convertAmount, getCurrencySymbol } = useContext(CurrencyContext);
  const { t } = useTranslation();
  const isFetchingRef = useRef(false); 
  const lastFetchRef = useRef({ checkIn: null, checkOut: null, adults, children, rooms }); 

  const fetchPrices = useCallback(async () => {
    if (!isOpen || !accommodation || isFetchingRef.current) return;

    const currentParams = { checkIn: checkIn.toISOString().split('T')[0], checkOut: checkOut.toISOString().split('T')[0], adults, children, rooms };
    if (lastFetchRef.current.checkIn === currentParams.checkIn &&
        lastFetchRef.current.checkOut === currentParams.checkOut &&
        lastFetchRef.current.adults === currentParams.adults &&
        lastFetchRef.current.children === currentParams.children &&
        lastFetchRef.current.rooms === currentParams.rooms) {
      return; 
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    setAlternativeDates([]);

    try {
      const response = await fetch('http://localhost:5000/scrape-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          hotelName: accommodation.name,
          checkIn: currentParams.checkIn,
          checkOut: currentParams.checkOut,
          adults,
          children,
          rooms,
        }),
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        if (data.alternative_dates) {
          setAlternativeDates(data.alternative_dates);
          setError(t('noAvailabilityWithAlternatives'));
        } else {
          setError(data.error);
        }
        return;
      }

      const bookingDeal = {
        site_name: 'Booking.com',
        price: data.data.price,
        currency: data.data.currency,
        available: data.data.availability === 'Available' ? t('Available') : t('SoldOut'),
        affiliate_url: accommodation.booking_dot_com_affiliate_url,
        roomType: data.data.room_type,
      };

      setDeals([bookingDeal]);
      lastFetchRef.current = { ...currentParams }; // Update last fetched params
    } catch (err) {
      console.error('Fetch error:', err);
      setError(t('scrapingFailed'));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isOpen, accommodation, checkIn, checkOut, adults, children, rooms, t]);

  const debouncedFetchPrices = useCallback(debounce(fetchPrices, 1000), [fetchPrices]);

  const handleUpdateSearch = () => {
    if (!isFetchingRef.current) {
      debouncedFetchPrices();
    }
  };

  useEffect(() => {
    if (isOpen && !isFetchingRef.current) {
      debouncedFetchPrices();
    }
  }, [isOpen, debouncedFetchPrices]);

  const GuestControls = () => (
    <div className="grid grid-cols-3 gap-4 mt-2">
      <div>
        <label className="block text-sm">{t('Adults')}</label>
        <select
          value={adults}
          onChange={(e) => {
            setAdults(Number(e.target.value));
            handleUpdateSearch();
          }}
          className="w-full border rounded p-2"
        >
          {[1, 2, 3, 4].map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm">{t('Children')}</label>
        <select
          value={children}
          onChange={(e) => {
            setChildren(Number(e.target.value));
            handleUpdateSearch();
          }}
          className="w-full border rounded p-2"
        >
          {[0, 1, 2, 3].map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm">{t('Rooms')}</label>
        <select
          value={rooms}
          onChange={(e) => {
            setRooms(Number(e.target.value));
            handleUpdateSearch();
          }}
          className="w-full border rounded p-2"
        >
          {[1, 2, 3].map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const AlternativeDatesList = () => (
    <div className="mt-4">
      <h4 className="font-medium mb-2">{t('tryTheseDates')}:</h4>
      <div className="grid grid-cols-2 gap-2">
        {alternativeDates.map((alt, i) => (
          <div key={i} className="p-2 border rounded bg-gray-50">
            <div className="font-medium">{alt.dates}</div>
            <div className="text-sm">{alt.nights}</div>
            <div className="text-green-600 font-bold">
              {getCurrencySymbol()}
              {convertAmount(alt.price)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{accommodation.name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <div className="mb-6">
            <h4 className="font-medium mb-2">{t('selectDates')}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">{t('checkIn')}</label>
                <DatePicker
                  onChange={(date) => {
                    setCheckIn(date);
                    handleUpdateSearch();
                  }}
                  value={checkIn}
                  minDate={new Date()}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">{t('checkOut')}</label>
                <DatePicker
                  onChange={(date) => {
                    setCheckOut(date);
                    handleUpdateSearch();
                  }}
                  value={checkOut}
                  minDate={checkIn}
                  className="w-full"
                />
              </div>
            </div>
            <GuestControls />
            <button
              onClick={handleUpdateSearch}
              disabled={loading || isFetchingRef.current}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? <LoadingSpinner size="small" /> : t('updateSearch')}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-100">
              {error}
              {alternativeDates.length > 0 && <AlternativeDatesList />}
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">{t('availableDeals')}</h4>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : deals.length > 0 ? (
              deals
                .sort((a, b) => (a.price || 0) - (b.price || 0))
                .map((deal, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        {deal.site_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{deal.site_name}</div>
                        <div className="text-xs text-gray-500">{deal.available}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold mr-4">
                        {deal.currency || getCurrencySymbol()}
                        {convertAmount(deal.price)}
                      </span>
                      <a
                        href={deal.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800"
                      >
                        {t('viewDeal')}
                      </a>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-6 text-center text-gray-500">
                {t('noDealsAvailable')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonCard;