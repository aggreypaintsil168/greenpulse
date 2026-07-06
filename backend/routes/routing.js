// ── routing.js ──
const router = require('express').Router()
const axios  = require('axios')

const ROUTING_SERVICE = process.env.ROUTING_SERVICE_URL || 'http://localhost:8000'

router.post('/optimize', async (req, res) => {
  try {
    const { collectorLat, collectorLng, targets } = req.body
    const response = await axios.post(`${ROUTING_SERVICE}/optimize`, {
      start: [collectorLat, collectorLng],
      targets,
    }, { timeout: 10000 })
    res.json(response.data)
  } catch {
    // Fallback: Euclidean sort by (distance * severity weight)
    const { collectorLat, collectorLng, targets = [] } = req.body
    const priorityWeight = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 }
    const sorted = [...targets].sort((a, b) => {
      const da = Math.hypot(a.lat - collectorLat, a.lng - collectorLng) * (priorityWeight[a.severity] || 3)
      const db = Math.hypot(b.lat - collectorLat, b.lng - collectorLng) * (priorityWeight[b.severity] || 3)
      return da - db
    })
    res.json({ route: sorted, distance_km: null, algorithm: 'euclidean_fallback' })
  }
})

module.exports = router
