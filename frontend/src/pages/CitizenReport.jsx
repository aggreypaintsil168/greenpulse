import { useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, MapPin, AlertTriangle, CheckCircle, Upload, Loader2, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import L from 'leaflet'
import { reportAPI } from '../lib/api'
import { ACCRA_CENTER, ACCRA_ZOOM, SEVERITY_LEVELS } from '../lib/constants'

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

const steps = ['Photo', 'Location', 'Details', 'Submit']

export default function CitizenReport() {
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [position, setPosition] = useState(null)
  const [severity, setSeverity] = useState('MEDIUM')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const fileRef = useRef()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (formData) => reportAPI.submit(formData),
    onSuccess: (res) => {
      setEarnedPoints(res.data.pointsEarned || 5)
      setSubmitted(true)
      qc.invalidateQueries(['reports'])
    },
    onError: () => toast.error('Failed to submit. Please try again.'),
  })

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setStep(1)
  }

  const handleSubmit = () => {
    if (!photo || !position) {
      toast.error('Please add a photo and pin the drain location.')
      return
    }
    const fd = new FormData()
    fd.append('photo', photo)
    fd.append('lat', position[0])
    fd.append('lng', position[1])
    fd.append('severity', severity)
    fd.append('description', description)
    mutation.mutate(fd)
  }

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card max-w-md w-full text-center py-12"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 bg-gp-foam rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-gp-emerald" />
          </motion.div>
          <h2 className="font-display font-bold text-2xl text-gp-slate mb-2">Report Submitted!</h2>
          <p className="text-gp-grey mb-6">
            A collector has been notified. You'll help prevent flooding in your area.
          </p>
          <div className="bg-gp-foam rounded-2xl p-6 mb-6">
            <div className="font-display font-bold text-4xl text-gp-emerald mb-1">
              +{earnedPoints}
            </div>
            <div className="text-gp-grey text-sm flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              GreenPoints earned
            </div>
          </div>
          <button onClick={() => { setSubmitted(false); setStep(0); setPhoto(null); setPhotoPreview(null); setPosition(null) }}
            className="btn-primary w-full">
            Report Another Drain
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-gp-slate mb-2">Report a Choked Drain</h1>
        <p className="text-gp-grey">Help prevent flooding. Earn GreenPoints. Takes under 60 seconds.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < step ? 'bg-gp-emerald text-white' :
              i === step ? 'bg-gp-forest text-white' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-gp-forest' : 'text-gray-400'}`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-gp-emerald' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <AnimatePresence mode="wait">
          {/* Step 0: Photo */}
          {step === 0 && (
            <motion.div key="photo"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-display font-semibold text-xl text-gp-slate mb-2">Take a photo of the drain</h2>
              <p className="text-gp-grey text-sm mb-6">A clear photo helps our team verify the report faster.</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment"
                onChange={handlePhoto} className="hidden" />
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Drain" className="w-full h-64 object-cover rounded-xl" />
                  <button onClick={() => fileRef.current.click()}
                    className="absolute bottom-3 right-3 bg-white rounded-lg px-3 py-1.5 text-sm font-medium text-gp-slate shadow">
                    Change photo
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current.click()}
                  className="w-full border-2 border-dashed border-gp-mint rounded-xl p-12 text-center
                             hover:bg-gp-foam transition-colors group">
                  <Camera className="w-10 h-10 text-gp-jade mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-gp-forest">Click to open camera or upload photo</p>
                  <p className="text-gp-grey text-sm mt-1">JPG, PNG up to 10MB</p>
                </button>
              )}
              {photoPreview && (
                <button onClick={() => setStep(1)} className="btn-primary w-full mt-4">
                  Next: Pin Location
                </button>
              )}
            </motion.div>
          )}

          {/* Step 1: Map */}
          {step === 1 && (
            <motion.div key="map"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-display font-semibold text-xl text-gp-slate mb-2">Pin the drain location</h2>
              <p className="text-gp-grey text-sm mb-4">
                <MapPin className="w-4 h-4 inline mr-1 text-gp-jade" />
                Tap anywhere on the map to drop a pin
              </p>
              <div className="h-72 rounded-xl overflow-hidden mb-4">
                <MapContainer center={ACCRA_CENTER} zoom={ACCRA_ZOOM} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© OpenStreetMap contributors'
                  />
                  <LocationPicker onSelect={setPosition} />
                  {position && <Marker position={position} />}
                </MapContainer>
              </div>
              {position && (
                <p className="text-xs text-gp-grey font-mono bg-gp-foam px-3 py-2 rounded-lg mb-4">
                  📍 {position[0].toFixed(5)}, {position[1].toFixed(5)}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => position && setStep(2)} 
                  className={`flex-1 ${position ? 'btn-primary' : 'bg-gray-100 text-gray-400 px-6 py-3 rounded-xl cursor-not-allowed'}`}>
                  Next: Add Details
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <motion.div key="details"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-display font-semibold text-xl text-gp-slate mb-6">Describe the blockage</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gp-slate mb-3">How severe is the blockage?</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(SEVERITY_LEVELS).map(([key, val]) => (
                    <button key={key} onClick={() => setSeverity(key)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        severity === key
                          ? 'border-gp-emerald bg-gp-foam text-gp-forest'
                          : 'border-gray-100 text-gray-500 hover:border-gp-mint'
                      }`}>
                      <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: val.color }} />
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gp-slate mb-2">Additional details (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Drain completely blocked with plastic bags near Legon bus stop..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Review & Submit</button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <motion.div key="review"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-display font-semibold text-xl text-gp-slate mb-6">Review your report</h2>
              <div className="space-y-4 mb-6">
                <img src={photoPreview} alt="Drain" className="w-full h-48 object-cover rounded-xl" />
                <div className="bg-gp-foam rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gp-grey">Location</span>
                    <span className="font-mono text-xs text-gp-slate">
                      {position ? `${position[0].toFixed(4)}, ${position[1].toFixed(4)}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gp-grey">Severity</span>
                    <span className={`badge-${severity.toLowerCase() === 'critical' ? 'high' : severity.toLowerCase()}`}>
                      {SEVERITY_LEVELS[severity]?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gp-grey">GreenPoints earned</span>
                    <span className="font-bold text-gp-emerald">+5 pts</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">Edit</button>
                <button onClick={handleSubmit} disabled={mutation.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {mutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Submit Report</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}