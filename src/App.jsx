import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Durban from '@/pages/Durban';
import CapeTown from '@/pages/CapeTown';
import Bangkok from '@/pages/Bangkok';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-black test-bg-red-500">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/durban" element={<Durban />} />
            <Route path="/capetown" element={<CapeTown />} />
            <Route path="/bangkok" element={<Bangkok />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
