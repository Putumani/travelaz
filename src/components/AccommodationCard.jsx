// import { getCloudinaryImageUrl } from '@/utils/cloudinary';
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'

function AccommodationCard({ accommodation }) {
  if (!accommodation) {
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
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-gray-300 min-h-[400px] flex flex-col">
      <div className="relative h-48 bg-gray-100 flex items-center justify-center">
        <LazyLoadImage
          src={accommodation.image_url || `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_600,h_400,c_fill/default-placeholder`}
          onError={(e) => {
            e.target.src = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_600,h_400,c_fill/default-placeholder`;
          }}
        />
      </div>
      <div className="p-4 flex-grow">
        <h3 className="text-lg font-semibold text-black">{accommodation.name}</h3>
        <p className="text-gray-600 mt-1">{accommodation.area}</p>
        <p className="text-gray-600 mt-1">From ${accommodation.price}/night</p>
        <p className="text-gray-500 mt-1">Rating: {accommodation.rating}/5</p>
        <p className="text-gray-600 mt-2 text-sm">{accommodation.description}</p>
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Book Now
        </a>
      </div>
    </div>
  )
}

export default AccommodationCard