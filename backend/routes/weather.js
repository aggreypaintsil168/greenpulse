const router = require('express').Router()
const axios  = require('axios')

router.get('/forecast', async (req, res) => {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=5.6037&longitude=-0.1870&daily=precipitation_sum,precipitation_probability_max&forecast_days=7&timezone=Africa%2FAccra'
    const { data } = await axios.get(url, { timeout: 8000 })

    const forecast = data.daily.time.map((date, i) => ({
      date,
      rainMM:      data.daily.precipitation_sum[i],
      rainProbPct: data.daily.precipitation_probability_max[i],
      floodRisk:   data.daily.precipitation_sum[i] > 20 ? 'HIGH'
                 : data.daily.precipitation_sum[i] > 10 ? 'MEDIUM' : 'LOW',
    }))
    res.json({ forecast, source: 'Open-Meteo' })
  } catch (err) {
    // Return mock data if API is down
    const mock = Array.from({ length: 7 }, (_, i) => ({
      date:        new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      rainMM:      Math.random() * 30,
      rainProbPct: Math.floor(Math.random() * 80),
      floodRisk:   ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
    }))
    res.json({ forecast: mock, source: 'mock' })
  }
})

module.exports = router
