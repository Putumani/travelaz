import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">travelaz</Link>
        <nav>
          <ul className="flex space-x-6">
            <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
            <li><Link to="/durban" className="hover:text-gray-300">Durban</Link></li>
            <li><Link to="/capetown" className="hover:text-gray-300">Cape Town</Link></li>
            <li><Link to="/bangkok" className="hover:text-gray-300">Bangkok</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header