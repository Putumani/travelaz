import { Link } from 'react-router-dom';
import { useState } from 'react';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl sm:text-2xl font-bold">travelaz</Link>
        <button
          className="sm:hidden focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
        <nav className={`sm:flex ${isMenuOpen ? 'block' : 'hidden'} sm:block absolute sm:static top-16 left-0 w-full sm:w-auto bg-black sm:bg-transparent`}>
          <ul className="flex flex-col sm:flex-row sm:space-x-6 p-4 sm:p-0">
            <li className="mb-2 sm:mb-0"><Link to="/" className="text-base sm:text-lg hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
            <li className="mb-2 sm:mb-0"><Link to="/durban" className="text-base sm:text-lg hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Durban</Link></li>
            <li className="mb-2 sm:mb-0"><Link to="/capetown" className="text-base sm:text-lg hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Cape Town</Link></li>
            <li className="mb-2 sm:mb-0"><Link to="/bangkok" className="text-base sm:text-lg hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Bangkok</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;