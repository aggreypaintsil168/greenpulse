import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Recycle, Package, Truck, MapPin, Filter, LogOut, CheckCircle,
  Loader2, Scale, TrendingUp, Clock, Star, RefreshCw, Send, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import L from 'leaflet'
import { recyclerAPI } from '../lib/api'
import { WASTE_TYPES, RECYCLER_TYPES, DISPATCH_STATUS, ACCRA_CENTER, ACCRA_ZOOM, PRICE_PER_KG_GHS } from '../lib/constants'
import clsx from 'clsx'

// Custom marker icons
const makeIcon = (color) => new L.DivIcon({
  html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  className: '', iconAnchor: [8, 8],
})

const TRICYCLE_ICON = new L.DivIcon({
  html: `<div style="font-size:22px;line-height:1">🛺</div>`,
  className: '', iconAnchor: [11, 11],
})

function WasteTypeBadge({ type }) {
  const wt = WASTE_TYPES[type]
  if (!wt) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: wt.color + '20', color: wt.color }}>
      {wt.icon} {wt.label}
    </span>
  )
}

function DispatchStatusBadge({ status }) {
  const s = DISPATCH_STATUS[status] || DISPATCH_STATUS.PENDING
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.color + '20', color: s.color }}>
      {s.label}
    </span>
  )
}

export default function RecyclerDashboard() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [recycler, setRecycler] = useState(null)
  const [activeTab, setActiveTab] = useState('marketplace') // marketplace | dispatch | orders
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [selectedTricycle, setSelectedTricycle] = useState(null)
  const [orderForm, setOrderForm] = useState({ requestedKg: '', pricePerKgGHS: '', notes: '' })

  useEffect(() => {
    const stored = localStorage.getItem('gp_recycler')
    if (!stored) { navigate('/recycler/login'); return }
    setRecycler(JSON.parse(stored))
  }, [])

  // Marketplace: available cleared waste batches
  const { data: marketplace = [], isLoading: mktLoading, refetch: refetchMkt } = useQuery({
    queryKey: ['marketplace', typeFilter],
    queryFn: () => recyclerAPI.getMarketplace({ type: typeFilter === 'ALL' ? '' : typeFilter }).then(r => r.data),
    refetchInterval: 60000,
  })

  // Available tricycles
  const { data: tricycles = [], isLoading: triLoading } = useQuery({
    queryKey: ['tricycles'],
    queryFn: () => recyclerAPI.getAvailableTricycles().then(r => r.data),
    enabled: activeTab === 'dispatch',
    refetchInterval: 30000,
  })

  // My orders
  const { data: myOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['myOrders', recycler?.id],
    queryFn: () => recyclerAPI.getOrders(recycler.id).then(r => r.data),
    enabled: !!recycler && activeTab === 'orders',
  })

  // My dispatches
  const { data: myDispatches = [] } = useQuery({
    queryKey: ['myDispatches', recycler?.id],
    queryFn: () => recyclerAPI.getDispatches(recycler.id).then(r => r.data),
    enabled: !!recycler && activeTab === 'dispatch',
  })

  const orderMutation = useMutation({
    mutationFn: () => recyclerAPI.placeOrder({
      recyclerId: recycler.id,
      collectionId: selectedBatch.id,
      requestedKg: parseFloat(orderForm.requestedKg),
      pricePerKgGHS: parseFloat(orderForm.pricePerKgGHS),
      notes: orderForm.notes,
    }),
    onSuccess: () => {
      toast.success('Order placed! Now dispatch a tricycle to collect.')
      setSelectedBatch(null)
      setOrderForm({ requestedKg: '', pricePerKgGHS: '', notes: '' })
      qc.invalidateQueries(['marketplace'])
      qc.invalidateQueries(['myOrders'])
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Order failed'),
  })

  const dispatchMutation = useMutation({
    mutationFn: () => recyclerAPI.dispatchTricycle({
      recyclerId: recycler.id,
      tricycleId: selectedTricycle.id,
      orderId: selectedBatch?.orderId,
      targetLat: selectedBatch?.lat,
      targetLng: selectedBatch?.lng,
    }),
    onSuccess: () => {
      toast.success(`🛺 Tricycle dispatched to collect ${selectedBatch?.wasteType} waste!`)
      setSelectedTricycle(null)
      setSelectedBatch(null)
      qc.invalidateQueries(['tricycles'])
      qc.invalidateQueries(['myDispatches'])
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Dispatch failed'),
  })

  const cancelDispatchMutation = useMutation({
    mutationFn: (id) => recyclerAPI.updateDispatch(id, { status: 'CANCELLED' }),
    onSuccess: () => {
      toast.success('Dispatch cancelled')
      qc.invalidateQueries(['myDispatches'])
    },
  })

  const logout = () => {
    localStorage.removeItem('gp_recycler_token')
    localStorage.removeItem('gp_recycler')
    navigate('/recycler/login')
  }

  if (!recycler) return null

  const recyclerTypeInfo = RECYCLER_TYPES[recycler.recyclerType] || RECYCLER_TYPES.GENERAL
  const acceptedTypes = recyclerTypeInfo.accepts

  // Filter marketplace to only types this recycler accepts
  const filteredMarket = marketplace.filter(b =>
    typeFilter === 'ALL' ? acceptedTypes.includes(b.wasteType) : b.wasteType === typeFilter
  )

  const tabs = [
    { id: 'marketplace', label: 'Waste Marketplace', icon: Package, count: filteredMarket.length },
    { id: 'dispatch',    label: 'Tricycle Dispatch',  icon: Truck,   count: myDispatches.filter(d => d.status === 'DISPATCHED').length },
    { id: 'orders',      label: 'My Orders',          icon: CheckCircle, count: myOrders.length },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: recyclerTypeInfo.bg }}>
              <Recycle className="w-4 h-4" style={{ color: recyclerTypeInfo.color }} />
            </div>
            <h1 className="font-display font-bold text-2xl text-gp-slate">{recycler.companyName}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gp-grey">
            <span className="font-semibold" style={{ color: recyclerTypeInfo.color }}>{recyclerTypeInfo.label}</span>
            <span>·</span>
            <MapPin className="w-3 h-3" />
            <span>{recycler.zone || 'Greater Accra'}</span>
          </div>
        </div>
        <button onClick={logout} className="p-2 text-gp-grey hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Orders placed', value: myOrders.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active dispatches', value: myDispatches.filter(d=>d.status==='DISPATCHED').length, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Waste types accepted', value: acceptedTypes.length, icon: Recycle, color: 'text-gp-emerald', bg: 'bg-gp-foam' },
          { label: 'Market listings', value: filteredMarket.length, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="font-display font-bold text-2xl text-gp-slate">{value}</div>
            <div className="text-xs text-gp-grey">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              activeTab === id ? 'bg-gp-forest text-white shadow-sm' : 'bg-white text-gp-grey border border-gray-100 hover:border-gp-mint'
            )}>
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 && (
              <span className={clsx('rounded-full px-1.5 py-0.5 text-xs font-bold',
                activeTab === id ? 'bg-white/20 text-white' : 'bg-gp-foam text-gp-forest')}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: MARKETPLACE ── */}
      {activeTab === 'marketplace' && (
        <div>
          {/* Type filter */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Filter className="w-4 h-4 text-gp-grey" />
            {['ALL', ...acceptedTypes].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={clsx('px-4 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  typeFilter === t ? 'bg-gp-forest text-white border-gp-forest' : 'border-gray-200 text-gp-grey hover:border-gp-jade')}>
                {t === 'ALL' ? 'All Types' : WASTE_TYPES[t]?.icon + ' ' + WASTE_TYPES[t]?.label}
              </button>
            ))}
            <button onClick={() => refetchMkt()} className="ml-auto p-1.5 text-gp-grey hover:text-gp-emerald transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {mktLoading ? (
            <div className="text-center py-16 text-gp-grey">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gp-jade" />
              Loading available waste...
            </div>
          ) : filteredMarket.length === 0 ? (
            <div className="card text-center py-16">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gp-slate">No waste batches available right now</p>
              <p className="text-gp-grey text-sm mt-1">Check back soon — collectors are clearing drains across Accra.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMarket.map((batch) => {
                const wt = WASTE_TYPES[batch.wasteType]
                const price = PRICE_PER_KG_GHS[batch.wasteType] || 0.8
                const totalValue = (batch.weightKg * price).toFixed(2)
                return (
                  <motion.div key={batch.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className={clsx('card border-2 transition-all cursor-pointer',
                      selectedBatch?.id === batch.id ? 'border-blue-500 bg-blue-50/50' : 'border-transparent hover:border-gp-mint')
                    }
                    onClick={() => setSelectedBatch(selectedBatch?.id === batch.id ? null : batch)}>

                    {/* Waste type header */}
                    <div className="flex items-center justify-between mb-3">
                      <WasteTypeBadge type={batch.wasteType} />
                      <span className="text-xs text-gp-grey">
                        {new Date(batch.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {/* Weight and value */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="font-mono font-bold text-xl text-gp-forest">{batch.weightKg}kg</div>
                        <div className="text-xs text-gp-grey">Available</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <div className="font-mono font-bold text-xl text-green-700">GHS {totalValue}</div>
                        <div className="text-xs text-gp-grey">Est. value</div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-gp-grey mb-3">
                      <MapPin className="w-3 h-3" />
                      <span className="font-mono">{batch.lat?.toFixed(4)}, {batch.lng?.toFixed(4)}</span>
                    </div>

                    {/* Collector */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gp-grey">Collector: <span className="font-medium text-gp-slate">{batch.collectorName}</span></span>
                      <span className="font-semibold" style={{ color: wt?.color }}>GHS {price}/kg</span>
                    </div>

                    {/* Expand: order form */}
                    <AnimatePresence>
                      {selectedBatch?.id === batch.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-blue-100">
                          <p className="text-sm font-medium text-gp-slate mb-3">Place Order</p>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-gp-grey block mb-1">Quantity (kg) — max {batch.weightKg}kg</label>
                              <input type="number" min="1" max={batch.weightKg} step="0.5"
                                value={orderForm.requestedKg}
                                onChange={e => setOrderForm({ ...orderForm, requestedKg: e.target.value })}
                                placeholder={`Up to ${batch.weightKg}kg`} className="input-field text-sm py-2" />
                            </div>
                            <div>
                              <label className="text-xs text-gp-grey block mb-1">Offer price (GHS/kg)</label>
                              <input type="number" min="0.1" step="0.1"
                                value={orderForm.pricePerKgGHS}
                                onChange={e => setOrderForm({ ...orderForm, pricePerKgGHS: e.target.value })}
                                placeholder={`Market: GHS ${price}`} className="input-field text-sm py-2" />
                            </div>
                            {orderForm.requestedKg && orderForm.pricePerKgGHS && (
                              <div className="bg-blue-50 rounded-lg p-3 text-xs text-center">
                                <span className="font-bold text-blue-700">
                                  Total: GHS {(parseFloat(orderForm.requestedKg) * parseFloat(orderForm.pricePerKgGHS)).toFixed(2)}
                                </span>
                                <span className="text-blue-500 ml-2">for {orderForm.requestedKg}kg</span>
                              </div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); orderMutation.mutate() }}
                              disabled={!orderForm.requestedKg || !orderForm.pricePerKgGHS || orderMutation.isPending}
                              className="btn-recycler w-full text-sm py-2.5 flex items-center justify-center gap-2">
                              {orderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                              Confirm Order
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: TRICYCLE DISPATCH ── */}
      {activeTab === 'dispatch' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Map of available tricycles */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-display font-semibold text-gp-slate">Available Tricycles Near Accra</h2>
              <p className="text-xs text-gp-grey mt-0.5">Click a tricycle 🛺 to select it for dispatch</p>
            </div>
            <div className="h-80">
              <MapContainer center={ACCRA_CENTER} zoom={ACCRA_ZOOM} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {tricycles.map(t => (
                  <Marker key={t.id} position={[t.lat, t.lng]} icon={TRICYCLE_ICON}>
                    <Popup>
                      <div className="text-sm">
                        <strong>{t.driverName}</strong><br />
                        {t.zone} · Capacity: {t.capacityKg}kg<br />
                        <button onClick={() => setSelectedTricycle(t)}
                          className="mt-1 text-blue-600 font-medium">Select →</button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {/* Show pending waste locations */}
                {marketplace.slice(0,10).map(b => (
                  <Circle key={b.id} center={[b.lat, b.lng]} radius={120}
                    fillColor={WASTE_TYPES[b.wasteType]?.color || '#ccc'}
                    color="white" fillOpacity={0.6} weight={2}>
                    <Popup>{b.wasteType} — {b.weightKg}kg available</Popup>
                  </Circle>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Tricycle list + dispatch panel */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-display font-semibold text-gp-slate mb-4">Available Tricycles ({tricycles.length})</h2>
              {triLoading ? (
                <div className="text-center py-6 text-gp-grey"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
              ) : tricycles.length === 0 ? (
                <div className="text-center py-6">
                  <Truck className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gp-grey text-sm">No tricycles available right now</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tricycles.map(t => (
                    <div key={t.id} onClick={() => setSelectedTricycle(selectedTricycle?.id === t.id ? null : t)}
                      className={clsx('flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border',
                        selectedTricycle?.id === t.id ? 'border-blue-400 bg-blue-50' : 'border-transparent hover:bg-gp-foam')}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🛺</span>
                        <div>
                          <div className="font-medium text-sm text-gp-slate">{t.driverName}</div>
                          <div className="text-xs text-gp-grey">{t.zone} · {t.capacityKg}kg capacity</div>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">Available</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dispatch form */}
            {selectedTricycle && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card border-2 border-blue-300 bg-blue-50/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-gp-slate">Dispatch: {selectedTricycle.driverName}</h3>
                  <button onClick={() => setSelectedTricycle(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gp-grey mb-4">
                  Select a waste batch from the Marketplace tab first, then return here to dispatch.
                  Or use your most recent confirmed order below.
                </p>
                <button onClick={() => dispatchMutation.mutate()}
                  disabled={dispatchMutation.isPending}
                  className="btn-recycler w-full flex items-center justify-center gap-2">
                  {dispatchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Dispatch Tricycle
                </button>
              </motion.div>
            )}

            {/* Active dispatches */}
            <div className="card">
              <h2 className="font-display font-semibold text-gp-slate mb-4">My Dispatches</h2>
              {myDispatches.length === 0 ? (
                <p className="text-gp-grey text-sm text-center py-4">No dispatches yet.</p>
              ) : (
                <div className="space-y-2">
                  {myDispatches.slice(0,5).map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <div className="text-sm font-medium text-gp-slate">🛺 {d.driverName}</div>
                        <div className="text-xs text-gp-grey">{new Date(d.createdAt).toLocaleDateString('en-GH')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DispatchStatusBadge status={d.status} />
                        {d.status === 'DISPATCHED' && (
                          <button onClick={() => cancelDispatchMutation.mutate(d.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MY ORDERS ── */}
      {activeTab === 'orders' && (
        <div>
          {ordersLoading ? (
            <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gp-jade" /></div>
          ) : myOrders.length === 0 ? (
            <div className="card text-center py-16">
              <CheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gp-slate">No orders yet</p>
              <p className="text-gp-grey text-sm mt-1">Browse the Marketplace and place your first order.</p>
              <button onClick={() => setActiveTab('marketplace')} className="btn-recycler mt-4 inline-block text-sm py-2.5 px-5">
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map(order => (
                <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <WasteTypeBadge type={order.wasteType} />
                      <DispatchStatusBadge status={order.status} />
                    </div>
                    <span className="text-xs text-gp-grey font-mono">
                      {new Date(order.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="font-mono font-bold text-gp-forest">{order.requestedKg}kg</div>
                      <div className="text-xs text-gp-grey">Ordered</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="font-mono font-bold text-gp-forest">GHS {order.pricePerKgGHS}/kg</div>
                      <div className="text-xs text-gp-grey">Price</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <div className="font-mono font-bold text-green-700">
                        GHS {(order.requestedKg * order.pricePerKgGHS).toFixed(2)}
                      </div>
                      <div className="text-xs text-gp-grey">Total value</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="font-mono font-bold text-blue-700">
                        {(order.requestedKg * (WASTE_TYPES[order.wasteType]?.co2Factor || 1.5)).toFixed(1)}kg
                      </div>
                      <div className="text-xs text-gp-grey">CO₂ impact</div>
                    </div>
                  </div>
                  {order.notes && (
                    <p className="text-xs text-gp-grey mt-3 italic">"{order.notes}"</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
