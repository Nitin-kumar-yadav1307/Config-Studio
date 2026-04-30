const mongoose = require('mongoose')

const fieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'text' },
  required: { type: Boolean, default: false }
})

const entitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  fields: [fieldSchema],
  ui: { type: String, default: 'table' },
  uiComponents: {
    type: [String],
    default: ['form', 'table', 'dashboard', 'csv']
  }
})

const configSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  app: { type: String, required: true },
  entities: [entitySchema],
  auth: { type: Boolean, default: true },
  settings: {
    defaultLocale: { type: String, default: 'en' },
    supportedLocales: { type: [String], default: ['en'] }
  },
  metadata: {
    normalizationWarnings: { type: [String], default: [] }
  }
}, { timestamps: true })

module.exports = mongoose.model('Config', configSchema)