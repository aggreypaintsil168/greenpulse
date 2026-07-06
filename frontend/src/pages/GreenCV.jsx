import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Leaf, Star, Award, TrendingUp, Scale, Droplets, Calendar, ArrowLeft, Share2 } from 'lucide-react'
import { collectorAPI } from '../lib/api'
import toast from 'react-hot-toast'

const WASTE_COLORS = {
  PLASTIC: 'bg-blue-100 text-blue-600',
  ORGANIC: 'bg-amber-100 text-amber-700',
  MIXED:   'bg-gray-100 text-gray-600',
  EWASTE:  'bg-purple-100 text-purple-600',
}

export default function GreenCV() {
  const { collectorId } = useParams()
  const { data: collector, isLoading } = useQuery({
    queryKey: ['collector', collectorId],
    queryFn: () => collectorAPI.getProfile(collectorId).then(r => r.data),
  })

  const share = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Green CV link copied!')
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-gp-mint border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!collector) return (
    <div className="text-center py-20">
      <p className="text-gp-grey">Collector not found.</p>
      <Link to="/collector" className="btn-secondary mt-4 inline-block">Back to App</Link>
    </div>
  )

  const joinedDate = new Date(collector.createdAt)
  const monthsActive = Math.max(1, Math.round((Date.now() - joinedDate) / (1000 * 60 * 60 * 24 * 30)))
  const avgKgPerMonth = (collector.totalKgLifetime / monthsActive).toFixed(1)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link to="/collector" className="flex items-center gap-2 text-gp-grey hover:text-gp-forest transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <button onClick={share} className="flex items-center gap-2 btn-secondary text-sm py-2 px-4">
          <Share2 className="w-4 h-4" /> Share CV
        </button>
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gp-forest rounded-3xl p-8 text-white mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gp-mint/10 rounded-full blur-2xl" />
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="w-16 h-16 bg-gp-mint/20 rounded-2xl flex items-center justify-center mb-3">
              <Leaf className="w-8 h-8 text-gp-mint" />
            </div>
            <h1 className="font-display font-bold text-2xl">{collector.name}</h1>
            <p className="text-white/60 text-sm">Waste Collector · {collector.zone || 'Greater Accra'}</p>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-4xl text-gp-mint">{collector.greenPoints}</div>
            <div className="text-white/60 text-sm">GreenPoints</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
          <div className="text-center">
            <div className="font-mono font-bold text-2xl text-gp-mint">{collector.totalKgLifetime?.toFixed(0)}kg</div>
            <div className="text-white/60 text-xs">Waste Collected</div>
          </div>
          <div className="text-center">
            <div className="font-mono font-bold text-2xl text-gp-mint">{collector.totalCO2Lifetime?.toFixed(1)}kg</div>
            <div className="text-white/60 text-xs">CO₂ Diverted</div>
          </div>
          <div className="text-center">
            <div className="font-mono font-bold text-2xl text-gp-mint">{collector.collections?.length || 0}</div>
            <div className="text-white/60 text-xs">Jobs Completed</div>
          </div>
        </div>
      </motion.div>

      {/* Impact */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-6">
        <h2 className="font-display font-semibold text-gp-slate mb-4">Environmental Impact</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Droplets,   label: 'Drains cleared',      value: collector.collections?.length || 0, unit: 'drains' },
            { icon: TrendingUp, label: 'Avg per month',        value: avgKgPerMonth, unit: 'kg/mo' },
            { icon: Scale,      label: 'Plastic equivalent',   value: (collector.totalKgLifetime * 0.6).toFixed(0), unit: 'bottles' },
            { icon: Calendar,   label: 'Member since',         value: joinedDate.toLocaleDateString('en-GH', { month: 'short', year: 'numeric' }), unit: '' },
          ].map(({ icon: Icon, label, value, unit }) => (
            <div key={label} className="bg-gp-foam rounded-xl p-4">
              <Icon className="w-5 h-5 text-gp-jade mb-2" />
              <div className="font-mono font-bold text-lg text-gp-forest">{value} <span className="text-xs font-sans text-gp-grey">{unit}</span></div>
              <div className="text-xs text-gp-grey">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* History */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-6">
        <h2 className="font-display font-semibold text-gp-slate mb-4">Collection History</h2>
        {collector.collections?.length > 0 ? (
          <div className="space-y-3">
            {collector.collections.map(c => (
              <div key={c.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${WASTE_COLORS[c.wasteType] || 'bg-gray-100 text-gray-600'}`}>{c.wasteType}</span>
                  <span className="text-sm text-gp-grey">{new Date(c.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-gp-forest text-sm">{c.weightKg}kg</div>
                  <div className="text-xs text-gp-grey">{c.co2SavedKg?.toFixed(1)}kg CO₂</div>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-gp-grey text-sm text-center py-6">No collections yet.</p>}
      </motion.div>

      {/* Banking note */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Verified Green Worker</p>
            <p className="text-amber-700 text-xs mt-1">
              This Green CV is a verified record of {collector.name}'s waste collection history, CO₂ contributions,
              and GreenPoints earned via the GreenPulse platform. Suitable for micro-loan applications and EPR compliance reporting.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
