const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const auth   = require('../middleware/auth')
const prisma = new PrismaClient()

// Recycler type → accepted waste types
const ACCEPTS = {
  PLASTIC: ['PLASTIC', 'MIXED'],
  ORGANIC: ['ORGANIC', 'MIXED'],
  EWASTE:  ['EWASTE'],
  GENERAL: ['PLASTIC', 'ORGANIC', 'MIXED', 'EWASTE'],
}

// GET /api/recyclers/marketplace — browse available waste for this recycler
router.get('/marketplace', async (req, res) => {
  try {
    const { type } = req.query

    const where = {
      listedOnMarket: true,
      soldToRecycler: false,
      ...(type ? { wasteType: type } : {}),
    }

    const collections = await prisma.wasteCollection.findMany({
      where,
      include: {
        drainReport: { select: { lat: true, lng: true, description: true, severity: true } },
        collector:   { select: { name: true, zone: true } },
      },
      orderBy: [{ wasteType: 'asc' }, { weightKg: 'desc' }],
      take: 60,
    })

    // Flatten for frontend consumption
    const market = collections.map(c => ({
      id:            c.id,
      wasteType:     c.wasteType,
      weightKg:      c.weightKg,
      co2SavedKg:    c.co2SavedKg,
      lat:           c.drainReport?.lat,
      lng:           c.drainReport?.lng,
      severity:      c.drainReport?.severity,
      description:   c.drainReport?.description,
      collectorName: c.collector?.name,
      collectorZone: c.collector?.zone,
      createdAt:     c.createdAt,
    }))

    res.json(market)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch marketplace' })
  }
})

// GET /api/recyclers/tricycles/available
router.get('/tricycles/available', async (req, res) => {
  try {
    const tricycles = await prisma.tricycle.findMany({
      where: { isAvailable: true },
      orderBy: { zone: 'asc' },
    })
    res.json(tricycles)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tricycles' })
  }
})

// GET /api/recyclers/:id — recycler profile
router.get('/:id', async (req, res) => {
  try {
    const recycler = await prisma.recycler.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, companyName: true, phone: true,
        recyclerType: true, address: true, zone: true,
        isVerified: true, createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { collection: { select: { weightKg: true, wasteType: true, co2SavedKg: true } } },
        },
      },
    })
    if (!recycler) return res.status(404).json({ error: 'Recycler not found' })
    res.json(recycler)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recycler' })
  }
})

// GET /api/recyclers — all recyclers (admin view)
router.get('/', async (req, res) => {
  try {
    const recyclers = await prisma.recycler.findMany({
      select: { id: true, companyName: true, recyclerType: true, zone: true, isVerified: true },
      orderBy: { companyName: 'asc' },
    })
    res.json(recyclers)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recyclers' })
  }
})

// POST /api/recyclers/orders — place a waste purchase order
router.post('/orders', auth, async (req, res) => {
  try {
    const { recyclerId, collectionId, requestedKg, pricePerKgGHS, notes } = req.body
    if (!recyclerId || !collectionId || !requestedKg || !pricePerKgGHS) {
      return res.status(400).json({ error: 'recyclerId, collectionId, requestedKg, and pricePerKgGHS are required' })
    }

    // Check collection is still available
    const collection = await prisma.wasteCollection.findUnique({ where: { id: collectionId } })
    if (!collection) return res.status(404).json({ error: 'Waste batch not found' })
    if (collection.soldToRecycler) return res.status(409).json({ error: 'This batch has already been sold' })

    const [order] = await prisma.$transaction([
      prisma.recyclerOrder.create({
        data: {
          recyclerId,
          collectionId,
          requestedKg:   parseFloat(requestedKg),
          pricePerKgGHS: parseFloat(pricePerKgGHS),
          notes:         notes || '',
          status:        'CONFIRMED',
        },
      }),
      // Mark collection as sold/reserved
      prisma.wasteCollection.update({
        where: { id: collectionId },
        data:  { soldToRecycler: true },
      }),
    ])

    res.status(201).json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to place order' })
  }
})

// GET /api/recyclers/:id/orders
router.get('/:id/orders', async (req, res) => {
  try {
    const orders = await prisma.recyclerOrder.findMany({
      where: { recyclerId: req.params.id },
      include: {
        collection: {
          select: { weightKg: true, wasteType: true, co2SavedKg: true,
            collector: { select: { name: true, zone: true } },
            drainReport: { select: { lat: true, lng: true } },
          },
        },
        dispatch: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Flatten for frontend
    const enriched = orders.map(o => ({
      id:            o.id,
      status:        o.status,
      requestedKg:   o.requestedKg,
      pricePerKgGHS: o.pricePerKgGHS,
      notes:         o.notes,
      createdAt:     o.createdAt,
      wasteType:     o.collection?.wasteType,
      weightKg:      o.collection?.weightKg,
      co2SavedKg:    o.collection?.co2SavedKg,
      collectorName: o.collection?.collector?.name,
      lat:           o.collection?.drainReport?.lat,
      lng:           o.collection?.drainReport?.lng,
      dispatch:      o.dispatch,
    }))

    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// POST /api/recyclers/dispatch — assign a tricycle to a collection order
router.post('/dispatch', auth, async (req, res) => {
  try {
    const { recyclerId, tricycleId, orderId, targetLat, targetLng } = req.body
    if (!recyclerId || !tricycleId) return res.status(400).json({ error: 'recyclerId and tricycleId are required' })

    // Check tricycle availability
    const tricycle = await prisma.tricycle.findUnique({ where: { id: tricycleId } })
    if (!tricycle) return res.status(404).json({ error: 'Tricycle not found' })
    if (!tricycle.isAvailable) return res.status(409).json({ error: 'Tricycle is already on a job' })

    const [dispatch] = await prisma.$transaction([
      prisma.tricycleDispatch.create({
        data: {
          recyclerId,
          tricycleId,
          orderId:   orderId || null,
          targetLat: targetLat ? parseFloat(targetLat) : null,
          targetLng: targetLng ? parseFloat(targetLng) : null,
          status:    'DISPATCHED',
        },
        include: {
          tricycle: { select: { driverName: true, phone: true, zone: true } },
        },
      }),
      prisma.tricycle.update({
        where: { id: tricycleId },
        data:  { isAvailable: false },
      }),
    ])

    // If there's an order, update its status
    if (orderId) {
      await prisma.recyclerOrder.update({
        where: { id: orderId },
        data:  { status: 'DISPATCHED' },
      })
    }

    res.status(201).json(dispatch)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to dispatch tricycle' })
  }
})

// GET /api/recyclers/:id/dispatches
router.get('/:id/dispatches', async (req, res) => {
  try {
    const dispatches = await prisma.tricycleDispatch.findMany({
      where: { recyclerId: req.params.id },
      include: {
        tricycle: { select: { driverName: true, phone: true, zone: true } },
        order: { select: { requestedKg: true, pricePerKgGHS: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enriched = dispatches.map(d => ({
      id:         d.id,
      status:     d.status,
      driverName: d.tricycle?.driverName,
      driverPhone:d.tricycle?.phone,
      zone:       d.tricycle?.zone,
      targetLat:  d.targetLat,
      targetLng:  d.targetLng,
      createdAt:  d.createdAt,
      requestedKg:    d.order?.requestedKg,
      pricePerKgGHS:  d.order?.pricePerKgGHS,
    }))

    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dispatches' })
  }
})

// PATCH /api/recyclers/dispatches/:id — update dispatch status
router.patch('/dispatches/:id', auth, async (req, res) => {
  try {
    const { status } = req.body
    const dispatch = await prisma.tricycleDispatch.update({
      where: { id: req.params.id },
      data:  { status },
    })

    // Free up tricycle if job is done or cancelled
    if (['DELIVERED', 'CANCELLED'].includes(status)) {
      await prisma.tricycle.update({
        where: { id: dispatch.tricycleId },
        data:  { isAvailable: true },
      })
    }

    // Sync order status
    if (dispatch.orderId) {
      await prisma.recyclerOrder.update({
        where: { id: dispatch.orderId },
        data:  { status },
      })
    }

    res.json(dispatch)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update dispatch' })
  }
})

module.exports = router
