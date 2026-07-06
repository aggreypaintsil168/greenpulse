import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Recycle, Truck, Package, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react'
import { RECYCLER_TYPES, PRICE_PER_KG_GHS } from '../lib/constants'

const steps = [
  { icon: '🔍', title: 'Browse Marketplace', desc: 'Filter available sorted waste by type (plastic, organic, e-waste), zone, and minimum quantity.' },
  { icon: '📋', title: 'Place an Order', desc: 'Select a waste batch from a verified collector and confirm the quantity and price per kg.' },
  { icon: '🛺', title: 'Dispatch a Tricycle', desc: 'See available tricycles near the collection point on a live map. Assign one with a single tap.' },
  { icon: '⚖️', title: 'Verify & Pay', desc: 'Tricycle arrives, weighs the waste at the source, and delivers to your plant. Payment logged on platform.' },
]

export default function RecyclerPortal() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Recycle className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="font-display font-bold text-4xl text-gp-slate mb-4">Recycler Hub</h1>
        <p className="text-gp-grey max-w-2xl mx-auto text-lg">
          Connect directly with collectors who have sorted, weighed waste ready for pickup.
          Dispatch a tricycle, buy at fair prices, no middlemen.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to="/recycler/login" className="btn-recycler flex items-center gap-2">
            Access Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/recycler/login" className="btn-secondary flex items-center gap-2">
            Register Business
          </Link>
        </div>
      </motion.div>

      {/* Recycler types */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {Object.entries(RECYCLER_TYPES).map(([key, val], i) => (
          <motion.div key={key} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className={`border-2 rounded-2xl p-5 text-center`} style={{ borderColor: val.color + '40', background: val.bg }}>
            <div className="font-display font-bold text-sm mb-1" style={{ color: val.color }}>{val.label}</div>
            <div className="text-xs text-gp-grey">Accepts:</div>
            <div className="flex flex-wrap justify-center gap-1 mt-1">
              {val.accepts.map(a => (
                <span key={a} className="text-xs bg-white/80 rounded-full px-2 py-0.5 font-medium" style={{ color: val.color }}>{a}</span>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-black/5">
              <div className="text-xs text-gp-grey">Market price</div>
              <div className="font-mono font-bold text-sm" style={{ color: val.color }}>
                GHS {val.accepts.map(a => PRICE_PER_KG_GHS[a] || 0.8).sort((a,b)=>b-a)[0].toFixed(2)}/kg
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* How it works */}
      <div className="card mb-12">
        <h2 className="font-display font-bold text-2xl text-gp-slate mb-8 text-center">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-3">{step.icon}</div>
              <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">
                {i + 1}
              </div>
              <h3 className="font-display font-semibold text-gp-slate text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-gp-grey leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-blue-900 rounded-3xl p-8 text-white">
        <h2 className="font-display font-bold text-2xl mb-6 text-center">Why join GreenPulse as a Recycler?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            'Pre-sorted waste — collectors log waste type before listing',
            'Live tricycle dispatch — no phone calls, no guessing',
            'Dual-weigh verification — weight confirmed at source and delivery',
            'Transaction history for EPR compliance reporting',
            'Carbon credit contributions tracked automatically',
            'Direct link to 20,000+ informal collectors across Accra',
          ].map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
              <span className="text-blue-100 text-sm">{b}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/recycler/login" className="btn-recycler inline-flex items-center gap-2">
            Register Your Business <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
