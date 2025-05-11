import Hero from '@/components/Hero'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'

function Home() {
  return (
    <Layout>
      <Hero />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <h2 className="text-3xl font-bold text-center mb-8 text-black">Featured Destinations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link to="/durban" className="block">
            <div className="bg-cover bg-center h-64 rounded-lg shadow-md" style={{ backgroundImage: 'url(https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/durban-bg.jpg)' }}>
              <div className="bg-black bg-opacity-50 h-full flex items-center justify-center rounded-lg">
                <h3 className="text-2xl font-semibold text-white">Durban</h3>
              </div>
            </div>
          </Link>
          <Link to="/capetown" className="block">
            <div className="bg-cover bg-center h-64 rounded-lg shadow-md" style={{ backgroundImage: 'url(https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/capetown-bg.jpg)' }}>
              <div className="bg-black bg-opacity-50 h-full flex items-center justify-center rounded-lg">
                <h3 className="text-2xl font-semibold text-white">Cape Town</h3>
              </div>
            </div>
          </Link>
          <Link to="/bangkok" className="block">
            <div className="bg-cover bg-center h-64 rounded-lg shadow-md" style={{ backgroundImage: 'url(https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/bangkok-bg.jpg)' }}>
              <div className="bg-black bg-opacity-50 h-full flex items-center justify-center rounded-lg">
                <h3 className="text-2xl font-semibold text-white">Bangkok</h3>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </Layout>
  )
}

export default Home