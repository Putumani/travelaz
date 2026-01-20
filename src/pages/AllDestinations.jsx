import Layout from '@/components/Layout';
import AccommodationCard from '@/components/AccommodationCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from '../i18n/useTranslation';

function AllDestinations() {
  const [allHotels, setAllHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('view_count');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const cities = useMemo(() => {
    if (!allHotels.length) return ['all'];
    const citySet = new Set();
    allHotels.forEach(hotel => {
      if (hotel.city) citySet.add(hotel.city);
    });
    return ['all', ...Array.from(citySet)];
  }, [allHotels]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAllHotels = async () => {
      try {
        console.log('Fetching all hotels...');
        const { data, error: fetchError } = await supabase
          .from('accommodations')
          .select('id, name, city, price, rating, image_url, area, view_count, booking_dot_com_affiliate_url, trip_dot_com_affiliate_url')
          .order('view_count', { ascending: false });

        if (!isMounted) return;

        if (fetchError) {
          console.error('Error fetching all hotels:', fetchError.message);
          setError(t('FailedToLoadHotels'));
          return;
        }

        console.log('All hotels data received:', data?.length || 0);
        
        const validHotels = (data || []).filter(hotel =>
          hotel?.id && hotel?.name && typeof hotel.price === 'number'
        );
        
        if (isMounted) {
          setAllHotels(validHotels);
          setError(null);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        if (isMounted) {
          setError(t('FailedToLoadHotels'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllHotels();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const filteredHotels = useMemo(() => {
    if (!allHotels.length) return [];

    let result = [...allHotels];

    if (selectedCity !== 'all') {
      result = result.filter(hotel => hotel.city === selectedCity);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(hotel =>
        hotel.name?.toLowerCase().includes(query) ||
        hotel.city?.toLowerCase().includes(query) ||
        hotel.area?.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => {
      const aPrice = a.price || 0;
      const bPrice = b.price || 0;
      const aRating = a.rating || 0;
      const bRating = b.rating || 0;
      const aViewCount = a.view_count || 0;
      const bViewCount = b.view_count || 0;
      const aName = a.name || '';
      const bName = b.name || '';

      switch (sortBy) {
        case 'price_low':
          return aPrice - bPrice;
        case 'price_high':
          return bPrice - aPrice;
        case 'rating':
          return bRating - aRating;
        case 'name':
          return aName.localeCompare(bName);
        case 'view_count':
        default:
          return bViewCount - aViewCount;
      }
    });
  }, [allHotels, selectedCity, searchQuery, sortBy]);

  // Memoize skeletons and fallbacks
  const HotelSkeleton = useCallback(() => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="flex justify-between items-center mt-4">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  ), []);

  const hotelCardFallback = useCallback(({ error: fallbackError, retry }) => (
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
  ), [t]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <HotelSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Unable to Load Hotels</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (filteredHotels.length === 0) {
      if (searchQuery || selectedCity !== 'all') {
        return (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No accommodations found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? (
                <>
                  No results for "<span className="font-semibold">{searchQuery}</span>"
                  {selectedCity !== 'all' && ` in ${selectedCity}`}
                </>
              ) : (
                `No accommodations found in ${selectedCity}`
              )}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear filters
            </button>
          </div>
        );
      }

      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <span className="text-2xl">🏨</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Accommodations Available</h3>
          <p className="text-gray-600">Check back soon for new accommodations</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredHotels.map((hotel) => (
          <ErrorBoundary 
            key={`hotel-${hotel.id}-${hotel.view_count}`}
            fallback={hotelCardFallback}
          >
            <AccommodationCard accommodation={hotel} />
          </ErrorBoundary>
        ))}
      </div>
    );
  };

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCity('all');
    setSortBy('view_count');
  }, []);

  return (
    <Layout>
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t('All Accommodations') || 'All Accommodations'}
          </h1>
          <p className="text-blue-100 text-lg max-w-3xl">
            {t('All Accommodations Description') || 'Discover and compare thousands of hotels, apartments, and accommodations worldwide'}
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('Search by hotel name, city, or area...') || "Search by hotel name, city, or area..."}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <select
                className="flex-1 border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Select city"
              >
                <option value="all">{t('All Cities') || 'All Cities'}</option>
                {cities
                  .filter(city => city !== 'all')
                  .map(city => (
                    <option key={`city-${city}`} value={city}>
                      {city}
                    </option>
                  ))
                }
              </select>

              <select
                className="flex-1 border border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort by"
              >
                <option value="view_count">{t('Most Popular') || 'Most Popular'}</option>
                <option value="rating">{t('Highest Rating') || 'Highest Rating'}</option>
                <option value="price_low">{t('Price Low To High') || 'Price: Low to High'}</option>
                <option value="price_high">{t('Price High To Low') || 'Price: High to Low'}</option>
                <option value="name">{t('Name A to Z') || 'Name: A to Z'}</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-gray-600">
              Showing <span className="font-semibold">{filteredHotels.length}</span> of{' '}
              <span className="font-semibold">{allHotels.length}</span> accommodations
            </p>
            {(searchQuery || selectedCity !== 'all') && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {t('ClearFilters') || 'Clear filters'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-gray-50 min-h-screen">
        {renderContent()}

        {!loading && !error && allHotels.length > 0 && filteredHotels.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{allHotels.length}</div>
                <div className="text-gray-600 font-medium">{t('TotalAccommodations') || 'Total Accommodations'}</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {cities.length - 1}
                </div>
                <div className="text-gray-600 font-medium">{t('Cities') || 'Cities'}</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {(() => {
                    const ratedHotels = allHotels.filter(h => h.rating);
                    if (ratedHotels.length === 0) return '0.0';
                    const average = ratedHotels.reduce((sum, hotel) => sum + hotel.rating, 0) / ratedHotels.length;
                    return average.toFixed(1);
                  })()}
                </div>
                <div className="text-gray-600 font-medium">{t('AverageRating') || 'Average Rating'}</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  ${(() => {
                    if (allHotels.length === 0) return '0';
                    const average = allHotels.reduce((sum, hotel) => sum + (hotel.price || 0), 0) / allHotels.length;
                    return Math.round(average).toLocaleString();
                  })()}
                </div>
                <div className="text-gray-600 font-medium">{t('AveragePrice') || 'Average Price'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Scroll to top"
        title="Back to top"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5 10l7-7m0 0l7 7m-7-7v18" 
          />
        </svg>
      </button>
    </Layout>
  );
}

export default AllDestinations;