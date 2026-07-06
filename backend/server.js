const express = require('express')
const cors    = require('cors')
const dotenv  = require('dotenv')
dotenv.config()

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/reports',     require('./routes/reports'))
app.use('/api/collections', require('./routes/collections'))
app.use('/api/auth',        require('./routes/auth'))
app.use('/api/collectors',  require('./routes/collectors'))
app.use('/api/recyclers',   require('./routes/recyclers'))
app.use('/api/dashboard',   require('./routes/dashboard'))
app.use('/api/routing',     require('./routes/routing'))
app.use('/api/weather',     require('./routes/weather'))

app.get('/api/health', (_, res) => {
  res.json({ status: 'GreenPulse API is live 🌿', timestamp: new Date().toISOString() })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🌿 GreenPulse API running on port ${PORT}`))
