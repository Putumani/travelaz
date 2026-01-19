import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

function FeaturedDestinationCard({ city, title, description, path }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const mountedRef = useRef(true);
  
  const cityConfig = {
    durban: {
      publicId: 'Durban-Beach-View_pgvgag',
      fallback: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80'
    },
    capetown: {
      publicId: 'pexels-jvdm-3736245_d6d1jc',
      fallback: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80'
    },
    bangkok: {
      publicId: 'pexels-jimmy-teoh-294331-2402000_y1e72y',
      fallback: 'https://images.unsplash.com/photo-1552465011-b4e30bf7349d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80'
    }
  };

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getImageUrl = () => {
    if (!cloudName) {
      console.warn(`${city}: Cloudinary cloud name not found`);
      return cityConfig[city].fallback;
    }
    
    const publicId = cityConfig[city].publicId;
    
    const urlOptions = [
      `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_400,c_fill,q_auto,f_auto/${publicId}`,
      `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_400,c_fill,q_auto/${publicId}`,
      `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_400,c_fill/${publicId}`,
      `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`,
    ];
    
    return urlOptions[0];
  };

  const imageUrl = getImageUrl();
  const displayUrl = imageError ? cityConfig[city].fallback : imageUrl;

  useEffect(() => {
    if (!mountedRef.current) return;

    const img = new Image();
    img.src = imageUrl;
    
    img.onload = () => {
      if (mountedRef.current) {
        console.log(`✅ ${city} image loaded from Cloudinary`);
        setImageLoaded(true);
      }
    };
    
    img.onerror = () => {
      if (mountedRef.current) {
        console.warn(`❌ ${city} Cloudinary image failed, using fallback`);
        setImageError(true);
        setImageLoaded(true); 
      }
    };

    const timeoutId = setTimeout(() => {
      if (mountedRef.current && !imageLoaded && !imageError) {
        console.log(`⏰ ${city} image load timeout, using fallback`);
        setImageError(true);
        setImageLoaded(true);
      }
    }, 5000); 

    return () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, city, imageLoaded, imageError]);

  if (!imageLoaded) {
    return (
      <div className="block">
        <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg shadow-md h-52 sm:h-56 lg:h-64 overflow-hidden animate-pulse">
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="h-7 w-36 bg-gray-300 rounded-lg mb-3"></div>
            <div className="h-4 w-48 bg-gray-300 rounded"></div>
            <div className="mt-4 text-sm text-gray-500">Loading {title}...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link 
      to={path} 
      className="block group transition-all duration-300 hover:-translate-y-1"
      aria-label={`Explore accommodations in ${title}`}
    >
      <div className="relative rounded-xl shadow-lg overflow-hidden h-52 sm:h-56 lg:h-64 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110"
          style={{ 
            backgroundImage: `url(${displayUrl})`,
            backgroundPosition: 'center center'
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
            {title}
          </h3>
          
          <div className="mt-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-white text-sm font-semibold bg-blue-600/90 px-4 py-2 rounded-full backdrop-blur-sm">
              Explore Hotels →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default FeaturedDestinationCard;