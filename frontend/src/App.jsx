import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import LandingPage      from './pages/LandingPage'
import CitizenReport    from './pages/CitizenReport'
import CollectorApp     from './pages/CollectorApp'
import CollectorLogin   from './pages/CollectorLogin'
import AdminDashboard   from './pages/AdminDashboard'
import GreenCV          from './pages/GreenCV'
import QRZones          from './pages/QRZones'
import RecyclerPortal   from './pages/RecyclerPortal'
import RecyclerLogin    from './pages/RecyclerLogin'
import RecyclerDashboard from './pages/RecyclerDashboard'
import NotFound         from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Layout />}>
        <Route path="/report"              element={<CitizenReport />} />
        <Route path="/collector"           element={<CollectorApp />} />
        <Route path="/login"               element={<CollectorLogin />} />
        <Route path="/dashboard"           element={<AdminDashboard />} />
        <Route path="/cv/:collectorId"     element={<GreenCV />} />
        <Route path="/zones"               element={<QRZones />} />
        <Route path="/recycler"            element={<RecyclerPortal />} />
        <Route path="/recycler/login"      element={<RecyclerLogin />} />
        <Route path="/recycler/dashboard"  element={<RecyclerDashboard />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
