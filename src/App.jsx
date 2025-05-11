import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Bangkok from './pages/Bangkok'
import CapeTown from './pages/CapeTown'
import Durban from './pages/Durban'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bangkok" element={<Bangkok />} />
      <Route path="/capetown" element={<CapeTown />} />
      <Route path="/durban" element={<Durban />} />
    </Routes>
  )
}

export default App