import { useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { LanguageContext } from '../context/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import LoadingSpinner from './LoadingSpinner';
import InputNumber from 'rc-input-number';
import 'rc-input-number/assets/index.css';
import { debounce } from 'lodash';

const CACHE_KEY_PREFIX = 'comparison_cache_';
const CACHE_TTL = 10 * 60 * 1500;

const getCacheKey = (hotelId, params) => {
  return `${CACHE_KEY_PREFIX}${hotelId}_${btoa(JSON.stringify(params))}`;
};

const getCachedData = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn('LocalStorage full, clearing old cache...');
  }
};

function formatDateToLocal(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ComparisonCard({ accommodation, isOpen, onClose }) {
  const hotelId = accommodation.id || accommodation.name;

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
  const [childAges, setChildAges] = useState([]);
  const [alternativeDates, setAlternativeDates] = useState([]);
  const [originalAltDates, setOriginalAltDates] = useState([]);

  const { convertAmount, getCurrencySymbol, currentCurrency } = useContext(CurrencyContext);
  const { language } = useContext(LanguageContext);
  const { t } = useTranslation();

  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const allowCacheSaveRef = useRef(true);

  const debouncedSetAdults = useMemo(() => debounce(setAdults, 300), []);
  const debouncedSetChildren = useMemo(() => debounce(setChildren, 300), []);
  const debouncedSetRooms = useMemo(() => debounce(setRooms, 300), []);

  useEffect(() => {
    return () => {
      debouncedSetAdults.cancel();
      debouncedSetChildren.cancel();
      debouncedSetRooms.cancel();
    };
  }, [debouncedSetAdults, debouncedSetChildren, debouncedSetRooms]);

  useEffect(() => {
    if (!isOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      allowCacheSaveRef.current = false;
    } else {
      allowCacheSaveRef.current = true;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !accommodation) return;

    const currentParams = {
      checkIn: formatDateToLocal(checkIn),
      checkOut: formatDateToLocal(checkOut),
      adults,
      children,
      rooms,
      child_ages: childAges.length > 0 ? childAges.join(',') : undefined,
      currency: currentCurrency,
    };

    const cacheKey = getCacheKey(hotelId, currentParams);
    const cached = getCachedData(cacheKey);

    if (cached) {
      setDeals(cached.deals);
      setOriginalDeals(cached.originalDeals);
      setAlternativeDates(cached.alternativeDates);
      setOriginalAltDates(cached.originalAltDates);
      setError(cached.error);
      setCheckIn(new Date(cached.params.checkIn));
      setCheckOut(new Date(cached.params.checkOut));
      setAdults(cached.params.adults);
      setChildren(cached.params.children);
      setRooms(cached.params.rooms);
      setChildAges(cached.params.child_ages ? cached.params.child_ages.split(',').map(Number) : []);
      return;
    }

    setAdults(2);
    setChildren(0);
    setRooms(1);
    setChildAges([]);
    setCheckIn(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCheckOut(tomorrow);

    const timer = setTimeout(() => fetchPrices(true), 100);
    return () => clearTimeout(timer);
  }, [isOpen, accommodation, currentCurrency]);

  useEffect(() => {
    const tomorrow = new Date(checkIn);
    tomorrow.setDate(checkIn.getDate() + 1);
    const checkOutDate = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate());
    const checkInDate = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
    if (checkOutDate <= checkInDate) {
      setCheckOut(tomorrow);
    }
  }, [checkIn, checkOut]);

  const fetchPrices = useCallback(async (forceFetch = false) => {
    if (!isOpen || !accommodation || isFetchingRef.current) return;

    const checkInStr = formatDateToLocal(checkIn);
    const checkOutStr = formatDateToLocal(checkOut);
    const currentParams = {
      checkIn: checkInStr,
      checkOut: checkOutStr,
      adults,
      children,
      rooms,
      child_ages: childAges.length > 0 ? childAges.join(',') : undefined,
      currency: currentCurrency,
    };

    if (new Date(checkOutStr) <= new Date(checkInStr)) {
      setError(t('checkOutMustBeAfterCheckIn'));
      setLoading(false);
      return;
    }

    const cacheKey = getCacheKey(hotelId, currentParams);
    if (!forceFetch) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setDeals(cached.deals);
        setOriginalDeals(cached.originalDeals);
        setAlternativeDates(cached.alternativeDates);
        setOriginalAltDates(cached.originalAltDates);
        setError(cached.error);
        return;
      }
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const sources = [
        { url: accommodation.booking_dot_com_affiliate_url, endpoint: 'scrape-booking', name: 'Booking.com' },
        { url: accommodation.trip_dot_com_affiliate_url, endpoint: 'scrape-trip', name: 'Trip.com' }
      ].filter(s => s.url);

      const responses = await Promise.all(
        sources.map(source =>
          fetch(`http://localhost:5000/${source.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              hotelUrl: source.url,
              checkIn: currentParams.checkIn,
              checkOut: currentParams.checkOut,
              adults,
              children,
              rooms,
              child_ages: currentParams.child_ages,
            }),
            signal: abortControllerRef.current.signal,
          }).then(r => r.json().then(data => ({ source: source.name, data })))
        )
      );

      const allDeals = [], allOriginalDeals = [], allAlt = [], allOrigAlt = [];
      let fetchError = null;

      for (const { source, data } of responses) {
        if (data.error) {
          fetchError = data.error;
          allAlt.push(...(data.alternative_dates || []));
          allOrigAlt.push(...(data.alternative_dates || []));
          continue;
        }

        const total = (data.data.price || 0) + (data.data.taxes || 0);
        const converted = await convertAmount(total, data.data.currency || 'USD');
        const status = data.data.availability?.toLowerCase() === 'available' ? 'Available' : 'SoldOut';

        allDeals.push({
          site_name: source,
          price: parseFloat(converted),
          currency: currentCurrency,
          available: t(status === 'Available' ? 'Available' : 'SoldOut'),
          availabilityStatus: status,
          affiliate_url: data.data.source_url || (source === 'Booking.com' ? accommodation.booking_dot_com_affiliate_url : accommodation.trip_dot_com_affiliate_url),
          roomType: data.data.room_type,
        });

        allOriginalDeals.push({ ...allDeals[allDeals.length - 1], price: total, currency: data.data.currency || 'USD' });
      }

      const convertedAlts = await Promise.all(
        allAlt.map(async alt => ({
          ...alt,
          price: parseFloat(await convertAmount((alt.price || 0) + (alt.taxes || 0), alt.currency || 'USD')),
        }))
      );

      const result = {
        deals: allDeals,
        originalDeals: allOriginalDeals,
        alternativeDates: convertedAlts,
        originalAltDates: allOrigAlt,
        error: fetchError,
        params: currentParams,
      };

      if (allowCacheSaveRef.current) {
        setCachedData(cacheKey, result);
      }

      setDeals(allDeals);
      setOriginalDeals(allOriginalDeals);
      setAlternativeDates(convertedAlts);
      setOriginalAltDates(allOrigAlt);
      setError(fetchError);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch error:', err);
        setError(err.message || t('scrapingFailed'));
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [
    isOpen, accommodation, checkIn, checkOut, adults, children, rooms, childAges,
    currentCurrency, convertAmount, t, hotelId
  ]);

  const handleUpdateSearch = () => {
    if (new Date(formatDateToLocal(checkOut)) <= new Date(formatDateToLocal(checkIn))) {
      setError(t('checkOutMustBeAfterCheckIn'));
      return;
    }
    allowCacheSaveRef.current = true;
    fetchPrices(true);
  };

  const GuestControls = () => {
    const handleAdultsChange = (value) => {
      if (value !== null && value !== adults) debouncedSetAdults(value);
    };

    const handleChildrenChange = (value) => {
      if (value !== null && value !== children) {
        debouncedSetChildren(value);
        if (value < childAges.length) {
          setChildAges(childAges.slice(0, value));
        }
      }
    };

    const handleRoomsChange = (value) => {
      if (value !== null && value !== rooms) debouncedSetRooms(value);
    };

    const handleChildAgeChange = (index, age) => {
      const newAges = [...childAges];
      newAges[index] = age;
      setChildAges(newAges);
    };

    return (
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm">{t('Adults')}</label>
            <InputNumber
              value={adults}
              min={1}
              max={30}
              onChange={handleAdultsChange}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('Adults')}
              upHandler={<span className="text-gray-500">+</span>}
              downHandler={<span className="text-gray-500">-</span>}
              formatter={v => `${v}`}
              parser={v => (v ? parseInt(v.replace(/\D/g, '')) : 2)}
              disabled={loading || isFetchingRef.current}
            />
          </div>

          <div>
            <label className="block text-sm">{t('Children')}</label>
            <InputNumber
              value={children}
              min={0}
              max={10}
              onChange={handleChildrenChange}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('Children')}
              upHandler={<span className="text-gray-500">+</span>}
              downHandler={<span className="text-gray-500">-</span>}
              formatter={v => `${v}`}
              parser={v => (v ? parseInt(v.replace(/\D/g, '')) : 0)}
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
              upHandler={<span className="text-gray-500">+</span>}
              downHandler={<span className="text-gray-500">-</span>}
              formatter={v => `${v}`}
              parser={v => (v ? parseInt(v.replace(/\D/g, '')) : 1)}
              disabled={loading || isFetchingRef.current}
            />
          </div>
        </div>

        {children > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t('Child Ages')} (0–17)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: children }, (_, i) => (
                <div key={i}>
                  <label className="text-xs text-gray-600">Child {i + 1}</label>
                  <InputNumber
                    value={childAges[i] ?? 5}
                    min={0}
                    max={17}
                    onChange={(age) => handleChildAgeChange(i, age)}
                    className="w-full border rounded p-2 text-sm"
                    upHandler={<span className="text-gray-500">+</span>}
                    downHandler={<span className="text-gray-500">-</span>}
                    formatter={v => `${v}`}
                    parser={v => (v ? parseInt(v.replace(/\D/g, '')) : 5)}
                    disabled={loading || isFetchingRef.current}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">Required for accurate pricing</p>
          </div>
        )}
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
            <div className="text-green-600 font-bold">{getCurrencySymbol()}{alt.price.toFixed(2)}</div>
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
                abortControllerRef.current?.abort();
                onClose();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              X
            </button>
          </div>

          <div className="mb-6">
            <h4 className="font-medium mb-2">{t('selectDates')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">{t('checkIn')}</label>
                <DatePicker
                  onChange={setCheckIn}
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
                  onChange={setCheckOut}
                  value={checkOut}
                  minDate={new Date(checkIn.getTime() + 86400000)}
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
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : deals.length > 0 ? (
              deals
                .sort((a, b) => (a.price || Infinity) - (b.price || Infinity))
                .map((deal, i) => {
                  const ageParams = childAges.length > 0 ? childAges.map(age => `&age=${age}`).join('') : '';
                  return (
                    <div key={i} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div className="flex items-center flex-grow min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          {deal.site_name[0]}
                        </div>
                        <div className="min-w-0 flex-grow">
                          <div className="font-medium truncate">{deal.site_name}</div>
                          <div className={`text-xs ${deal.availabilityStatus === 'Available' ? 'text-green-600' : 'text-red-600'}`}>
                            {deal.available}
                          </div>
                          {deal.roomType && <div className="text-xs text-gray-500 truncate">{deal.roomType}</div>}
                        </div>
                      </div>
                      <div className="flex items-center flex-shrink-0 ml-2">
                        <span className="font-bold mr-4">
                          {getCurrencySymbol()}{deal.price ? deal.price.toFixed(2) : 'N/A'}
                        </span>
                        <a
                          href={`${deal.affiliate_url}&checkin=${formatDateToLocal(checkIn)}&checkout=${formatDateToLocal(checkOut)}&group_adults=${adults}&group_children=${children}${ageParams}&no_rooms=${rooms}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800"
                        >
                          {t('viewDeal')}
                        </a>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="py-6 text-center text-gray-500">{t('noDealsAvailable')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonCard;