import { affiliateId } from '@/affilliateConfig';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

function AccommodationCard({ accommodation }) {
  // Placeholder skeleton for empty cards
  if (accommodation.empty) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-300 min-h-[400px] animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4 space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-10 bg-gray-200 rounded mt-4"></div>
        </div>
      </div>
    );
  }

  const bookingLink = `https://www.travelstart.co.za/affiliate?affiliate_id=${affiliateId}&hotel=${encodeURIComponent(accommodation.name.replace(/\s+/g, '-').toLowerCase())}&city=${accommodation.city}`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-gray-300 min-h-[400px] flex flex-col">
      <div className="relative h-48 bg-gray-100 flex items-center justify-center">
        <LazyLoadImage
          src={`${accommodation.image_url}?monochrome=000000`}
          alt={accommodation.name}
          effect="blur"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '';
          }}
        />
        {!accommodation.image_url && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4 flex-grow">
        <h3 className="text-lg font-semibold text-black">{accommodation.name}</h3>
        <p className="text-gray-600 mt-1">{accommodation.area}</p>
        <p className="text-gray-600 mt-1">From ${accommodation.price}/night</p>
        <p className="text-gray-500 mt-1">Rating: {accommodation.rating}/5</p>
        <p className="text-gray-600 mt-2 text-sm">{accommodation.description}</p>
        <a
          href={bookingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Book Now
        </a>
      </div>
    </div>
  );
}

export default AccommodationCard;