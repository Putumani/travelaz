import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { useTranslation } from '../i18n/useTranslation';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import LoadingSpinner from './LoadingSpinner';
import InputNumber from 'rc-input-number';
import 'rc-input-number/assets/index.css'; // Import default styles

function formatDateToLocal(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ComparisonCard({ accommodation, isOpen, onClose }) {
  const [deals, setDeals] = useState([]);
  const [originalDeals, setOriginalDeals] = useState([]);
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
  const [originalAltDates, setOriginalAltDates] = useState([]);
  const { convertAmount, getCurrencySymbol, currentCurrency } = useContext(CurrencyContext);
  const { t } = useTranslation();
  const isFetchingRef = useRef(false);
  const hasInitialFetchRef = useRef(false);

  const fetchPrices = useCallback(async () => {
    if (!isOpen || !accommodation || isFetchingRef.current) return;

    const checkInStr = formatDateToLocal(checkIn);
    const checkOutStr = formatDateToLocal(checkOut);

    console.log('Sending dates:', { checkIn: checkInStr, checkOut: checkOutStr });

    const currentParams = {
      checkIn: checkInStr,
      checkOut: checkOutStr,
      adults,
      children,
      rooms,
    };

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    setAlternativeDates([]);
    setDeals([]);
    setOriginalDeals([]);
    setOriginalAltDates([]);

    try {
      if (!accommodation.booking_dot_com_affiliate_url) {
        throw new Error("No Booking.com URL available for this hotel");
      }

      const response = await fetch('http://localhost:5000/scrape-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          hotelUrl: accommodation.booking_dot_com_affiliate_url,
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
      console.log('Received response:', data); 

      if (data.error) {
        if (data.alternative_dates) {
          const convertedAltDates = await Promise.all(
            data.alternative_dates.map(async (alt) => {
              const totalPrice = (alt.price || 0) + (alt.taxes || 0);
              const convertedPrice = await convertAmount(totalPrice, alt.currency || data.data?.currency || 'USD');
              return {
                ...alt,
                price: parseFloat(convertedPrice),
              };
            })
          );
          const originalAlt = data.alternative_dates.map(alt => ({
            ...alt,
            price: (alt.price || 0) + (alt.taxes || 0),
            currency: alt.currency || data.data?.currency || 'USD',
          }));
          setAlternativeDates(convertedAltDates);
          setOriginalAltDates(originalAlt);
          setError(t('noAvailabilityWithAlternatives'));
        } else {
          setError(data.error);
        }
        return;
      }

      const totalPrice = (data.data.price || 0) + (data.data.taxes || 0);
      const convertedPrice = await convertAmount(totalPrice, data.data.currency || 'USD');

      const bookingDeal = {
        site_name: 'Booking.com',
        price: parseFloat(convertedPrice),
        currency: currentCurrency,
        available: data.data.availability === 'Available' ? t('Available') : t('SoldOut'),
        affiliate_url: data.data.source_url || accommodation.booking_dot_com_affiliate_url,
        roomType: data.data.room_type,
      };
      const originalDeal = {
        site_name: 'Booking.com',
        price: totalPrice,
        currency: data.data.currency || 'USD',
        available: data.data.availability === 'Available' ? t('Available') : t('SoldOut'),
        affiliate_url: data.data.source_url || accommodation.booking_dot_com_affiliate_url,
        roomType: data.data.room_type,
      };

      setDeals([bookingDeal]);
      setOriginalDeals([originalDeal]);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || t('scrapingFailed'));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isOpen, accommodation, checkIn, checkOut, adults, children, rooms, t, currentCurrency, convertAmount]);

  useEffect(() => {
    if (isOpen && !hasInitialFetchRef.current) {
      hasInitialFetchRef.current = true;
      fetchPrices();
    }
  }, [isOpen, fetchPrices]);

  useEffect(() => {
    if ((deals.length > 0 || alternativeDates.length > 0) && originalDeals.length > 0 && originalAltDates.length >= 0) {
      const reconvertDeals = originalDeals.map(deal => ({
        ...deal,
        price: parseFloat(convertAmount(deal.price, deal.currency)),
      }));
      const reconvertAltDates = originalAltDates.map(alt => ({
        ...alt,
        price: parseFloat(convertAmount(alt.price, alt.currency)),
      }));
      setDeals(reconvertDeals);
      setAlternativeDates(reconvertAltDates);
    }
  }, [currentCurrency, convertAmount, deals, alternativeDates, originalDeals, originalAltDates]);

  const GuestControls = () => (
    <div className="grid grid-cols-3 gap-4 mt-2">
      <div>
        <label className="block text-sm">{t('Adults')}</label>
        <InputNumber
          min={1}
          max={30}
          value={adults}
          onChange={(value) => setAdults(value != null ? value : 2)}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('Adults')}
          autoFocus={false}
          upHandler={<span className="text-gray-500">+</span>}
          downHandler={<span className="text-gray-500">-</span>}
          formatter={(value) => `${value}`}
          parser={(value) => (value ? parseInt(value.replace(/\D/g, '')) : 2)}
        />
      </div>
      <div>
        <label className="block text-sm">{t('Children')}</label>
        <InputNumber
          min={0}
          max={9}
          value={children}
          onChange={(value) => setChildren(value != null ? value : 0)}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('Children')}
          autoFocus={false}
          upHandler={<span className="text-gray-500">+</span>}
          downHandler={<span className="text-gray-500">-</span>}
          formatter={(value) => `${value}`}
          parser={(value) => (value ? parseInt(value.replace(/\D/g, '')) : 0)}
        />
      </div>
      <div>
        <label className="block text-sm">{t('Rooms')}</label>
        <InputNumber
          min={1}
          max={30}
          value={rooms}
          onChange={(value) => setRooms(value != null ? value : 1)}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('Rooms')}
          autoFocus={false}
          upHandler={<span className="text-gray-500">+</span>}
          downHandler={<span className="text-gray-500">-</span>}
          formatter={(value) => `${value}`}
          parser={(value) => (value ? parseInt(value.replace(/\D/g, '')) : 1)}
        />
      </div>
    </div>
  );

  const AlternativeDatesList = () => (
    <div className="mt-4">
      <h4 className="font-medium mb-2">{t('tryTheseDates')}</h4>
      <div className="grid grid-cols-2 gap-2">
        {alternativeDates.map((alt, i) => (
          <div key={i} className="p-2 border rounded bg-gray-50">
            <div className="font-medium">{alt.dates}</div>
            <div className="text-sm">{t('Nights', { count: alt.nights })}</div>
            <div className="text-green-600 font-bold">
              {getCurrencySymbol()}
              {alt.price.toFixed(2)}
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
                  onChange={setCheckIn}
                  value={checkIn}
                  minDate={new Date()}
                  className="w-full"
                  format="dd/MM/yyyy" 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">{t('checkOut')}</label>
                <DatePicker
                  onChange={setCheckOut}
                  value={checkOut}
                  minDate={checkIn}
                  className="w-full"
                  format="dd/MM/yyyy" 
                />
              </div>
            </div>
            <GuestControls />
            <button
              onClick={fetchPrices}
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
                        <div className={`text-xs ${deal.available === t('Available') ? 'text-green-600' : 'text-red-600'}`}>
                          {deal.available}
                        </div>
                        {deal.roomType && (
                          <div className="text-xs text-gray-500">{deal.roomType}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold mr-4">
                        {getCurrencySymbol()}
                        {deal.price.toFixed(2)}
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