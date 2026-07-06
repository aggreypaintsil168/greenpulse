const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const auth   = require('../middleware/auth')
const prisma = new PrismaClient()

const CO2_FACTORS = { PLASTIC: 2.5, ORGANIC: 0.8, MIXED: 1.5, EWASTE: 5.0 }

// POST /api/collections — log a waste collection (auto-lists on recycler marketplace)
router.post('/', auth, async (req, res) => {
  try {
    const { drainReportId, weightKg, wasteType = 'MIXED' } = req.body
    if (!drainReportId || !weightKg) return res.status(400).json({ error: 'drainReportId and weightKg are required' })

    const co2SavedKg  = parseFloat(weightKg) * (CO2_FACTORS[wasteType] || 1.5)
    const revenueGHS  = parseFloat(weightKg) * 0.6
    const pointsEarned = Math.floor(parseFloat(weightKg) * 3)

    const [collection] = await prisma.$transaction([
      prisma.wasteCollection.create({
        data: {
          drainReportId,
          collectorId:    req.user.id,
          weightKg:       parseFloat(weightKg),
          wasteType,
          co2SavedKg,
          revenueGHS,
          listedOnMarket: true,   // auto-listed for recyclers
          soldToRecycler: false,
        },
      }),
      prisma.drainReport.update({
        where: { id: drainReportId },
        data:  { status: 'CLEARED' },
      }),
      prisma.collector.update({
        where: { id: req.user.id },
        data: {
          totalKgLifetime:  { increment: parseFloat(weightKg) },
          totalCO2Lifetime: { increment: co2SavedKg },
          greenPoints:      { increment: pointsEarned },
        },
      }),
    ])

    res.status(201).json({ ...collection, pointsEarned })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to log collection' })
  }
})

// GET /api/collections/stats
router.get('/stats', async (req, res) => {
  try {
    const agg = await prisma.wasteCollection.aggregate({
      _sum: { weightKg: true, co2SavedKg: true, revenueGHS: true },
      _count: { id: true },
    })
    const byType = await prisma.wasteCollection.groupBy({
      by: ['wasteType'],
      _sum: { weightKg: true },
    })
    res.json({ totals: agg._sum, count: agg._count.id, byType })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// GET /api/collections/available — unsold, listed collections for marketplace
router.get('/available', async (req, res) => {
  try {
    const collections = await prisma.wasteCollection.findMany({
      where: { listedOnMarket: true, soldToRecycler: false },
      include: {
        drainReport: true,
        collector: { select: { name: true, zone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(collections)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available collections' })
  }
})

// GET /api/collections/collector/:id
router.get('/collector/:id', async (req, res) => {
  try {
    const collections = await prisma.wasteCollection.findMany({
      where: { collectorId: req.params.id },
      orderBy: { createdAt: 'desc' },
    })
    res.json(collections)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collector collections' })
  }
})

module.exports = router
