import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Bangkok from './pages/Bangkok'
import CapeTown from './pages/CapeTown'
import Durban from './pages/Durban'
import AllDestinations from './pages/AllDestinations';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bangkok" element={<Bangkok />} />
      <Route path="/capetown" element={<CapeTown />} />
      <Route path="/durban" element={<Durban />} />
      <Route path="/all-destinations" element={<AllDestinations />} />
    </Routes>
  )
}

export default App