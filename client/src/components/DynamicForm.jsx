import { useState } from 'react'
import { useI18n } from '../context/I18nContext'

export default function DynamicForm({ fields, onSubmit }) {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const { t } = useI18n()

  if (!fields || fields.length === 0) return (
    <p>⚠️ {t('noFields')}</p>
  )

  const validate = () => {
    const newErrors = {}
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.name} is required`
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e, fieldName) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    // clear error on type
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit(formData)
    setFormData({})
    setErrors({})
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>{t('addEntry')}</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.grid}>
          {fields.map(field => (
            <div key={field.name} style={styles.fieldGroup}>
              <label style={styles.label}>
                {field.name}
                {field.required && <span style={styles.required}> *</span>}
              </label>
              {field.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={Boolean(formData[field.name])}
                  onChange={(e) => handleChange(e, field.name)}
                  style={styles.checkbox}
                />
              ) : (
                <input
                  type={field.type === 'email' ? 'email' :
                        field.type === 'number' ? 'number' :
                        field.type === 'date' ? 'date' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(e, field.name)}
                  placeholder={`Enter ${field.name}`}
                  style={{
                    ...styles.input,
                    borderColor: errors[field.name] ? 'red' : '#ddd'
                  }}
                />
              )}
              {errors[field.name] && (
                <span style={styles.errorText}>{errors[field.name]}</span>
              )}
            </div>
          ))}
        </div>
        <button type="submit" style={styles.button}>
          {t('submit')}
        </button>
      </form>
    </div>
  )
}

const styles = {
  card: {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '14px',
    marginBottom: '30px',
    border: '1px solid #d9e4ef',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)'
  },
  heading: {
    marginBottom: '15px',
    color: '#0f172a',
    fontFamily: 'var(--font-heading)',
    fontSize: '1.15rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '15px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '0.82rem',
    marginBottom: '5px',
    color: '#334155',
    textTransform: 'capitalize',
    fontWeight: 600
  },
  required: {
    color: 'red'
  },
  input: {
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none',
    background: '#ffffff'
  },
  checkbox: {
    width: '18px',
    height: '18px'
  },
  errorText: {
    color: 'red',
    fontSize: '0.75rem',
    marginTop: '3px'
  },
  button: {
    background: 'linear-gradient(140deg, #0a84ff 0%, #0057d9 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 700,
    boxShadow: '0 10px 18px rgba(0, 87, 217, 0.22)'
  }
}