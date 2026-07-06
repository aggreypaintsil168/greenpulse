const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })

// ── COLLECTOR AUTH ──

router.post('/collector/register', async (req, res) => {
  try {
    const { name, phone, password, zone } = req.body
    if (!name || !phone || !password) return res.status(400).json({ error: 'Name, phone, and password are required' })
    const existing = await prisma.collector.findUnique({ where: { phone } })
    if (existing) return res.status(400).json({ error: 'Phone number already registered' })
    const hashed = await bcrypt.hash(password, 12)
    const collector = await prisma.collector.create({
      data: { name, phone, password: hashed, zone },
      select: { id: true, name: true, phone: true, zone: true, greenPoints: true, createdAt: true },
    })
    res.status(201).json({ collector, token: sign({ id: collector.id, name: collector.name, role: 'collector' }) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/collector/login', async (req, res) => {
  try {
    const { phone, password } = req.body
    const collector = await prisma.collector.findUnique({ where: { phone } })
    if (!collector) return res.status(404).json({ error: 'No account found with this phone number' })
    const match = await bcrypt.compare(password, collector.password)
    if (!match) return res.status(401).json({ error: 'Incorrect password' })
    const { password: _, ...safe } = collector
    res.json({ collector: safe, token: sign({ id: collector.id, name: collector.name, role: 'collector' }) })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
  }
})

// ── RECYCLER AUTH ──

router.post('/recycler/register', async (req, res) => {
  try {
    const { companyName, phone, password, recyclerType = 'GENERAL', address, zone } = req.body
    if (!companyName || !phone || !password) return res.status(400).json({ error: 'Company name, phone, and password are required' })
    const existing = await prisma.recycler.findUnique({ where: { phone } })
    if (existing) return res.status(400).json({ error: 'Phone number already registered' })
    const hashed = await bcrypt.hash(password, 12)
    const recycler = await prisma.recycler.create({
      data: { companyName, phone, password: hashed, recyclerType, address, zone },
      select: { id: true, companyName: true, phone: true, recyclerType: true, address: true, zone: true, createdAt: true },
    })
    res.status(201).json({ recycler, token: sign({ id: recycler.id, name: recycler.companyName, role: 'recycler' }) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/recycler/login', async (req, res) => {
  try {
    const { phone, password } = req.body
    const recycler = await prisma.recycler.findUnique({ where: { phone } })
    if (!recycler) return res.status(404).json({ error: 'No recycler account found with this phone number' })
    const match = await bcrypt.compare(password, recycler.password)
    if (!match) return res.status(401).json({ error: 'Incorrect password' })
    const { password: _, ...safe } = recycler
    res.json({ recycler: safe, token: sign({ id: recycler.id, name: recycler.companyName, role: 'recycler' }) })
  } catch (err) {
    res.status(500).json({ error: 'Login failed' })
  }
})

module.exports = router
