import { useState } from 'react'
import axios from 'axios'

const createId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

const createField = (field = {}) => ({
  id: createId(),
  name: field.name || '',
  type: field.type || 'text',
  required: Boolean(field.required)
})

const createEntity = (entity = {}) => ({
  id: createId(),
  name: entity.name || '',
  ui: entity.ui || 'table',
  uiComponents: Array.isArray(entity.uiComponents) && entity.uiComponents.length > 0
    ? entity.uiComponents
    : ['form', 'table', 'dashboard', 'csv'],
  fields: Array.isArray(entity.fields) && entity.fields.length > 0
    ? entity.fields.map(createField)
    : [createField({})]
})

export default function AppBuilder({ onCreated, onBack }) {
  const [appName, setAppName] = useState('')
  const [entities, setEntities] = useState([
    createEntity({
      name: 'customers',
      ui: 'table',
      uiComponents: ['form', 'table', 'dashboard', 'csv'],
      fields: [
        { name: 'fullName', type: 'text', required: true },
        { name: 'email', type: 'email', required: true }
      ]
    })
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  const addEntity = () => {
    setEntities((prev) => ([
      ...prev,
      createEntity({
        name: `entity_${prev.length + 1}`,
        ui: 'table',
        uiComponents: ['form', 'table', 'dashboard', 'csv'],
        fields: [{ name: 'field_1', type: 'text', required: false }]
      })
    ]))
  }

  const updateEntity = (entityId, key, value) => {
    setEntities((prev) => prev.map((entity) => (
      entity.id === entityId ? { ...entity, [key]: value } : entity
    )))
  }

  const removeEntity = (entityId) => {
    setEntities((prev) => prev.filter((entity) => entity.id !== entityId))
  }

  const addField = (entityId) => {
    setEntities((prev) => prev.map((entity) => {
      if (entity.id !== entityId) return entity
      const newFieldNum = entity.fields.length + 1
      return {
        ...entity,
        fields: [...entity.fields, createField({ name: `field_${newFieldNum}` })]
      }
    }))
  }

  const removeField = (entityId, fieldId) => {
    setEntities((prev) => prev.map((entity) => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        fields: entity.fields.filter((field) => field.id !== fieldId)
      }
    }))
  }

  const updateField = (entityId, fieldId, key, value) => {
    setEntities((prev) => prev.map((entity) => {
      if (entity.id !== entityId) return entity
      return {
        ...entity,
        fields: entity.fields.map((field) => (
          field.id === fieldId ? { ...field, [key]: value } : field
        ))
      }
    }))
  }

  const handleCreate = async () => {
    setError('')

    if (!appName.trim()) {
      setError('App name is required')
      return
    }

    const sanitizedEntities = entities
      .map((entity, entityIndex) => {
        const cleanedName = (entity.name || '').trim().toLowerCase().replace(/\s+/g, '_') || `entity_${entityIndex + 1}`
        const cleanedFields = entity.fields
          .map((field) => ({
            ...field,
            name: (field.name || '').trim().toLowerCase().replace(/\s+/g, '_')
          }))
          .filter((field) => field.name)

        return {
          name: cleanedName,
          ui: entity.ui,
          uiComponents: Array.isArray(entity.uiComponents) && entity.uiComponents.length > 0
            ? entity.uiComponents
            : ['form', 'table'],
          fields: cleanedFields
        }
      })
      .filter((entity) => entity.fields.length > 0)

    if (sanitizedEntities.length === 0) {
      setError('Add at least one valid entity with fields')
      return
    }

    for (const entity of sanitizedEntities) {
      const uniqueNames = new Set(entity.fields.map((field) => field.name))
      if (uniqueNames.size !== entity.fields.length) {
        setError(`Field names must be unique inside entity: ${entity.name}`)
        return
      }
    }

    setLoading(true)
    try {
      const config = {
        app: appName,
        entities: sanitizedEntities
      }

      const res = await axios.post('/api/configs', config, { headers })
      onCreated(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create app')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <button onClick={onBack} style={styles.backBtn}>
            ← Back
          </button>
          <h1 style={styles.title}>Create New App</h1>
        </div>

        <div style={styles.banner}>
          <h3 style={styles.bannerTitle}>Studio Mode</h3>
          <p style={styles.bannerText}>
            Build a real app blueprint with multiple entities, typed fields, and locale settings.
          </p>
        </div>

        {error && <div style={styles.error}>❌ {error}</div>}

        {/* App Name */}
        <div style={styles.section}>
          <label style={styles.label}>App Name *</label>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. Coffee Shop, Student Manager, CRM..."
            value={appName}
            onChange={e => setAppName(e.target.value)}
          />
        </div>

        {/* Entities */}
        <div style={styles.section}>
          <label style={styles.label}>Entities *</label>
          <p style={styles.hint}>
            Define data modules for your generated app
          </p>

          {entities.map((entity, entityIndex) => (
            <div key={entity.id} style={styles.entityCard}>
              <div style={styles.entityHeader}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  type="text"
                  placeholder="Entity name (e.g. customers, invoices)"
                  value={entity.name}
                  onChange={(e) => updateEntity(entity.id, 'name', e.target.value)}
                />
                <select
                  style={styles.input}
                  value={entity.ui}
                  onChange={(e) => updateEntity(entity.id, 'ui', e.target.value)}
                >
                  <option value="table">Table</option>
                  <option value="form">Form + Table</option>
                </select>
                {entities.length > 1 && (
                  <button
                    onClick={() => removeEntity(entity.id)}
                    style={styles.removeBtn}
                  >
                    Remove
                  </button>
                )}
              </div>

              {entity.fields.map((field) => (
                <div key={field.id} style={styles.fieldRow}>
                  <input
                    style={{ ...styles.input, flex: 2 }}
                    type="text"
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => updateField(entity.id, field.id, 'name', e.target.value)}
                  />
                  <select
                    style={{ ...styles.input, flex: 1 }}
                    value={field.type}
                    onChange={(e) => updateField(entity.id, field.id, 'type', e.target.value)}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <label style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(entity.id, field.id, 'required', e.target.checked)}
                    />
                    Required
                  </label>
                  {entity.fields.length > 1 && (
                    <button
                      onClick={() => removeField(entity.id, field.id)}
                      style={styles.removeBtn}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button onClick={() => addField(entity.id)} style={styles.addFieldBtn}>
                Add Field
              </button>

              <div style={styles.moduleRow}>
                {['form', 'table', 'dashboard', 'csv'].map((moduleKey) => (
                  <label key={moduleKey} style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={(entity.uiComponents || []).includes(moduleKey)}
                      onChange={(e) => {
                        const current = entity.uiComponents || []
                        if (e.target.checked) {
                          updateEntity(entityIndex, 'uiComponents', [...new Set([...current, moduleKey])])
                        } else {
                          const next = current.filter((item) => item !== moduleKey)
                          updateEntity(entityIndex, 'uiComponents', next.length > 0 ? next : ['form', 'table'])
                        }
                      }}
                    />
                    {moduleKey}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button onClick={addEntity} style={styles.addEntityBtn}>
            Add Entity
          </button>
        </div>

        {/* Preview */}
        {appName && entities.some((entity) => entity.fields.some((field) => field.name)) && (
          <div style={styles.preview}>
            <p style={styles.previewTitle}>📋 Config Preview:</p>
            <pre style={styles.previewCode}>
              {JSON.stringify({
                app: appName,
                entities: entities.map((entity, index) => ({
                  name: (entity.name || '').toLowerCase().replace(/\s+/g, '_') || `entity_${index + 1}`,
                  fields: entity.fields.filter((field) => field.name),
                  ui: entity.ui,
                  uiComponents: entity.uiComponents || ['form', 'table']
                }))
              }, null, 2)}
            </pre>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          style={styles.createBtn}
        >
          {loading ? 'Creating...' : 'Generate App'}
        </button>

      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '980px',
    margin: '0 auto',
    padding: '28px 20px',
    fontFamily: 'var(--font-sans)'
  },
  card: {
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: '18px',
    border: '1px solid #d9e4ef',
    padding: '30px',
    boxShadow: '0 20px 45px rgba(14, 40, 72, 0.08)'
  },
  banner: {
    marginBottom: '20px',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #ecfeff 100%)'
  },
  bannerTitle: {
    margin: '0 0 4px 0',
    color: '#0f172a'
  },
  bannerText: {
    margin: 0,
    color: '#334155',
    fontSize: '0.92rem'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '25px'
  },
  backBtn: {
    background: '#f0f0f0',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#555'
  },
  title: {
    margin: 0,
    color: '#0f172a',
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(1.35rem, 2.5vw, 1.8rem)'
  },
  error: {
    background: '#ffe0e0',
    color: '#cc0000',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px'
  },
  section: {
    marginBottom: '25px'
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333'
  },
  hint: {
    color: '#888',
    fontSize: '0.85rem',
    marginBottom: '10px'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  fieldRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap'
  },
  entityCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '14px',
    background: '#ffffff'
  },
  entityHeader: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    flexWrap: 'wrap'
  },
  moduleRow: {
    marginTop: '10px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: '#555',
    fontSize: '0.84rem',
    whiteSpace: 'nowrap'
  },
  removeBtn: {
    background: '#ff4d4d',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700
  },
  addFieldBtn: {
    background: '#e2e8f0',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#1e293b',
    fontWeight: 700,
    marginTop: '5px'
  },
  addEntityBtn: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '8px',
    fontWeight: 700
  },
  preview: {
    background: '#0f172a',
    borderRadius: '12px',
    padding: '15px',
    marginBottom: '20px'
  },
  previewTitle: {
    color: '#aaa',
    margin: '0 0 10px 0',
    fontSize: '0.85rem'
  },
  previewCode: {
    color: '#4CAF50',
    fontSize: '0.8rem',
    margin: 0,
    overflow: 'auto'
  },
  createBtn: {
    width: '100%',
    background: 'linear-gradient(140deg, #0a84ff 0%, #0057d9 100%)',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '1.1rem',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 10px 18px rgba(0, 87, 217, 0.25)'
  }
}