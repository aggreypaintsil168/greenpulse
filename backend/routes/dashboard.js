const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

router.get('/summary', async (req, res) => {
  try {
    const [
      totalReports,
      activeReports,
      clearedReports,
      collectionStats,
      topCollectors,
      recentReports,
      recentCollections,
      recyclerOrders,
      byType,
    ] = await Promise.all([
      prisma.drainReport.count(),
      prisma.drainReport.count({ where: { status: { not: 'CLEARED' } } }),
      prisma.drainReport.count({ where: { status: 'CLEARED' } }),
      prisma.wasteCollection.aggregate({ _sum: { weightKg: true, co2SavedKg: true, revenueGHS: true } }),
      prisma.collector.findMany({
        orderBy: { totalKgLifetime: 'desc' }, take: 5,
        select: { id: true, name: true, totalKgLifetime: true, totalCO2Lifetime: true, greenPoints: true, zone: true },
      }),
      prisma.drainReport.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.wasteCollection.findMany({
        orderBy: { createdAt: 'desc' }, take: 10,
        include: { collector: { select: { name: true } } },
      }),
      prisma.recyclerOrder.count(),
      prisma.wasteCollection.groupBy({ by: ['wasteType'], _sum: { weightKg: true } }),
    ])

    res.json({
      totalReports, activeReports, clearedReports,
      totalKgCollected: collectionStats._sum.weightKg  || 0,
      totalCO2Saved:    collectionStats._sum.co2SavedKg || 0,
      totalRevenue:     collectionStats._sum.revenueGHS || 0,
      topCollectors,
      recentReports,
      recentCollections,
      recyclerOrders,
      byType,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Dashboard data unavailable' })
  }
})

module.exports = router
