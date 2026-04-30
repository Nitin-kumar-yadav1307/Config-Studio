const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const dynamicRoutes = require('./routes/dynamic')
const authRoutes = require('./routes/auth')
const configRoutes = require('./routes/config')
const generatorRoutes = require('./routes/generator')

const app = express()

const clientOrigin = process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN

app.use(cors(clientOrigin ? { origin: clientOrigin } : undefined))
app.use(express.json())

const clientDistPath = path.join(__dirname, '..', 'client', 'dist')
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath))
}

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/configs', configRoutes)
app.use('/api/data', dynamicRoutes)
app.use('/api/generator', generatorRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/', (req, res) => {
  if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    return res.sendFile(path.join(clientDistPath, 'index.html'))
  }

  res.json({ message: 'AI Signal Demo Server Running!' })
})

app.use((req, res, next) => {
  if (!fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    return next()
  }

  if (req.path.startsWith('/api/')) {
    return next()
  }

  return res.sendFile(path.join(clientDistPath, 'index.html'))
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected')
    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`)
    })
  })
  .catch((err) => {
    console.log('❌ MongoDB connection error:', err)
  })