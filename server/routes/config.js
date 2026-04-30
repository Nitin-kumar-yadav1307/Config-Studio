const express = require('express')
const router = express.Router()
const Config = require('../models/Config')
const jwt = require('jsonwebtoken')
const { normalizeConfigInput } = require('../utils/configEngine')

// middleware to get user from token
const getUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

router.post('/validate', getUser, async (req, res) => {
  try {
    const result = normalizeConfigInput(req.body || {})

    if (!result.ok) {
      return res.status(400).json({
        valid: false,
        errors: result.errors,
        warnings: result.warnings
      })
    }

    return res.json({
      valid: true,
      errors: [],
      warnings: result.warnings,
      normalized: result.normalized
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// POST - create new config
router.post('/', getUser, async (req, res) => {
  try {
    const result = normalizeConfigInput(req.body || {})

    if (!result.ok) {
      return res.status(400).json({
        error: result.errors.join(' '),
        errors: result.errors,
        warnings: result.warnings
      })
    }

    const config = new Config({
      userId: req.userId,
      app: result.normalized.app,
      entities: result.normalized.entities,
      auth: true,
      settings: result.normalized.settings,
      metadata: {
        normalizationWarnings: result.warnings
      }
    })

    await config.save()
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET - get all configs for current user
router.get('/my', getUser, async (req, res) => {
  try {
    const configs = await Config.find({ userId: req.userId })
    res.json(configs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET - get single config by id
router.get('/:id', getUser, async (req, res) => {
  try {
    const config = await Config.findOne({
      _id: req.params.id,
      userId: req.userId
    })
    if (!config) return res.status(404).json({ error: 'Config not found' })
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE - delete a config
router.delete('/:id', getUser, async (req, res) => {
  try {
    await Config.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    })
    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router