import React, { useState, useEffect, useRef, useCallback } from 'react';
   import { useTranslation } from '@/i18n/useTranslation';
   import { useCurrency } from '@/context/CurrencyContext';
   import { supabase } from '@/lib/supabaseClient';
   import { formatDateToLocal } from '@/utils/dateUtils';

   const ComparisonCard = ({ accommodation, isOpen, onClose }) => {
     const { t } = useTranslation();
     const { currentCurrency, convertAmount } = useCurrency();
     const [deals, setDeals] = useState([]);
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
       { name: 'Booking.com', endpoint: 'scrape-booking', url: accommodation?.booking_dot_com_affiliate_url },
       { name: 'Trip.com', endpoint: 'scrape-trip', url: accommodation?.trip_dot_com_affiliate_url },
     ].filter(source => source.url);

     const fetchPrices = useCallback(
       async (setLoading = false) => {
         if (!accommodation || !isOpen || hasInitialFetchRef.current) return;

         if (setLoading) setIsLoading(true);
         setError(null);

         if (abortControllerRef.current) {
           abortControllerRef.current.abort();
         }
         abortControllerRef.current = new AbortController();

         const fetchPromises = [];
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
                 checkIn,
                 checkOut,
                 adults,
                 children,
                 rooms,
               }),
               credentials: 'omit',
               signal: abortControllerRef.current.signal,
             })
               .then(async response => {
                 if (!response.ok) {
                   throw new Error(`HTTP error! status: ${response.status}`);
                 }
                 const data = await response.json();
                 if (!data.success) {
                   throw new Error(data.error || t('scrapingFailed'));
                 }
                 return { source: source.name, data: data.data };
               })
               .catch(error => {
                 if (error.name === 'AbortError') {
                   return null;
                 }
                 return { error: error.message, source: source.name };
               })
           );
         }

         try {
           const results = await Promise.all(fetchPromises);
           const validResults = results.filter(result => result && !result.error);
           const errorResults = results.filter(result => result && result.error);

           if (errorResults.length > 0) {
             const errorMessages = errorResults.map(result => `${result.source}: ${result.error}`).join(', ');
             setError(t('partialScrapingFailed', { errors: errorMessages }));
           }

           const convertedDeals = await Promise.all(
             validResults.map(async ({ source, data }) => ({
               site_name: source,
               price: data.price ? parseFloat(await convertAmount(data.price, data.currency)) : null,
               currency: currentCurrency,
               available: t(data.availability === 'Available' ? 'Available' : 'SoldOut'),
               availabilityStatus: data.availability,
               affiliate_url: data.source_url,
               roomType: data.room_type || t('notSpecified'),
             }))
           );
           setDeals(convertedDeals);
         } catch {
           setError(t('scrapingFailed'));
         } finally {
           if (setLoading) setIsLoading(false);
         }
       },
       [accommodation, isOpen, checkIn, checkOut, sources, convertAmount, currentCurrency, t]
     );

     useEffect(() => {
       if (isOpen && !hasInitialFetchRef.current) {
         const tryBackend = async () => {
           try {
             await fetchPrices(true);
           } catch {
             const { data, error } = await supabase
               .from('accommodation_deals')
               .select('*')
               .eq('hotel_id', accommodation?.id)
               .eq('check_in', formatDateToLocal(checkIn))
               .eq('check_out', formatDateToLocal(checkOut));

             if (error) {
               setError(t('scrapingFailed'));
               return;
             }

             const convertedDeals = await Promise.all(
               data.map(async deal => ({
                 site_name: deal.source,
                 price: deal.price ? parseFloat(await convertAmount(deal.price, deal.currency)) : null,
                 currency: currentCurrency,
                 available: t(deal.availability === 'Available' ? 'Available' : 'SoldOut'),
                 availabilityStatus: deal.availability,
                 affiliate_url: deal.source_url,
                 roomType: deal.room_type || t('notSpecified'),
               }))
             );
             setDeals(convertedDeals);
           }
         };
         tryBackend();
         hasInitialFetchRef.current = true;
       } else if (!isOpen) {
         if (abortControllerRef.current) {
           abortControllerRef.current.abort();
         }
         setDeals([]);
         hasInitialFetchRef.current = false;
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

   export default ComparisonCard;