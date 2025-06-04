import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { incrementHotelView } from '../utils/hotelViews';
import { useState } from 'react';
import ComparisonCard from './ComparisonCard';

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

      <ComparisonCard
        accommodation={accommodation}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
      />
    </div>
  );
}

export default AccommodationCard;