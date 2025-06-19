import Hero from '@/components/Hero';
import { Link, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AccommodationCard from '@/components/AccommodationCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useTranslation } from '../i18n/useTranslation';

function Home() {
  const [popularHotels, setPopularHotels] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPopularHotels = async () => {
      console.log('Fetching popular hotels...');
      const { data, error } = await supabase
        .from('accommodations')
        .select('id, name, city, price, rating, image_url, area, view_count, booking_dot_com_affiliate_url, expedia_affiliate_url, hotels_dot_com_affiliate_url, trip_dot_com_affiliate_url, priceline_affiliate_url')
        .order('view_count', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching popular hotels:', error.message);
        setErrorMessage(t('FailedToLoadHotels'));
        return;
      }

      console.log('Popular hotels data:', data);
      // Filter out hotels with missing required fields
      const validHotels = data.filter(hotel => 
        hotel.id && hotel.name && typeof hotel.price === 'number' && hotel.rating
      );
      setPopularHotels(validHotels);
    };

    fetchPopularHotels();
  }, [location, t]);

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
              <ErrorBoundary key={hotel.id}>
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
          <Link to="/durban" className="block">
            <div 
              className="bg-cover bg-center h-52 sm:h-56 lg:h-64 rounded-lg shadow-md" 
              style={{ 
                backgroundImage: `url(https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_400,c_fill/Durban-Beach-View_pgvgag)` 
              }}
            >
              <div className="bg-black bg-opacity-50 h-full flex items-center justify-center rounded-lg">
                <h3 className="text-xl sm:text-2xl font-semibold text-white">{t('Durban')}</h3>
              </div>
            </div>
          </Link>
          <Link to="/capetown" className="block">
            <div 
              className="bg-cover bg-center h-52 sm:h-56 lg:h-64 rounded-lg shadow-md" 
              style={{ 
                backgroundImage: `url(https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_400,c_fill/pexels-jvdm-3736245_d6d1jc)` 
              }}
            >
              <div className="bg-black bg-opacity-50 h-full flex items-center justify-center rounded-lg">
                <h3 className="text-xl sm:text-2xl font-semibold text-white">{t('CapeTown')}</h3>
              </div>
            </div>
          </Link>
          <Link to="/bangkok" className="block">
            <div 
              className="bg-cover bg-center h-52 sm:h-56 lg:h-64 rounded-lg shadow-md" 
              style={{ 
                backgroundImage: `url(https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_400,c_fill/pexels-jimmy-teoh-294331-2402000_y1e72y)` 
              }}
            >
              <div className="bg-black bg-opacity-50 h-full flex items-center justify-center rounded-lg">
                <h3 className="text-xl sm:text-2xl font-semibold text-white">{t('Bangkok')}</h3>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </Layout>
  );
}

export default Home;