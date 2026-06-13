import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CoinPage from './pages/CoinPage'
import AddStory from './pages/AddStory'
import PassCoin from './pages/PassCoin'
import KeeperProfile from './pages/KeeperProfile'
import Admin from './pages/Admin'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import About from './pages/About'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/coin/:slug" element={<CoinPage />} />
        <Route path="/coin/:slug/add" element={<AddStory />} />
        <Route path="/coin/:slug/pass" element={<PassCoin />} />
        <Route path="/keeper/:id" element={<KeeperProfile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}
