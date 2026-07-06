import { useRef } from 'react'
import { QRCodeCanvas as QRCode } from 'qrcode.react' // Not {QRCode}
import { motion } from 'framer-motion'
import { Download, QrCode, MapPin } from 'lucide-react'

const ZONES = [
  { id: 'legon-main',      name: 'Legon Main Road',     lat: 5.6508, lng: -0.1869, color: '#2D6A4F' },
  { id: 'madina-market',   name: 'Madina Market',       lat: 5.6800, lng: -0.1660, color: '#3B82F6' },
  { id: 'east-legon',      name: 'East Legon Avenue',   lat: 5.6345, lng: -0.1567, color: '#8B5CF6' },
  { id: 'adenta-housing',  name: 'Adenta Housing',      lat: 5.7100, lng: -0.1680, color: '#F4A261' },
  { id: 'airport-hills',   name: 'Airport Hills',       lat: 5.6050, lng: -0.1670, color: '#E63946' },
  { id: 'teshie-junction', name: 'Teshie Junction',     lat: 5.5830, lng: -0.1190, color: '#40916C' },
]

export default function QRZones() {
  const BASE_URL = window.location.origin

  const downloadQR = (zoneId) => {
    const canvas = document.getElementById(`qr-${zoneId}`)?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `greenpulse-qr-${zoneId}.png`
    a.click()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-gp-slate mb-2">QR Zone Codes</h1>
        <p className="text-gp-grey">Print these and attach to drain covers. Citizens scan → report form opens pre-filled with the zone location and earns GreenPoints.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ZONES.map((zone, i) => {
          const reportUrl = `${BASE_URL}/report?zone=${zone.id}&lat=${zone.lat}&lng=${zone.lng}&name=${encodeURIComponent(zone.name)}`
          return (
            <motion.div key={zone.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }} className="card text-center hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-3">
                <MapPin className="w-4 h-4" style={{ color: zone.color }} />
                <span className="font-display font-semibold text-gp-slate text-sm">{zone.name}</span>
              </div>
              <div id={`qr-${zone.id}`} className="flex justify-center mb-4 p-3 bg-gp-foam rounded-xl">
                <QRCode value={reportUrl} size={140} level="H" fgColor={zone.color} bgColor="#D8F3DC" style={{ borderRadius: 8 }} />
              </div>
              <p className="text-xs text-gp-grey mb-3 font-mono">{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</p>
              <button onClick={() => downloadQR(zone.id)} className="btn-secondary w-full text-sm py-2 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download PNG
              </button>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-8 bg-gp-foam border border-gp-mint rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <QrCode className="w-5 h-5 text-gp-jade flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gp-forest mb-1">How to deploy</h3>
            <ol className="text-sm text-gp-grey space-y-1 list-decimal list-inside">
              <li>Download the PNG for each zone</li>
              <li>Print on weatherproof sticker paper (A5 size recommended)</li>
              <li>Attach to drain covers with waterproof adhesive or cable ties</li>
              <li>Citizens scan → report form opens pre-filled with the zone location</li>
              <li>They upload a photo, select severity, and earn +5 GreenPoints</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
