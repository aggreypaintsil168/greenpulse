// ── collectors.js ──
const router  = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const prisma  = new PrismaClient()

router.get('/:id', async (req, res) => {
  try {
    const collector = await prisma.collector.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, phone: true, zone: true,
        totalKgLifetime: true, totalCO2Lifetime: true, greenPoints: true, createdAt: true,
        collections: {
          orderBy: { createdAt: 'desc' }, take: 20,
          select: { id: true, weightKg: true, wasteType: true, co2SavedKg: true, revenueGHS: true, createdAt: true },
        },
      },
    })
    if (!collector) return res.status(404).json({ error: 'Collector not found' })
    res.json(collector)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collector' })
  }
})

router.get('/', async (req, res) => {
  try {
    const collectors = await prisma.collector.findMany({
      select: { id: true, name: true, zone: true, totalKgLifetime: true, totalCO2Lifetime: true, greenPoints: true },
      orderBy: { greenPoints: 'desc' },
    })
    res.json(collectors)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collectors' })
  }
})

module.exports = router
