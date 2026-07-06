import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { motion } from 'framer-motion'
import { MapPin, CheckCircle, Navigation, Leaf, Star, LogOut, AlertTriangle, Loader2, Scale } from 'lucide-react'
import toast from 'react-hot-toast'
import L from 'leaflet'
import { reportAPI, collectionAPI, routingAPI } from '../lib/api'
import { WASTE_TYPES, ACCRA_CENTER, ACCRA_ZOOM, SEVERITY_LEVELS } from '../lib/constants'
import clsx from 'clsx'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function CollectorApp() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [collector, setCollector] = useState(null)
  const [activeReport, setActiveReport] = useState(null)
  const [route, setRoute] = useState(null)
  const [logForm, setLogForm] = useState({ weightKg: '', wasteType: 'MIXED' })

  useEffect(() => {
    const stored = localStorage.getItem('gp_collector')
    if (!stored) { navigate('/login'); return }
    setCollector(JSON.parse(stored))
  }, [])

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportAPI.getAll().then(r => r.data),
    refetchInterval: 30000,
  })

  const routeMutation = useMutation({
    mutationFn: (report) => routingAPI.optimize({ collectorLat: ACCRA_CENTER[0], collectorLng: ACCRA_CENTER[1], targets: [{ lat: report.lat, lng: report.lng, id: report.id }] }),
    onSuccess: () => { setRoute([[ACCRA_CENTER[0], ACCRA_CENTER[1]], [activeReport.lat, activeReport.lng]]); toast.success('Route optimized!') },
  })

  const logMutation = useMutation({
    mutationFn: () => collectionAPI.log({ drainReportId: activeReport.id, weightKg: parseFloat(logForm.weightKg), wasteType: logForm.wasteType }),
    onSuccess: (res) => {
      toast.success(`✅ Logged! +${res.data.pointsEarned} GreenPoints. Now listed on Recycler Marketplace.`)
      setActiveReport(null); setRoute(null); setLogForm({ weightKg: '', wasteType: 'MIXED' })
      qc.invalidateQueries(['reports'])
      const updated = { ...collector, greenPoints: (collector.greenPoints || 0) + (res.data.pointsEarned || 0) }
      localStorage.setItem('gp_collector', JSON.stringify(updated)); setCollector(updated)
    },
    onError: () => toast.error('Failed to log collection'),
  })

  const assignReport = async (report) => {
    setActiveReport(report)
    await reportAPI.updateStatus(report.id, { status: 'ASSIGNED' })
    routeMutation.mutate(report)
    qc.invalidateQueries(['reports'])
  }

  if (!collector) return null
  const pendingReports = reports.filter(r => r.status === 'PENDING')
  const highPriority = pendingReports.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-gp-slate">Welcome, {collector.name}</h1>
          <p className="text-gp-grey text-sm">Zone: {collector.zone || 'All Areas'} · Cleared waste appears on Recycler Marketplace automatically.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/cv/${collector.id}`} className="flex items-center gap-2 bg-gp-foam border border-gp-mint px-4 py-2 rounded-xl text-sm font-medium text-gp-forest hover:bg-gp-mint transition-colors">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />{collector.greenPoints || 0} pts
          </Link>
          <button onClick={() => { localStorage.removeItem('gp_token'); localStorage.removeItem('gp_collector'); navigate('/login') }}
            className="p-2 text-gp-grey hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {highPriority.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div><p className="font-semibold text-red-700 text-sm">{highPriority.length} HIGH priority drain{highPriority.length > 1 ? 's' : ''}</p>
                <p className="text-red-600 text-xs mt-0.5">Heavy rain forecast — clear these first</p></div>
            </motion.div>
          )}
          <h2 className="font-display font-semibold text-gp-slate">Active Jobs ({pendingReports.length})</h2>
          {isLoading ? (
            <div className="card text-center py-8 text-gp-grey"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gp-jade" />Loading jobs...</div>
          ) : pendingReports.length === 0 ? (
            <div className="card text-center py-8"><CheckCircle className="w-10 h-10 text-gp-mint mx-auto mb-2" /><p className="font-medium text-gp-slate">All drains cleared!</p></div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {pendingReports.map(r => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className={clsx('card cursor-pointer border-2 transition-all', activeReport?.id === r.id ? 'border-gp-emerald bg-gp-foam' : 'border-transparent hover:border-gp-mint')}
                  onClick={() => assignReport(r)}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`badge-${r.severity === 'HIGH' || r.severity === 'CRITICAL' ? 'high' : r.severity === 'MEDIUM' ? 'medium' : 'low'}`}>{r.severity}</span>
                    <span className="text-xs text-gp-grey">{new Date(r.createdAt).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm font-mono text-gp-slate">{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</p>
                  {r.description && <p className="text-xs text-gp-grey mt-1 line-clamp-2">{r.description}</p>}
                  {activeReport?.id !== r.id && (
                    <button className="mt-3 w-full text-xs font-medium text-gp-emerald flex items-center justify-center gap-1 py-1.5 bg-gp-foam rounded-lg hover:bg-gp-mint transition-colors">
                      <Navigation className="w-3 h-3" /> Accept Job
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="h-80 lg:h-96 rounded-2xl overflow-hidden shadow-sm">
            <MapContainer center={ACCRA_CENTER} zoom={ACCRA_ZOOM} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {pendingReports.map(r => (
                <Marker key={r.id} position={[r.lat, r.lng]}>
                  <Popup><div className="text-sm"><strong className={r.severity === 'HIGH' ? 'text-red-600' : 'text-amber-600'}>{r.severity}</strong><br />{r.description || 'No description'}<br />
                    <button onClick={() => assignReport(r)} className="mt-1 text-gp-emerald font-medium">Accept →</button></div></Popup>
                </Marker>
              ))}
              {route && <Polyline positions={route} color="#2D6A4F" weight={4} dashArray="8,4" />}
            </MapContainer>
          </div>

          {activeReport && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card border-2 border-gp-mint">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-gp-slate">Log Collection</h3>
                <span className="badge-medium">Active Job</span>
              </div>
              <p className="text-xs text-gp-grey mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                💡 Once you log this collection, the waste will automatically appear on the <strong>Recycler Marketplace</strong> for recyclers to purchase and dispatch a tricycle.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><label className="text-sm font-medium text-gp-slate block mb-1"><Scale className="w-4 h-4 inline mr-1" />Weight (kg)</label>
                  <input type="number" min="0.1" step="0.1" value={logForm.weightKg} onChange={e => setLogForm({ ...logForm, weightKg: e.target.value })} placeholder="e.g. 12.5" className="input-field" /></div>
                <div><label className="text-sm font-medium text-gp-slate block mb-1">Waste type</label>
                  <select value={logForm.wasteType} onChange={e => setLogForm({ ...logForm, wasteType: e.target.value })} className="input-field">
                    {Object.entries(WASTE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select></div>
              </div>
              {logForm.weightKg && (
                <div className="bg-gp-foam rounded-xl p-3 mb-4 grid grid-cols-3 gap-3 text-center text-sm">
                  <div><div className="font-mono font-bold text-gp-forest">{(parseFloat(logForm.weightKg || 0) * (WASTE_TYPES[logForm.wasteType]?.co2Factor || 1.5)).toFixed(1)}kg</div><div className="text-gp-grey text-xs">CO₂ saved</div></div>
                  <div><div className="font-mono font-bold text-gp-forest">GHS {(parseFloat(logForm.weightKg || 0) * 0.6).toFixed(2)}</div><div className="text-gp-grey text-xs">Your earnings</div></div>
                  <div><div className="font-mono font-bold text-amber-500">+{Math.floor(parseFloat(logForm.weightKg || 0) * 3)}</div><div className="text-gp-grey text-xs">GreenPoints</div></div>
                </div>
              )}
              <button onClick={() => logMutation.mutate()} disabled={!logForm.weightKg || logMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {logMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Logging...</> : <><CheckCircle className="w-4 h-4" />Mark as Cleared & List on Marketplace</>}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
