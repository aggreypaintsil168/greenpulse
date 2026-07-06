const router    = require('express').Router()
const multer    = require('multer')
const { PrismaClient } = require('@prisma/client')
const cloudinary = require('../lib/cloudinary')
const { Readable } = require('stream')

const prisma = new PrismaClient()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const uploadToCloud = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => err ? reject(err) : resolve(result)
    )
    Readable.from(buffer).pipe(stream)
  })

// POST /api/reports
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { lat, lng, severity = 'MEDIUM', description = '' } = req.body
    if (!lat || !lng) return res.status(400).json({ error: 'Location is required' })

    let photoUrl = `https://placehold.co/800x600/D8F3DC/1B4332?text=${severity}+Drain+Report`
    if (req.file) {
      const result = await uploadToCloud(req.file.buffer, 'greenpulse/reports')
      photoUrl = result.secure_url
    }

    const report = await prisma.drainReport.create({
      data: { lat: parseFloat(lat), lng: parseFloat(lng), photoUrl, severity, description },
    })

    await prisma.greenPointsLedger.create({
      data: { citizenId: 'anonymous', points: 5, reason: 'Drain report submitted', reportId: report.id },
    })

    res.status(201).json({ ...report, pointsEarned: 5 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to submit report' })
  }
})

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    const reports = await prisma.drainReport.findMany({
      where: { status: { not: 'CLEARED' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json(reports)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

// GET /api/reports/heatmap
router.get('/heatmap', async (req, res) => {
  try {
    const reports = await prisma.drainReport.findMany({ select: { lat: true, lng: true, severity: true } })
    const intensityMap = { LOW: 0.3, MEDIUM: 0.6, HIGH: 0.9, CRITICAL: 1.0 }
    res.json(reports.map(r => [r.lat, r.lng, intensityMap[r.severity] || 0.5]))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch heatmap' })
  }
})

// GET /api/reports/available-waste — for recyclers browsing by waste type
router.get('/available-waste', async (req, res) => {
  try {
    const { type } = req.query
    const where = {
      status: 'CLEARED',
      collection: {
        listedOnMarket: true,
        soldToRecycler: false,
        ...(type ? { wasteType: type } : {}),
      },
    }
    const reports = await prisma.drainReport.findMany({
      where,
      include: {
        collection: {
          include: { collector: { select: { name: true, zone: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })
    res.json(reports)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available waste' })
  }
})

// PATCH /api/reports/:id
router.patch('/:id', async (req, res) => {
  try {
    const report = await prisma.drainReport.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(report)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report' })
  }
})

module.exports = router
