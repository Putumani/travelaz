import { useState, useContext, useEffect } from 'react';
import { incrementHotelView } from '../utils/hotelViews';
import LoadingSpinner from './LoadingSpinner';
import { CurrencyContext } from '../context/CurrencyContext';
import { useTranslation } from '../i18n/useTranslation';
import { supabase } from '../lib/supabaseClient';
import DatePicker from 'react-date-picker';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

function ComparisonCard({ accommodation, isOpen, onClose }) {
  const [isUpdatingViews, setIsUpdatingViews] = useState(false);
  const [lastClickedDeal, setLastClickedDeal] = useState(null);
  const { convertAmount, getCurrencySymbol } = useContext(CurrencyContext);
  const { t } = useTranslation();
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));

  // Fetch availability based on selected dates
  useEffect(() => {
    let isMounted = true;

    const fetchAvailability = async () => {
      if (!accommodation) {
        setLoadingAvailability(false);
        return;
      }
      setLoadingAvailability(true);
      try {
        const checkInStr = checkIn.toISOString().split('T')[0];
        const checkOutStr = checkOut.toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('accommodations')
          .select('*')
          .eq('name', accommodation.name)
          .eq('check_in', checkInStr)
          .eq('check_out', checkOutStr)
          .eq('currency', accommodation.currency || 'ZAR')
          .single();

        if (isMounted && !error) {
          setAvailability(data);
        } else if (error) {
          console.error('Availability fetch error:', error);
        }
      } catch (err) {
        if (isMounted) console.error('Availability fetch error:', err);
      } finally {
        if (isMounted) setLoadingAvailability(false);
      }
    };

    if (checkIn && checkOut && accommodation) {
      fetchAvailability();
    }

    return () => {
      isMounted = false;
    };
  }, [accommodation, accommodation?.name, accommodation?.currency, checkIn, checkOut]);

  const handleViewDealClick = async (e, deal) => {
    e.preventDefault();
    e.stopPropagation();
    setLastClickedDeal(deal.site_name);
    setIsUpdatingViews(true);

    try {
      await incrementHotelView(accommodation.id);

      if (window.gtag) {
        window.gtag('event', 'view_deal', {
          hotel_id: accommodation.id,
          deal_site: deal.site_name,
          price: deal.price,
        });
      }
    } catch (error) {
      console.error('View count error:', error);
    } finally {
      setIsUpdatingViews(false);
      window.open(deal.affiliate_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Merge affiliate_deals with availability status
  const deals = accommodation?.affiliate_deals?.map((deal) => ({
    ...deal,
    available: availability?.available || (deal.price > 0 ? t('Available') : t('SoldOut')),
  })) || [];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-800 text-white rounded-t-lg -m-6 mb-4 p-4 flex justify-between items-center">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 7H5v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7H6z" />
              </svg>
              <span className="text-sm">
                {t('CheckIn', { date: checkIn.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) })}
              </span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 7H5v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7H6z" />
              </svg>
              <span className="text-sm">
                {t('CheckOut', { date: checkOut.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) })}
              </span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-sm">{t('Guests', { rooms: 1, guests: 2 })}</span> {/* Adjust dynamically if needed */}
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Booking Widget */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold">{t('SelectDates')}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm">{t('CheckIn')}</label>
              <DatePicker
                onChange={setCheckIn}
                value={checkIn}
                minDate={new Date()}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm">{t('CheckOut')}</label>
              <DatePicker
                onChange={setCheckOut}
                value={checkOut}
                minDate={checkIn || new Date()}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {loadingAvailability ? (
            <div className="text-center py-6">
              <LoadingSpinner size="medium" />
            </div>
          ) : deals.length > 0 ? (
            deals
              .sort((a, b) => a.price - b.price)
              .map((deal, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-medium">
                      {deal.site_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm truncate">{deal.site_name}</h4>
                      <p className="text-xs text-gray-500 truncate">
                        {t('StandardRoomFreeCancellation')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`text-xs ${deal.available === t('Available') ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {deal.available}
                    </span>
                    <span className="font-bold text-lg whitespace-nowrap">
                      {getCurrencySymbol()}
                      {convertAmount(deal.price)}
                    </span>
                    <button
                      onClick={(e) => handleViewDealClick(e, deal)}
                      disabled={isUpdatingViews && lastClickedDeal === deal.site_name}
                      className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:opacity-75 flex items-center gap-1"
                    >
                      {isUpdatingViews && lastClickedDeal === deal.site_name ? (
                        <>
                          <LoadingSpinner size="small" />
                          <span>{t('Opening')}</span>
                        </>
                      ) : (
                        t('ViewDeal')
                      )}
                    </button>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">{t('NoDealsAvailable')}</p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                {t('CheckBackLater')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComparisonCard;