import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { LanguageContext } from '../context/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import LoadingSpinner from './LoadingSpinner';
import InputNumber from 'rc-input-number';
import 'rc-input-number/assets/index.css';

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
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation();

  const isFetchingRef = useRef(false);
  const hasInitialFetchRef = useRef(false);
  const lastSuccessfulDataRef = useRef(null);
  const lastParamsRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const tomorrow = new Date(checkIn);
    tomorrow.setDate(checkIn.getDate() + 1);
    const checkInDate = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const checkOutDate = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());
    if (checkOutDate <= checkInDate) {
      setCheckOut(tomorrow);
    }
  }, [checkIn, checkOut]);

  const fetchPrices = useCallback(async (forceFetch = false) => {
    if (!isOpen || !accommodation || isFetchingRef.current) return;

    const checkInStr = formatDateToLocal(checkIn);
    const checkOutStr = formatDateToLocal(checkOut);

    const checkInDate = new Date(checkInStr);
    const checkOutDate = new Date(checkOutStr);
    if (checkOutDate <= checkInDate) {
      setError(t('checkOutMustBeAfterCheckIn'));
      setLoading(false);
      return;
    }

    const currentParams = {
      checkIn: checkInStr,
      checkOut: checkOutStr,
      adults,
      children,
      rooms,
    };

    const paramsChanged = !lastParamsRef.current || JSON.stringify(currentParams) !== JSON.stringify(lastParamsRef.current);

    if (!forceFetch && !paramsChanged && lastSuccessfulDataRef.current) {
      setDeals(lastSuccessfulDataRef.current.deals);
      setOriginalDeals(lastSuccessfulDataRef.current.originalDeals);
      setAlternativeDates(lastSuccessfulDataRef.current.alternativeDates);
      setOriginalAltDates(lastSuccessfulDataRef.current.originalAltDates);
      setError(lastSuccessfulDataRef.current.error);
      const cachedCheckIn = new Date(lastSuccessfulDataRef.current.params.checkIn);
      const cachedCheckOut = new Date(lastSuccessfulDataRef.current.params.checkOut);
      if (cachedCheckOut > cachedCheckIn) {
        setCheckIn(cachedCheckIn);
        setCheckOut(cachedCheckOut);
      }
      setAdults(lastSuccessfulDataRef.current.params.adults);
      setChildren(lastSuccessfulDataRef.current.params.children);
      setRooms(lastSuccessfulDataRef.current.params.rooms);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const fetchPromises = [];
      const sources = [
        { url: accommodation.booking_dot_com_affiliate_url, endpoint: 'scrape-booking', name: 'Booking.com' },
        { url: accommodation.trip_dot_com_affiliate_url, endpoint: 'scrape-trip', name: 'Trip.com' }
      ].filter(source => source.url);

      for (const source of sources) {
        fetchPromises.push(
          fetch(`http://localhost:5000/${source.endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              hotelUrl: source.url,
              checkIn: currentParams.checkIn,
              checkOut: currentParams.checkOut,
              adults,
              children,
              rooms,
            }),
            credentials: 'omit',
            signal: abortControllerRef.current.signal,
          }).then(response => response.json().then(data => ({ source: source.name, data })))
        );
      }

      const responses = await Promise.all(fetchPromises);
      const allDeals = [];
      const allOriginalDeals = [];
      const allAlternativeDates = [];
      const allOriginalAltDates = [];
      let fetchError = null;

      for (const { source, data } of responses) {
        if (data.error) {
          fetchError = data.error;
          allAlternativeDates.push(...(data.alternative_dates || []));
          allOriginalAltDates.push(...(data.alternative_dates || []));
          continue;
        }

        const totalPrice = (data.data.price || 0) + (data.data.taxes || 0);
        const convertedPrice = await convertAmount(totalPrice, data.data.currency || 'USD');
        const availabilityStatus = data.data.availability?.toLowerCase() === 'available' ? 'Available' : 'SoldOut';

        allDeals.push({
          site_name: source,
          price: parseFloat(convertedPrice),
          currency: currentCurrency,
          available: t(availabilityStatus === 'Available' ? 'Available' : 'SoldOut'),
          availabilityStatus,
          affiliate_url: data.data.source_url || (source === 'Booking.com' ? accommodation.booking_dot_com_affiliate_url : accommodation.trip_dot_com_affiliate_url),
          roomType: data.data.room_type,
        });

        allOriginalDeals.push({
          site_name: source,
          price: totalPrice,
          currency: data.data.currency || 'USD',
          available: t(availabilityStatus === 'Available' ? 'Available' : 'SoldOut'),
          availabilityStatus,
          affiliate_url: data.data.source_url || (source === 'Booking.com' ? accommodation.booking_dot_com_affiliate_url : accommodation.trip_dot_com_affiliate_url),
          roomType: data.data.room_type,
        });
      }

      const convertedAltDates = await Promise.all(
        allAlternativeDates.map(async (alt) => {
          const totalPrice = (alt.price || 0) + (alt.taxes || 0);
          const convertedPrice = await convertAmount(totalPrice, alt.currency || 'USD');
          return {
            ...alt,
            price: parseFloat(convertedPrice),
          };
        })
      );

      const result = {
        deals: allDeals,
        originalDeals: allOriginalDeals,
        alternativeDates: convertedAltDates,
        originalAltDates: allOriginalAltDates,
        error: fetchError,
        params: currentParams,
      };

      lastSuccessfulDataRef.current = result;
      lastParamsRef.current = currentParams;

      setDeals(result.deals);
      setOriginalDeals(result.originalDeals);
      setAlternativeDates(result.alternativeDates);
      setOriginalAltDates(result.originalAltDates);
      setError(fetchError);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Fetch aborted');
        if (lastSuccessfulDataRef.current) {
          setDeals(lastSuccessfulDataRef.current.deals);
          setOriginalDeals(lastSuccessfulDataRef.current.originalDeals);
          setAlternativeDates(lastSuccessfulDataRef.current.alternativeDates);
          setOriginalAltDates(lastSuccessfulDataRef.current.originalAltDates);
          setError(lastSuccessfulDataRef.current.error);
          const cachedCheckIn = new Date(lastSuccessfulDataRef.current.params.checkIn);
          const cachedCheckOut = new Date(lastSuccessfulDataRef.current.params.checkOut);
          if (cachedCheckOut > cachedCheckIn) {
            setCheckIn(cachedCheckIn);
            setCheckOut(cachedCheckOut);
          }
          setAdults(lastSuccessfulDataRef.current.params.adults);
          setChildren(lastSuccessfulDataRef.current.params.children);
          setRooms(lastSuccessfulDataRef.current.params.rooms);
        } else {
          setDeals([]);
          setOriginalDeals([]);
          setAlternativeDates([]);
          setOriginalAltDates([]);
          setError(null);
        }
      } else {
        console.error('Fetch error:', err);
        const errorMessage = err.message || t('scrapingFailed');
        if (lastSuccessfulDataRef.current) {
          setDeals(lastSuccessfulDataRef.current.deals);
          setOriginalDeals(lastSuccessfulDataRef.current.originalDeals);
          setAlternativeDates(lastSuccessfulDataRef.current.alternativeDates);
          setOriginalAltDates(lastSuccessfulDataRef.current.originalAltDates);
          setError(errorMessage);
        } else {
          setError(errorMessage);
          setDeals([]);
          setOriginalDeals([]);
          setAlternativeDates([]);
          setOriginalAltDates([]);
        }
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [isOpen, accommodation, checkIn, checkOut, adults, children, rooms, t, currentCurrency, convertAmount]);

  useEffect(() => {
    if (isOpen && !hasInitialFetchRef.current) {
      if (lastSuccessfulDataRef.current && lastParamsRef.current) {
        setDeals(lastSuccessfulDataRef.current.deals);
        setOriginalDeals(lastSuccessfulDataRef.current.originalDeals);
        setAlternativeDates(lastSuccessfulDataRef.current.alternativeDates);
        setOriginalAltDates(lastSuccessfulDataRef.current.originalAltDates);
        setError(lastSuccessfulDataRef.current.error);
        const cachedCheckIn = new Date(lastSuccessfulDataRef.current.params.checkIn);
        const cachedCheckOut = new Date(lastSuccessfulDataRef.current.params.checkOut);
        if (cachedCheckOut > cachedCheckIn) {
          setCheckIn(cachedCheckIn);
          setCheckOut(cachedCheckOut);
        }
        setAdults(lastSuccessfulDataRef.current.params.adults);
        setChildren(lastSuccessfulDataRef.current.params.children);
        setRooms(lastSuccessfulDataRef.current.params.rooms);
      } else {
        fetchPrices(true);
      }
      hasInitialFetchRef.current = true;
    } else if (isOpen && !lastSuccessfulDataRef.current) {
      fetchPrices(true);
    } else if (!isOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen, fetchPrices]);

  useEffect(() => {
    if ((deals.length > 0 || alternativeDates.length > 0) && originalDeals.length > 0 && originalAltDates.length >= 0) {
      const reconvertDeals = originalDeals.map(deal => ({
        ...deal,
        price: parseFloat(convertAmount(deal.price, deal.currency)),
        available: t(deal.availabilityStatus === 'Available' ? 'Available' : 'SoldOut'),
      }));
      const reconvertAltDates = originalAltDates.map(alt => ({
        ...alt,
        price: parseFloat(convertAmount(alt.price, alt.currency)),
        from: alt.from,
        to: alt.to,
        nights: alt.nights,
        dates: alt.dates,
      }));
      setDeals(reconvertDeals);
      setAlternativeDates(reconvertAltDates);
      if (lastSuccessfulDataRef.current) {
        lastSuccessfulDataRef.current = {
          ...lastSuccessfulDataRef.current,
          deals: reconvertDeals,
          alternativeDates: reconvertAltDates,
        };
      }
    }
  }, [currentCurrency, convertAmount, language, t, originalDeals, originalAltDates]);

  const handleUpdateSearch = () => {
    const checkInDate = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    const checkOutDate = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());
    if (checkOutDate <= checkInDate) {
      setError(t('checkOutMustBeAfterCheckIn'));
      return;
    }
    fetchPrices(true);
  };

  const GuestControls = () => {
    const handleAdultsChange = (value) => {
      if (value !== null && value !== adults) {
        setAdults(value);
      }
    };

    const handleChildrenChange = (value) => {
      if (value !== null && value !== children) {
        setChildren(value);
      }
    };

    const handleRoomsChange = (value) => {
      if (value !== null && value !== rooms) {
        setRooms(value);
      }
    };

    return (
      <div className="grid grid-cols-3 gap-4 mt-2">
        <div>
	  <label className="block text-sm">{t('Adults')}</label>
	  <InputNumber
	    value={adults}
	    min={1}
	    max={30}
	    onChange={handleAdultsChange}
	    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
	    aria-label={t('Adults')}
	    autoFocus={false}
	    upHandler={<span className="text-gray-500">+</span>}
	    downHandler={<span className="text-gray-500">-</span>}
	    formatter={(value) => `${value}`}
	    parser={(value) => (value ? parseInt(value.replace(/\D/g, '')) : 2)}
	    disabled={loading || isFetchingRef.current}
	  />
        </div>

        <div>
	  <label className="block text-sm">{t('Children')}</label>
	  <InputNumber
	    value={children}
	    min={0}
	    max={9}
	    onChange={handleChildrenChange}
	    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
	    aria-label={t('Children')}
	    autoFocus={false}
	    upHandler={<span className="text-gray-500">+</span>}
	    downHandler={<span className="text-gray-500">-</span>}
	    formatter={(value) => `${value}`}
	    parser={(value) => (value ? parseInt(value.replace(/\D/g, '')) : 0)}
	    disabled={loading || isFetchingRef.current}
	  />
        </div>

        <div>
	  <label className="block text-sm">{t('Rooms')}</label>
	  <InputNumber
	    value={rooms}
	    min={1}
	    max={30}
	    onChange={handleRoomsChange}
	    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
	    aria-label={t('Rooms')}
	    autoFocus={false}
	    upHandler={<span className="text-gray-500">+</span>}
	    downHandler={<span className="text-gray-500">-</span>}
	    formatter={(value) => `${value}`}
	    parser={(value) => (value ? parseInt(value.replace(/\D/g, '')) : 1)}
	    disabled={loading || isFetchingRef.current}
	  />
        </div>
      </div>
    );
  };

  const AlternativeDatesList = () => (
    <div className="mt-4">
      <h4 className="font-medium mb-2">{t('tryTheseDates')}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold truncate pr-2">{accommodation.name}</h3>
            <button
              onClick={() => {
                if (abortControllerRef.current) abortControllerRef.current.abort();
                onClose();
              }}
              className="text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <h4 className="font-medium mb-2">{t('selectDates')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">{t('checkIn')}</label>
                <DatePicker
                  onChange={(date) => setCheckIn(date || new Date())}
                  value={checkIn}
                  minDate={new Date()}
                  className="w-full"
                  format="dd/MM/yyyy"
                  disabled={loading || isFetchingRef.current}
                  calendarClassName="mobile-calendar"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">{t('checkOut')}</label>
                <DatePicker
                  onChange={(date) => setCheckOut(date || new Date(checkIn.getTime() + 24 * 60 * 60 * 1000))}
                  value={checkOut}
                  minDate={new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)}
                  className="w-full"
                  format="dd/MM/yyyy"
                  disabled={loading || isFetchingRef.current}
                  calendarClassName="mobile-calendar"
                />
              </div>
            </div>
            <GuestControls />
            <button
              onClick={handleUpdateSearch}
              disabled={loading || isFetchingRef.current}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
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
                .sort((a, b) => (a.price || Infinity) - (b.price || Infinity))
                .map((deal, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b last:border-b-0">
                    <div className="flex items-center flex-grow min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                        {deal.site_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <div className="font-medium truncate">{deal.site_name}</div>
                        <div className={`text-xs ${deal.availabilityStatus === 'Available' ? 'text-green-600' : 'text-red-600'}`}>
                          {deal.available}
                        </div>
                        {deal.roomType && (
                          <div className="text-xs text-gray-500 truncate">{deal.roomType}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center flex-shrink-0 ml-2">
                      <span className="font-bold mr-4">
                        {getCurrencySymbol()}
                        {deal.price ? deal.price.toFixed(2) : 'N/A'}
                      </span>
                      <a
                        href={deal.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
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
