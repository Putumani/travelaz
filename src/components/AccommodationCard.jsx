import { affiliateId } from '../affiliateConfig';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

function AccommodationCard({ accommodation }) {
  const bookingLink = `https://www.travelstart.co.za/affiliate?affiliate_id=${affiliateId}&hotel=${encodeURIComponent(accommodation.name.replace(/\s+/g, '-').toLowerCase())}&city=${accommodation.city}`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
      <LazyLoadImage
        src={`${accommodation.image_url}?monochrome=000000`}
        alt={accommodation.name}
        effect="blur"
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
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