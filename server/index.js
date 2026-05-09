require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const migrate = require('./migrate')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// API routes
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/user',         require('./routes/user'))
app.use('/api/cabinets',     require('./routes/cabinets'))
app.use('/api/replacements', require('./routes/replacements'))
app.use('/api/acts',         require('./routes/acts'))

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date() }))

// Serve React frontend (production)
const PUBLIC = path.join(__dirname, 'public')
app.use(express.static(PUBLIC))
app.get('*', (_, res) => res.sendFile(path.join(PUBLIC, 'index.html')))

async function start() {
  try {
    await migrate()
    app.listen(PORT, () => console.log(`🦷 DentaGest server running on port ${PORT}`))
  } catch (err) {
    console.error('Startup error:', err)
    process.exit(1)
  }
}

start()
