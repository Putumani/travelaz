import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from '@/i18n/useTranslation';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/lib/supabaseClient';
import { formatDateToLocal } from '@/utils/dateUtils';

const ComparisonCard = ({ accommodation, isOpen, onClose }) => {
  const { t } = useTranslation();
  const { currentCurrency, convertAmount } = useCurrency();
  const [deals, setDeals] = useState([]);
  const [originalDeals, setOriginalDeals] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const hasInitialFetchRef = useRef(false);

  const checkIn = formatDateToLocal(new Date());
  const checkOut = formatDateToLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const adults = 2;
  const children = 0;
  const rooms = 1;

  const sources = [
    { name: 'Booking.com', endpoint: 'scrape-booking', url: accommodation.booking_dot_com_affiliate_url },
    { name: 'Trip.com', endpoint: 'scrape-trip', url: accommodation.trip_dot_com_affiliate_url },
  ].filter(source => source.url);

  const fetchPrices = useCallback(
    async (setLoading = false) => {
      if (setLoading) setIsLoading(true);
      setError(null);

      abortControllerRef.current = new AbortController();
      const fetchPromises = [];

      const currentParams = { checkIn, checkOut, adults, children, rooms };
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://travelaz-backend.onrender.com';

      for (const source of sources) {
        fetchPromises.push(
          fetch(`${backendUrl}/${source.endpoint}`, {
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
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .then(data => {
              if (!data.success) {
                throw new Error(data.error || 'Scraping failed');
              }
              return { source: source.name, data: data.data };
            })
            .catch(error => {
              if (error.name === 'AbortError') {
                return null;
              }
              throw error;
            })
        );
      }

      try {
        const results = await Promise.all(fetchPromises);
        const validResults = results.filter(result => result !== null);
        const convertedDeals = await Promise.all(
          validResults.map(async ({ source, data }) => ({
            site_name: source,
            price: parseFloat(await convertAmount(data.price, data.currency)),
            currency: currentCurrency,
            available: t(data.availability === 'Available' ? 'Available' : 'SoldOut'),
            availabilityStatus: data.availability,
            affiliate_url: data.source_url,
            roomType: data.room_type,
          }))
        );
        setDeals(convertedDeals);
        setOriginalDeals(validResults.map(({ source, data }) => ({ ...data, source })));
      } catch (err) {
        setError(t('scrapingFailed'));
      } finally {
        if (setLoading) setIsLoading(false);
      }
    },
    [accommodation, checkIn, checkOut, currentCurrency, convertAmount, t]
  );

  useEffect(() => {
    if (isOpen && !hasInitialFetchRef.current) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://travelaz-backend.onrender.com';
      const tryBackend = async () => {
        try {
          await fetchPrices(true);
        } catch {
          const { data, error } = await supabase
            .from('accommodation_deals')
            .select('*')
            .eq('hotel_id', accommodation.id)
            .eq('check_in', formatDateToLocal(checkIn))
            .eq('check_out', formatDateToLocal(checkOut));
          if (error) {
            setError(t('scrapingFailed'));
            return;
          }
          const convertedDeals = await Promise.all(
            data.map(async deal => ({
              site_name: deal.source,
              price: parseFloat(await convertAmount(deal.price, deal.currency)),
              currency: currentCurrency,
              available: t(deal.availability === 'Available' ? 'Available' : 'SoldOut'),
              availabilityStatus: deal.availability,
              affiliate_url: deal.source_url,
              roomType: deal.room_type,
            }))
          );
          setDeals(convertedDeals);
          setOriginalDeals(data);
        }
      };
      tryBackend();
      hasInitialFetchRef.current = true;
    } else if (!isOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen, fetchPrices, accommodation, checkIn, checkOut, currentCurrency, convertAmount, t]);

  return (
    <div className={`modal ${isOpen ? 'block' : 'hidden'} fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50`} role="dialog" aria-labelledby="modal-title">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <h2 id="modal-title" className="text-2xl font-bold mb-4">{t('compareDeals')}</h2>
        {isLoading && <p className="text-gray-600">{t('loading')}</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="space-y-4">
          {deals.length > 0 ? (
            deals.map((deal, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <p className="font-semibold">{deal.site_name}</p>
                <p>
                  {t('price')}: {deal.price ? `${deal.currency} ${deal.price.toFixed(2)}` : t('notAvailable')}
                </p>
                <p>{t('availability')}: {deal.available}</p>
                <p>{t('roomType')}: {deal.roomType}</p>
                {deal.affiliate_url && (
                  <a
                    href={deal.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {t('bookNow')}
                  </a>
                )}
              </div>
            ))
          ) : (
            <p>{t('noDealsAvailable')}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
};

ComparisonCard.propTypes = {
  accommodation: PropTypes.shape({
    id: PropTypes.number.isRequired,
    booking_dot_com_affiliate_url: PropTypes.string,
    trip_dot_com_affiliate_url: PropTypes.string,
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ComparisonCard;