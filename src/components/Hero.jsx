import { useTranslation } from '../i18n/useTranslation';

function Hero() {
  const { t } = useTranslation();
  const backgroundUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_1920,h_1080,c_fill,q_auto,f_auto,e_sharpen/v1759506368/new_hero_dpejen.jpg`;

  return (
    <div
      className="relative bg-cover bg-center h-[60vh] sm:h-[calc(100vh-60px)] min-h-[200px]"
      style={{ backgroundImage: `url(${backgroundUrl})`, imageRendering: 'auto' }}
      aria-label={t('HeroSectionDescription')}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center text-center z-10">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">{t('ExploreTopHotels')}</h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-white max-w-2xl">
            {t('BookBestAccommodations', {
              durban: t('Durban'),
              capeTown: t('CapeTown'),
              bangkok: t('Bangkok')
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;