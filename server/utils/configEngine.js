const ALLOWED_TYPES = new Set(['text', 'number', 'email', 'date', 'boolean'])
const ALLOWED_UI_COMPONENTS = new Set(['form', 'table', 'dashboard', 'csv'])

const normalizeEntityName = (name, fallbackName) => {
  if (!name || typeof name !== 'string') return fallbackName
  const cleaned = name.toLowerCase().trim().replace(/\s+/g, '_')
  return cleaned || fallbackName
}

const normalizeField = (field, entityName, fieldIndex, warnings) => {
  if (!field || typeof field !== 'object') {
    warnings.push(`Entity '${entityName}' field at index ${fieldIndex} ignored: not an object.`)
    return null
  }

  if (typeof field.name !== 'string' || !field.name.trim()) {
    warnings.push(`Entity '${entityName}' field at index ${fieldIndex} ignored: missing name.`)
    return null
  }

  const rawType = typeof field.type === 'string' ? field.type.trim().toLowerCase() : 'text'
  const normalizedType = ALLOWED_TYPES.has(rawType) ? rawType : 'text'

  if (!ALLOWED_TYPES.has(rawType)) {
    warnings.push(`Field '${field.name}' in entity '${entityName}' uses unknown type '${rawType || 'empty'}'; defaulted to 'text'.`)
  }

  const normalizedName = field.name.trim().toLowerCase().replace(/\s+/g, '_')

  return {
    name: normalizedName,
    type: normalizedType,
    required: Boolean(field.required)
  }
}

const normalizeUiComponents = (entity, entityName, warnings) => {
  const source = Array.isArray(entity.uiComponents)
    ? entity.uiComponents
    : typeof entity.ui === 'string'
      ? [entity.ui]
      : []

  const normalized = [...new Set(
    source
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim().toLowerCase())
  )]

  const supported = normalized.filter((item) => ALLOWED_UI_COMPONENTS.has(item))
  const unsupported = normalized.filter((item) => !ALLOWED_UI_COMPONENTS.has(item))

  if (unsupported.length > 0) {
    warnings.push(`Entity '${entityName}' has unsupported ui components: ${unsupported.join(', ')}.`)
  }

  if (supported.length === 0) {
    warnings.push(`Entity '${entityName}' had no valid ui components; defaulted to form/table/dashboard/csv.`)
    return ['form', 'table', 'dashboard', 'csv']
  }

  return supported
}

const normalizeSettings = (settings = {}, warnings) => {
  const fallback = ['en']
  const supportedLocales = Array.isArray(settings.supportedLocales)
    ? settings.supportedLocales.filter((locale) => typeof locale === 'string' && locale.trim())
    : fallback

  const locales = supportedLocales.length > 0 ? supportedLocales : fallback
  const defaultLocale = locales.includes(settings.defaultLocale) ? settings.defaultLocale : locales[0]

  if (settings.defaultLocale && !locales.includes(settings.defaultLocale)) {
    warnings.push(`Default locale '${settings.defaultLocale}' is not in supportedLocales; defaulted to '${defaultLocale}'.`)
  }

  return {
    supportedLocales: locales,
    defaultLocale
  }
}

const normalizeConfigInput = ({ app, entities = [], settings = {} }) => {
  const warnings = []

  if (!app || typeof app !== 'string' || !app.trim()) {
    return {
      ok: false,
      errors: ['App name is required.'],
      warnings,
      normalized: null
    }
  }

  if (!Array.isArray(entities) || entities.length === 0) {
    return {
      ok: false,
      errors: ['At least one entity is required.'],
      warnings,
      normalized: null
    }
  }

  const normalizedEntities = entities
    .filter((entity) => entity && typeof entity === 'object')
    .map((entity, index) => {
      const fallbackName = `entity_${index + 1}`
      const name = normalizeEntityName(entity.name, fallbackName)

      const normalizedFields = (Array.isArray(entity.fields) ? entity.fields : [])
        .map((field, fieldIndex) => normalizeField(field, name, fieldIndex, warnings))
        .filter(Boolean)

      const uniqueMap = new Map()
      normalizedFields.forEach((field) => {
        if (!uniqueMap.has(field.name)) {
          uniqueMap.set(field.name, field)
        } else {
          warnings.push(`Duplicate field '${field.name}' in entity '${name}' ignored.`)
        }
      })

      const fields = Array.from(uniqueMap.values())
      const uiComponents = normalizeUiComponents(entity, name, warnings)

      return {
        name,
        fields,
        ui: uiComponents.includes('table') ? 'table' : uiComponents[0],
        uiComponents
      }
    })
    .filter((entity) => {
      if (entity.fields.length === 0) {
        warnings.push(`Entity '${entity.name}' ignored because it has no valid fields.`)
        return false
      }
      return true
    })

  if (normalizedEntities.length === 0) {
    return {
      ok: false,
      errors: ['No valid entities available after normalization.'],
      warnings,
      normalized: null
    }
  }

  const normalized = {
    app: app.trim(),
    entities: normalizedEntities,
    settings: normalizeSettings(settings, warnings)
  }

  return {
    ok: true,
    errors: [],
    warnings,
    normalized
  }
}

module.exports = {
  normalizeConfigInput,
  ALLOWED_TYPES,
  ALLOWED_UI_COMPONENTS
}
