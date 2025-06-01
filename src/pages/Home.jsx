import Hero from '@/components/Hero';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { incrementHotelView } from '../utils/hotelViews'; 

function Home() {
  const [popularHotels, setPopularHotels] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchPopularHotels = async () => {
      console.log('Fetching popular hotels...');
      const { data: viewsData, error: viewsError } = await supabase
        .from('hotel_views')
        .select('hotel_id, view_count')
        .order('view_count', { ascending: false })
        .limit(5);

      if (viewsError) {
        console.error('Error fetching hotel views:', viewsError.message);
        setErrorMessage('Failed to load popular hotels. Please try again later.');
        return;
      }

      console.log('Hotel views data:', viewsData);

      if (!viewsData || viewsData.length === 0) {
        console.log('No hotel views found.');
        setPopularHotels([]);
        return;
      }

      const hotelIds = viewsData.map(item => item.hotel_id);
      const { data: accommodationsData, error: accommodationsError } = await supabase
        .from('accommodations')
        .select('id, name, city, price, rating, image_url, area')
        .in('id', hotelIds);

      if (accommodationsError) {
        console.error('Error fetching accommodations:', accommodationsError.message);
        setErrorMessage('Failed to load hotel details. Please try again later.');
        return;
      }

      console.log('Accommodations data:', accommodationsData);

      const mergedHotels = accommodationsData.map(hotel => {
        const viewEntry = viewsData.find(view => view.hotel_id === hotel.id);
        return {
          ...hotel,
          view_count: viewEntry ? viewEntry.view_count : 0
        };
      });

      console.log('Merged hotels:', mergedHotels);
      setPopularHotels(mergedHotels);
    };

    fetchPopularHotels();
  }, []);

  const handleCardClick = async (hotelId, city) => {
    await incrementHotelView(hotelId, city);
    console.log(`Incremented view for hotel ID ${hotelId} in ${city}`);
  };

  return (
    <Layout>
      <Hero />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 bg-gray-50">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-black">Popular Hotels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {errorMessage ? (
            <div className="text-center text-red-500">{errorMessage}</div>
          ) : popularHotels.length > 0 ? (
            popularHotels.map((hotel) => (
              <div key={hotel.id} className="block" onClick={() => handleCardClick(hotel.id, hotel.city)}>
                <Link to={`/${hotel.city.toLowerCase().replace(' ', '')}`} className="block">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg border-2 border-gray-300">
                    <div className="relative h-32 sm:h-36 lg:h-40 w-full bg-gray-100">
                      <LazyLoadImage
                        src={hotel.image_url || `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_600,h_400,c_fill/default-placeholder`}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_600,h_400,c_fill/default-placeholder`;
                        }}
                        width="100%"
                        height="100%"
                        effect="blur"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold text-black truncate">{hotel.name}</h3>
                      <p className="text-gray-600 mt-1 text-sm sm:text-base">From ${hotel.price}/night</p>
                      <p className="text-gray-500 text-sm">Views: {hotel.view_count}</p>
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 sm:mt-4 inline-block px-3 py-1 sm:px-4 sm:py-2 bg-black text-white text-sm sm:text-base rounded hover:bg-gray-800"
                      >
                        Book Now
                      </a>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">No popular hotels available yet.</div>
          )}
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 bg-white">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-black">Featured Destinations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Durban */}
          <Link to="/durban" className="block">
            <div 
              className="bg-cover bg-center h-52 sm:h-56 lg:h-64 rounded-lg shadow-md" 
              style={{ 
                backgroundImage: `url(https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_400,c_fill/Durban-Beach-View_pgvgag)` 
              }}
            >
              <div className="bg-black bg-opacity-50 h-full flex items-center justify-center rounded-lg">
                <h3 className="text-xl sm:text-2xl font-semibold text-white">Durban</h3>
              </div>
            </div>
          </Link>

          {/* Cape Town */}
          <Link to="/capetown" className="block">
            <div 
              className="bg-cover bg-center h-52 sm:h-56 lg:h-64 rounded-lg shadow-md" 
              style={{ 
                backgroundImage: `url(https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_400,c_fill/pexels-jvdm-3736245_d6d1jc)` 
              }}
            >
              <div className="bg-black bg-opacity-50 h-full flex items-center justify-center rounded-lg">
                <h3 className="text-xl sm:text-2xl font-semibold text-white">Cape Town</h3>
              </div>
            </div>
          </Link>

          {/* Bangkok */}
          <Link to="/bangkok" className="block">
            <div 
              className="bg-cover bg-center h-52 sm:h-56 lg:h-64 rounded-lg shadow-md" 
              style={{ 
                backgroundImage: `url(https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_400,c_fill/pexels-jimmy-teoh-294331-2402000_y1e72y)` 
              }}
            >
              <div className="bg-black bg-opacity-50 h-full flex items-center justify-center rounded-lg">
                <h3 className="text-xl sm:text-2xl font-semibold text-white">Bangkok</h3>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </Layout>
  );
}

export default Home;