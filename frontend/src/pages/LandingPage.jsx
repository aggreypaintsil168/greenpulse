import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Truck, Leaf, TrendingUp, ArrowRight, Droplets, AlertTriangle, Award, Recycle, Package, Zap } from 'lucide-react'

const stats = [
  { value: '20,000+', label: 'Informal waste pickers in Accra' },
  { value: '$800M',   label: 'Lost annually to unrecovered waste' },
  { value: '30%',     label: 'Fuel saved with optimized routing' },
  { value: '5kg CO₂', label: 'Saved per kg of plastic diverted' },
]

const features = [
  { icon: MapPin,   title: 'DrainWatch',       color: 'bg-blue-50 text-blue-600',    desc: 'Citizens scan QR codes and report blockages in under 60 seconds. Earn GreenPoints for every verified report.' },
  { icon: Truck,    title: 'Smart Routing',     color: 'bg-amber-50 text-amber-600',  desc: "Dijkstra's algorithm dispatches the nearest collector to the highest-priority drain, cutting fuel costs by 30%." },
  { icon: Recycle,  title: 'Recycler Hub',      color: 'bg-blue-50 text-blue-700',    desc: 'Plastic, organic, and e-waste recyclers browse available sorted waste, dispatch tricycles, and purchase directly from collectors.' },
  { icon: Leaf,     title: 'Carbon Ledger',     color: 'bg-green-50 text-green-700',  desc: 'Every kg collected becomes verified CO₂ savings. Collectors build a Green CV that unlocks bank loans.' },
  { icon: TrendingUp, title: 'Live Dashboard',  color: 'bg-purple-50 text-purple-600', desc: 'AMA and Zoomlion access real-time flood-risk heatmaps, collection stats, and predictive alerts by zone.' },
  { icon: Zap,      title: 'Tricycle Dispatch', color: 'bg-orange-50 text-orange-600', desc: 'Recyclers find available tricycles on a live map and send them on pickup errands with one tap.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gp-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gp-forest/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gp-mint rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-gp-forest" />
            </div>
            <span className="font-display font-bold text-white text-lg">Green<span className="text-gp-mint">Pulse</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/recycler/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Recycler Login</Link>
            <Link to="/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Collector Login</Link>
            <Link to="/report" className="btn-primary text-sm py-2 px-4">Report a Drain</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen bg-gp-forest flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gp-mint blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-gp-jade blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-gp-mint/20 border border-gp-mint/30 rounded-full px-4 py-1.5 text-gp-mint text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-gp-mint rounded-full animate-pulse" />
              Global Challenge Lab 2026 — Smart Cities Track
            </div>
            <h1 className="font-display font-extrabold text-5xl lg:text-6xl text-white leading-tight mb-6">
              From flooded drains<br />to <span className="text-gp-mint">carbon credits</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
              GreenPulse connects citizens who report drains, collectors who clear them,
              and recyclers who buy the sorted waste — all on one platform, powered by
              smartphones and smart algorithms.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/report" className="btn-primary flex items-center gap-2">Report a Drain <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/recycler" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2">
                <Recycle className="w-4 h-4" /> Recycler Portal
              </Link>
              <Link to="/dashboard" className="btn-secondary flex items-center gap-2">Live Dashboard</Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-colors">
                <div className="font-display font-bold text-3xl text-gp-mint mb-1">{s.value}</div>
                <div className="text-white/60 text-sm leading-snug">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Ecosystem flow */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl text-gp-slate mb-4">The Full Value Chain</h2>
            <p className="text-gp-grey max-w-2xl mx-auto">Four actors. One platform. Waste becomes wealth at every step.</p>
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {[
              { icon: '👤', role: 'Citizen',   action: 'Scans QR code, reports choked drain, earns GreenPoints',        color: 'bg-gp-foam border-gp-mint' },
              { icon: '🚲', role: 'Collector', action: 'Accepts job, clears drain, weighs & logs waste, earns revenue', color: 'bg-amber-50 border-amber-200' },
              { icon: '♻️', role: 'Recycler',  action: 'Browses sorted waste marketplace, dispatches tricycle, buys',   color: 'bg-blue-50 border-blue-200' },
              { icon: '🏙️', role: 'City (AMA)',action: 'Views real-time heatmap, flood alerts, and collection KPIs',    color: 'bg-purple-50 border-purple-200' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4 w-full lg:w-auto">
                <div className={`flex-1 lg:w-48 border-2 ${step.color} rounded-2xl p-5 text-center`}>
                  <div className="text-3xl mb-2">{step.icon}</div>
                  <div className="font-display font-bold text-gp-slate mb-1">{step.role}</div>
                  <div className="text-xs text-gp-grey leading-relaxed">{step.action}</div>
                </div>
                {i < 3 && <ArrowRight className="w-6 h-6 text-gp-mint flex-shrink-0 hidden lg:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gp-foam">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl text-gp-slate mb-4">Six Modules. One Platform.</h2>
            <p className="text-gp-grey max-w-xl mx-auto">No expensive IoT sensors — just people, smartphones, and algorithms.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, color, desc }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card-hover flex gap-4">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-gp-slate mb-1">{title}</h3>
                  <p className="text-gp-grey text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recycler CTA */}
      <section className="py-20 bg-blue-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6">
          <Recycle className="w-12 h-12 text-blue-300 mx-auto mb-4" />
          <h2 className="font-display font-bold text-4xl text-white mb-4">Are you a recycler in Accra?</h2>
          <p className="text-blue-200 mb-8">Browse available sorted plastic, organic, and e-waste. Dispatch a tricycle and pick it up. No middlemen.</p>
          <Link to="/recycler/login" className="btn-recycler inline-flex items-center gap-2 text-base">
            Access Recycler Hub <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="py-20 bg-gp-forest text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display font-bold text-4xl text-white mb-4">Ready to prevent the next flood?</h2>
          <p className="text-white/70 mb-8">Report a choked drain near you. Earn GreenPoints. Save a life.</p>
          <Link to="/report" className="btn-primary text-base inline-flex items-center gap-2">
            Report a Drain Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}