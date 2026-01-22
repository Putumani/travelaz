import Hero from '@/components/Hero';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AccommodationCard from '@/components/AccommodationCard';
import ErrorBoundary from '@/components/ErrorBoundary'; 
import FeaturedDestinationCard from '@/components/FeaturedDestinationCard';
import { useTranslation } from '../i18n/useTranslation';

function Home() {
  const [popularHotels, setPopularHotels] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPopularHotels = async () => {
      console.log('Fetching popular hotels...');
      const { data, error } = await supabase
        .from('accommodations')
        .select('id, name, city, price, rating, image_url, area, view_count, booking_dot_com_affiliate_url, trip_dot_com_affiliate_url')
        .order('view_count', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching popular hotels:', error.message);
        setErrorMessage(t('FailedToLoadHotels'));
        return;
      }

      console.log('Popular hotels data:', data);
      const validHotels = data.filter(hotel =>
        hotel.id && hotel.name && typeof hotel.price === 'number' && hotel.rating
      );
      setPopularHotels(validHotels);
    };

    fetchPopularHotels();
  }, [t]);

  const hotelCardFallback = ({ error, retry }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-red-200">
      <div className="h-40 bg-red-100 flex items-center justify-center">
        <span className="text-red-600">Error loading hotel</span>
      </div>
      <div className="p-4">
        <p className="text-red-600 text-sm mb-2">
          {t('errorLoadingHotel', { defaultValue: 'Error loading hotel information' })}
        </p>
        <button 
          onClick={retry}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          {t('tryAgain', { defaultValue: 'Try Again' })}
        </button>
      </div>
    </div>
  );

  return (
    <Layout>
      <Hero />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 bg-gray-50">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-black">{t('PopularHotels')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {errorMessage ? (
            <div className="text-center text-red-500">{errorMessage}</div>
          ) : popularHotels.length > 0 ? (
            popularHotels.map((hotel) => (
              <ErrorBoundary 
                key={hotel.id}
                fallback={hotelCardFallback}
              >
                <AccommodationCard accommodation={hotel} />
              </ErrorBoundary>
            ))
          ) : (
            <div className="text-center text-gray-500">{t('NoHotelsAvailable')}</div>
          )}
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 bg-white">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-black">{t('FeaturedDestinations')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <FeaturedDestinationCard 
            city="durban"
            title={t('Durban')}
            description={t('durbanDescription')}
            path="/durban"
          />
          <FeaturedDestinationCard 
            city="capetown"
            title={t('CapeTown')}
            description={t('capetownDescription')}
            path="/capetown"
          />
          <FeaturedDestinationCard 
            city="bangkok"
            title={t('Bangkok')}
            description={t('bangkokDescription')}
            path="/bangkok"
          />
        </div>
      </section>
      
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            {t('FindPerfectStay')}
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            {t('FindPerfectStayDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#popular-hotels"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1"
            >
              {t('ExplorePopularHotels')}
            </a>
            <a
              href="/all-destinations"  
              className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300"
            >
              {t('BrowseAllAccommodations')}
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default Home;
