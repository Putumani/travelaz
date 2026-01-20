import { useTranslation } from '../i18n/useTranslation';
import { useState, useEffect } from 'react';

function Hero() {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [cloudinaryName, setCloudinaryName] = useState('');
  
  useEffect(() => {
    const name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    setCloudinaryName(name);
    console.log('Cloudinary Cloud Name:', name);
  }, []);

  const getHeroImageUrl = () => {
    if (!cloudinaryName) {
      console.warn('Cloudinary cloud name not found');
      return '';
    }

    const imageOptions = [
      `https://res.cloudinary.com/${cloudinaryName}/image/upload/w_1920,h_1080,c_fill,q_auto,f_auto,e_sharpen/v1759506368/new_hero_dpejen.jpg`,
      
      `https://res.cloudinary.com/${cloudinaryName}/image/upload/w_1920,h_1080,c_fill,q_auto,f_auto/new_hero_dpejen.jpg`,
      
      `https://res.cloudinary.com/${cloudinaryName}/image/upload/new_hero_dpejen.jpg`,
      
      `https://res.cloudinary.com/${cloudinaryName}/image/upload/v1759506368/new_hero_dpejen`,
      `https://res.cloudinary.com/${cloudinaryName}/image/upload/new_hero_dpejen`,
    ];

    console.log('Hero Image URL Options:', imageOptions);
    
    return imageOptions[0];
  };

  const backgroundUrl = getHeroImageUrl();

  const fallbackImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
    'https://images.unsplash.com/photo-1564501049418-3c27787d01e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
  ];

  const handleImageError = () => {
    console.error('Hero image failed to load:', backgroundUrl);
    setImageError(true);
  };

  useEffect(() => {
    if (cloudinaryName) {
      const testImage = new Image();
      const testUrl = `https://res.cloudinary.com/${cloudinaryName}/image/upload/w_100,h_100,c_fill/sample.jpg`;
      
      testImage.onload = () => {
        console.log('Cloudinary connection successful - sample image loaded');
      };
      
      testImage.onerror = () => {
        console.error('Cloudinary connection failed - check cloud name and configuration');
      };
      
      testImage.src = testUrl;
    }
  }, [cloudinaryName]);

  const getCurrentBackgroundUrl = () => {
    if (imageError) {
      return fallbackImages[0];
    }
    return backgroundUrl;
  };

  return (
    <div
      className="relative bg-cover bg-center h-[60vh] sm:h-[calc(100vh-60px)] min-h-[200px] transition-all duration-500"
      style={{ 
        backgroundImage: `url(${getCurrentBackgroundUrl()})`,
        imageRendering: 'auto'
      }}
      aria-label={t('HeroSectionDescription')}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center text-center z-10">
        <div className="animate-fade-in">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-lg">
            {t('ExploreTopHotels')}
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-white max-w-2xl mx-auto drop-shadow-md">
            {t('BookBestAccommodations', {
              durban: t('Durban'),
              capeTown: t('CapeTown'),
              bangkok: t('Bangkok')
            })}
          </p>
        </div>
      </div>

      {!imageError && backgroundUrl && (
        <img
          src={backgroundUrl}
          alt=""
          style={{ display: 'none' }}
          onError={handleImageError}
          onLoad={() => console.log('Hero image loaded successfully')}
        />
      )}
    </div>
  );
}

export default Hero;