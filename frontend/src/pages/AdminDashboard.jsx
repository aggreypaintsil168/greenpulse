import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Users, Leaf, Activity, CloudRain, Recycle } from 'lucide-react'
import { dashboardAPI, weatherAPI } from '../lib/api'
import { ACCRA_CENTER, ACCRA_ZOOM } from '../lib/constants'

function PulseCounter({ value, unit, label }) {
  return (
    <div className="relative">
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gp-mint rounded-full animate-ping opacity-75" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gp-mint rounded-full" />
      <div className="font-mono font-bold text-4xl text-gp-mint">{typeof value === 'number' ? value.toFixed(1) : value}<span className="text-lg text-gp-jade ml-1">{unit}</span></div>
      <div className="text-white/60 text-sm mt-1">{label}</div>
    </div>
  )
}

const WASTE_COLORS = { PLASTIC: '#3B82F6', ORGANIC: '#8B4513', MIXED: '#6B7280', EWASTE: '#8B5CF6' }

export default function AdminDashboard() {
  const { data: summary, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => dashboardAPI.getSummary().then(r => r.data), refetchInterval: 60000 })
  const { data: weather } = useQuery({ queryKey: ['weather'], queryFn: () => weatherAPI.getForecast().then(r => r.data) })

  const pieData = summary?.byType?.map(t => ({ name: t.wasteType, value: parseFloat((t._sum?.weightKg || 0).toFixed(1)) })) || []
  const weeklyData = summary?.recentCollections?.slice(0, 7).map(c => ({
    day: new Date(c.createdAt).toLocaleDateString('en-GH', { weekday: 'short' }),
    kg: c.weightKg, co2: c.co2SavedKg,
  })).reverse() || []

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center"><div className="w-12 h-12 border-4 border-gp-mint border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-gp-grey">Loading dashboard...</p></div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gp-jade text-sm font-medium mb-2">
          <Activity className="w-4 h-4" /><span>Live — updates every 60 seconds</span><span className="w-2 h-2 bg-gp-mint rounded-full animate-pulse" />
        </div>
        <h1 className="font-display font-bold text-3xl text-gp-slate">City Operations Dashboard</h1>
        <p className="text-gp-grey">Real-time waste intelligence for Accra Metropolitan Assembly</p>
      </div>

      <div className="bg-gp-slate rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gp-mint/10 rounded-full blur-3xl" />
        <div className="relative grid sm:grid-cols-3 gap-8">
          <PulseCounter value={summary?.totalCO2Saved || 0} unit="kg" label="Total CO₂ diverted" />
          <PulseCounter value={summary?.totalKgCollected || 0} unit="kg" label="Total waste collected" />
          <PulseCounter value={summary?.clearedReports || 0} unit="" label="Drains cleared" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: AlertTriangle, label: 'Active reports', value: summary?.activeReports, color: 'text-red-500', bg: 'bg-red-50' },
          { icon: CheckCircle,   label: 'Drains cleared', value: summary?.clearedReports, color: 'text-gp-emerald', bg: 'bg-gp-foam' },
          { icon: Users,         label: 'Collectors',     value: summary?.topCollectors?.length, color: 'text-blue-500', bg: 'bg-blue-50' },
          { icon: Recycle,       label: 'Recycler orders', value: summary?.recyclerOrders || 0, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${color}`} /></div>
            <div className="font-display font-bold text-2xl text-gp-slate">{value ?? '—'}</div>
            <div className="text-sm font-medium text-gp-grey">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-display font-semibold text-gp-slate">Live Drain Heatmap — Accra</h2></div>
          <div className="h-80">
            <MapContainer center={ACCRA_CENTER} zoom={ACCRA_ZOOM} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {summary?.recentReports?.map(r => {
                const colors = { LOW: '#74C69D', MEDIUM: '#F4A261', HIGH: '#E63946', CRITICAL: '#9B1D1D' }
                return <CircleMarker key={r.id} center={[r.lat, r.lng]} radius={r.severity === 'HIGH' || r.severity === 'CRITICAL' ? 14 : 8}
                  fillColor={colors[r.severity] || '#74C69D'} color="white" weight={2} fillOpacity={0.85}>
                  <Popup><strong>{r.severity}</strong><br />{r.description || 'No description'}<br />Status: {r.status}</Popup>
                </CircleMarker>
              })}
            </MapContainer>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><CloudRain className="w-5 h-5 text-blue-400" /><h2 className="font-display font-semibold text-gp-slate">7-Day Rain Forecast</h2></div>
          <div className="space-y-2">
            {weather?.forecast?.slice(0, 7).map((day, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gp-grey w-20">{new Date(day.date).toLocaleDateString('en-GH', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <div className="flex items-center gap-1">
                  <div className="w-20 bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${Math.min(day.rainProbPct, 100)}%` }} /></div>
                  <span className="text-xs text-gp-grey w-8">{day.rainProbPct}%</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${day.floodRisk === 'HIGH' ? 'bg-red-100 text-red-600' : day.floodRisk === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-700'}`}>{day.floodRisk}</span>
              </div>
            )) || <p className="text-gp-grey text-sm">Weather data loading...</p>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="font-display font-semibold text-gp-slate mb-4">Weekly Collection Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData}>
              <defs><linearGradient id="kgGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#40916C" stopOpacity={0.3} /><stop offset="95%" stopColor="#40916C" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip formatter={(v) => [`${v.toFixed(1)}kg`]} />
              <Area type="monotone" dataKey="kg" stroke="#2D6A4F" fill="url(#kgGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="font-display font-semibold text-gp-slate mb-4">Waste Composition</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={3}>
                {pieData.map(entry => <Cell key={entry.name} fill={WASTE_COLORS[entry.name] || '#ccc'} />)}
              </Pie><Tooltip formatter={v => [`${v}kg`]} /><Legend /></PieChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-48 text-gp-grey text-sm">No collection data yet.</div>}
        </div>
      </div>

      <div className="card">
        <h2 className="font-display font-semibold text-gp-slate mb-4">Top Collectors — This Season</h2>
        {summary?.topCollectors?.length > 0 ? (
          <div className="space-y-3">
            {summary.topCollectors.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gp-foam transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-gp-foam text-gp-grey'}`}>{i + 1}</div>
                <div className="flex-1"><div className="font-medium text-gp-slate">{c.name}</div><div className="text-xs text-gp-grey">{c.zone || 'All areas'}</div></div>
                <div className="text-right"><div className="font-mono font-bold text-gp-forest">{c.totalKgLifetime?.toFixed(1)}kg</div><div className="text-xs text-gp-grey">{c.totalCO2Lifetime?.toFixed(1)}kg CO₂</div></div>
                <div className="text-amber-500 font-bold text-sm">{c.greenPoints} pts</div>
              </div>
            ))}
          </div>
        ) : <p className="text-gp-grey text-sm text-center py-6">No collections yet.</p>}
      </div>
    </div>
  )
}
