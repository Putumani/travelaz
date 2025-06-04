import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { incrementHotelView } from '../utils/hotelViews';
import { useState } from 'react';

function AccommodationCard({ accommodation }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleCardClick = async () => {
    if (!accommodation?.id) return;
    
    try {
      console.log(`Incrementing views for ${accommodation.name} (ID: ${accommodation.id})`);
      await incrementHotelView(accommodation.id);
      console.log(`Successfully incremented views for ${accommodation.name}`);
    } catch (error) {
      console.error(`Failed to increment views: ${error.message}`);
    }
  };

  const handleBookClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  if (!accommodation) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-300 min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] animate-pulse">
        <div className="h-40 sm:h-44 lg:h-48 bg-gray-200"></div>
        <div className="p-3 sm:p-4 space-y-2">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-8 sm:h-10 bg-gray-200 rounded mt-2 sm:mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-gray-300 min-h-[300px] sm:min-h-[350px] lg:min-h-[400px] flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative h-40 sm:h-44 lg:h-48 w-full bg-gray-100">
        <LazyLoadImage
          src={accommodation.image_url || `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_600,h_400,c_fill/default-placeholder`}
          alt={accommodation.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_600,h_400,c_fill/default-placeholder`;
          }}
          width="100%"
          height="100%"
          effect="blur"
        />
      </div>
      <div className="p-3 sm:p-4 flex-grow">
        <h3 className="text-base sm:text-lg font-semibold text-black truncate">{accommodation.name}</h3>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">{accommodation.area}</p>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">From ${accommodation.price}/night</p>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Rating: {accommodation.rating}/5</p>
        <p className="text-gray-600 mt-2 text-xs sm:text-sm line-clamp-2">{accommodation.description || 'No description available.'}</p>
        <button
          onClick={handleBookClick}
          className="mt-2 sm:mt-4 inline-block px-3 py-1 sm:px-4 sm:py-2 bg-black text-white text-sm sm:text-base rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          Book Now
        </button>
      </div>

      {isPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClosePopup}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl p-6 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <svg className="w-7 h-7 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 7H5v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7H6zm6 10h-2v-6h2v6zm4-6h-2v6h2v-6z"/>
                  </svg>
                  <span>Check-in: 12 May 2025</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-7 h-7 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 7H5v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7H6zm6 10h-2v-6h2v6zm4-6h-2v6h2v-6z"/>
                  </svg>
                  <span>Check-out: 15 May 2025</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>2 Rooms, 4 Guests</span>
                </div>
              </div>
              <button onClick={handleClosePopup} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {accommodation.affiliate_deals?.length > 0 ? (
                accommodation.affiliate_deals
                  .sort((a, b) => a.price - b.price) 
                  .map((deal, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {deal.site_name === "Booking.com" ? "B" : deal.site_name === "Expedia" ? "E" : "H"}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{deal.site_name}</h4>
                          <p className="text-xs text-gray-500">Standard Room, Free Cancellation</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`text-xs ${deal.price > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {deal.price > 0 ? "Available" : "Sold Out"}
                        </span>
                        <span className="font-bold text-lg">${deal.price}/night</span>
                        <a
                          href={deal.affiliate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                        >
                          Book
                        </a>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-center text-gray-500">No deals available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccommodationCard;