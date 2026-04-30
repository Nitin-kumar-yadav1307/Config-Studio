const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const Config = require('../models/Config')

const ALLOWED_TYPES = new Set(['text', 'number', 'email', 'date', 'boolean'])

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

const normalizeFields = (fields = []) => {
  return fields
    .filter((field) => field && typeof field.name === 'string' && field.name.trim())
    .map((field) => ({
      name: field.name.trim().toLowerCase().replace(/\s+/g, '_'),
      type: ALLOWED_TYPES.has(field.type) ? field.type : 'text',
      required: Boolean(field.required)
    }))
}

const coerceValue = (value, type) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (type === 'number') {
    const num = Number(value)
    if (Number.isNaN(num)) {
      throw new Error(`Invalid number value: ${value}`)
    }
    return num
  }

  if (type === 'boolean') {
    if (value === true || value === false) return value
    if (value === 'true') return true
    if (value === 'false') return false
    throw new Error(`Invalid boolean value: ${value}`)
  }

  if (type === 'date') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date value: ${value}`)
    }
    return date.toISOString()
  }

  return String(value)
}

const sanitizePayload = ({ payload = {}, fields = [], requireAllRequired = false }) => {
  const sanitized = {}
  const extras = {}
  const fieldMap = new Map(fields.map((f) => [f.name, f]))

  Object.keys(payload).forEach((key) => {
    if (key === 'userId' || key === 'configId' || key === '__extra') {
      return
    }

    if (!fieldMap.has(key)) {
      extras[key] = payload[key]
      return
    }

    const field = fieldMap.get(key)
    const coerced = coerceValue(payload[key], field.type)
    if (coerced !== undefined) {
      sanitized[key] = coerced
    }
  })

  if (requireAllRequired) {
    const missing = fields
      .filter((field) => field.required)
      .filter((field) => {
        const value = sanitized[field.name]
        return value === undefined || value === ''
      })
      .map((field) => field.name)

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }
  }

  return { sanitized, extras }
}

// build mongoose schema from fields
const buildSchema = (fields) => {
  const schemaObj = {}
  fields.forEach(field => {
    if (field.type === 'number') {
      schemaObj[field.name] = { type: Number, required: field.required || false }
    } else if (field.type === 'boolean') {
      schemaObj[field.name] = { type: Boolean, required: field.required || false }
    } else {
      schemaObj[field.name] = { type: String, required: field.required || false }
    }
  })
  schemaObj['userId'] = { type: String }
  schemaObj['configId'] = { type: String }
  schemaObj['__extra'] = { type: mongoose.Schema.Types.Mixed, default: {} }
  return new mongoose.Schema(schemaObj, { timestamps: true })
}

// get or create dynamic model
const getModel = (configId, entityName, fields) => {
  const modelName = `entity_${configId}_${entityName}`
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName]
  }
  const schema = buildSchema(fields)
  return mongoose.model(modelName, schema, `${configId}_${entityName}`)
}

const buildEntityContract = (configId, entityName, fields = []) => {
  const fieldSchema = fields.reduce((acc, field) => {
    acc[field.name] = {
      type: field.type,
      required: Boolean(field.required)
    }
    return acc
  }, {})

  return {
    entity: entityName,
    endpoints: {
      list: `GET /api/data/${configId}/${entityName}`,
      create: `POST /api/data/${configId}/${entityName}`,
      update: `PUT /api/data/${configId}/${entityName}/:id`,
      remove: `DELETE /api/data/${configId}/${entityName}/:id`
    },
    database: {
      collection: entityName,
      schema: {
        ...fieldSchema,
        userId: { type: 'string', required: true },
        configId: { type: 'string', required: true },
        __extra: { type: 'mixed', required: false }
      }
    }
  }
}

router.get('/meta/:configId', getUser, async (req, res) => {
  try {
    const config = await Config.findOne({
      _id: req.params.configId,
      userId: req.userId
    })
    if (!config) return res.status(404).json({ error: 'Config not found' })

    const entities = config.entities
      .map((entity) => {
        const normalizedFields = normalizeFields(entity.fields)
        if (normalizedFields.length === 0) return null
        return buildEntityContract(req.params.configId, entity.name, normalizedFields)
      })
      .filter(Boolean)

    return res.json({
      app: config.app,
      configId: config._id,
      generatedAt: new Date().toISOString(),
      entities
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

router.post('/sync/:configId', getUser, async (req, res) => {
  try {
    const config = await Config.findOne({
      _id: req.params.configId,
      userId: req.userId
    })
    if (!config) return res.status(404).json({ error: 'Config not found' })

    const synced = []

    for (const entity of config.entities) {
      const normalizedFields = normalizeFields(entity.fields)
      if (normalizedFields.length === 0) continue

      const Model = getModel(req.params.configId, entity.name, normalizedFields)
      await Model.createCollection()
      synced.push(buildEntityContract(req.params.configId, entity.name, normalizedFields))
    }

    return res.json({
      message: 'Dynamic database schema synchronized from config',
      app: config.app,
      entities: synced
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// GET all records for an entity
router.get('/:configId/:entityName', getUser, async (req, res) => {
  try {
    console.log(`\n[GET] Fetching data for configId=${req.params.configId}, entityName=${req.params.entityName}`)
    
    const config = await Config.findOne({
      _id: req.params.configId,
      userId: req.userId
    })
    if (!config) {
      console.error('Config not found')
      return res.status(404).json({ error: 'Config not found' })
    }
    console.log(`Config found. Entities: ${config.entities.map(e => e.name).join(', ')}`)

    const entity = config.entities.find(e => e.name === req.params.entityName)
    if (!entity) {
      console.error(`Entity '${req.params.entityName}' not found`)
      return res.status(404).json({ error: `Entity '${req.params.entityName}' not found. Available: ${config.entities.map(e => e.name).join(', ')}` })
    }
    
    console.log(`Entity found. Raw fields:`, JSON.stringify(entity.fields, null, 2))
    const normalizedFields = normalizeFields(entity.fields || [])
    console.log(`After normalization: ${normalizedFields.length} fields`)
    console.log(`Normalized fields:`, JSON.stringify(normalizedFields, null, 2))
    
    if (normalizedFields.length === 0) {
      console.error(`Empty fields after normalization. Raw: ${(entity.fields || []).length}`)
      return res.status(400).json({ 
        error: 'Entity has no valid fields in config',
        debug: { 
          rawFieldCount: (entity.fields || []).length, 
          normalizedFieldCount: normalizedFields.length,
          rawFields: entity.fields
        }
      })
    }

    const Model = getModel(req.params.configId, entity.name, normalizedFields)
    const data = await Model.find({
      userId: req.userId,
      configId: req.params.configId
    })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create record
router.post('/:configId/:entityName', getUser, async (req, res) => {
  try {
    const config = await Config.findOne({
      _id: req.params.configId,
      userId: req.userId
    })
    if (!config) return res.status(404).json({ error: 'Config not found' })

    const entity = config.entities.find(e => e.name === req.params.entityName)
    if (!entity) return res.status(404).json({ error: 'Entity not found' })

    const normalizedFields = normalizeFields(entity.fields)
    if (normalizedFields.length === 0) {
      return res.status(400).json({ error: 'Entity has no valid fields in config' })
    }

    const Model = getModel(req.params.configId, entity.name, normalizedFields)

    const { sanitized, extras } = sanitizePayload({
      payload: req.body,
      fields: normalizedFields,
      requireAllRequired: true
    })

    const body = {
      ...sanitized,
      __extra: extras,
      userId: req.userId,
      configId: req.params.configId
    }

    const doc = new Model(body)
    await doc.save()
    res.json(doc)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT update record
router.put('/:configId/:entityName/:id', getUser, async (req, res) => {
  try {
    const config = await Config.findOne({
      _id: req.params.configId,
      userId: req.userId
    })
    if (!config) return res.status(404).json({ error: 'Config not found' })

    const entity = config.entities.find(e => e.name === req.params.entityName)
    if (!entity) return res.status(404).json({ error: 'Entity not found' })

    const normalizedFields = normalizeFields(entity.fields)
    if (normalizedFields.length === 0) {
      return res.status(400).json({ error: 'Entity has no valid fields in config' })
    }

    const Model = getModel(req.params.configId, entity.name, normalizedFields)
    const existing = await Model.findOne({
      _id: req.params.id,
      userId: req.userId,
      configId: req.params.configId
    })

    if (!existing) {
      return res.status(404).json({ error: 'Record not found' })
    }

    const { sanitized, extras } = sanitizePayload({
      payload: req.body,
      fields: normalizedFields,
      requireAllRequired: false
    })

    const nextExtra = { ...(existing.__extra || {}), ...extras }
    const doc = await Model.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
        configId: req.params.configId
      },
      { ...sanitized, __extra: nextExtra },
      { new: true }
    )
    res.json(doc)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE record
router.delete('/:configId/:entityName/:id', getUser, async (req, res) => {
  try {
    const config = await Config.findOne({
      _id: req.params.configId,
      userId: req.userId
    })
    if (!config) return res.status(404).json({ error: 'Config not found' })

    const entity = config.entities.find(e => e.name === req.params.entityName)
    if (!entity) return res.status(404).json({ error: 'Entity not found' })

    const normalizedFields = normalizeFields(entity.fields)
    if (normalizedFields.length === 0) {
      return res.status(400).json({ error: 'Entity has no valid fields in config' })
    }

    const Model = getModel(req.params.configId, entity.name, normalizedFields)
    const deleted = await Model.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
      configId: req.params.configId
    })

    if (!deleted) {
      return res.status(404).json({ error: 'Record not found' })
    }

    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router