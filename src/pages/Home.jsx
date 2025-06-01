import Hero from '@/components/Hero';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';

function Home() {
  return (
    <Layout>
      <Hero />
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