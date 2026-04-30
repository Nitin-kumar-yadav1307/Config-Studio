import { useState } from 'react'
import Papa from 'papaparse'
import axios from 'axios'
import { useToast } from '../context/ToastContext'

export default function CSVImport({ fields, entityName, configId, onImport, headers = {} }) {
  const [fullData, setFullData] = useState([])
  const [preview, setPreview] = useState([])
  const [mapping, setMapping] = useState({})
  const [csvHeaders, setCsvHeaders] = useState([])
  const [step, setStep] = useState(1) // 1=upload, 2=map, 3=done
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { pushToast } = useToast()

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError('')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setError('CSV file is empty!')
          return
        }
        const headers = Object.keys(results.data[0])
        setCsvHeaders(headers)
        setPreview(results.data.slice(0, 3)) // show first 3 rows
        setFullData(results.data) // store ALL rows not just 3
        // auto map if header names match field names
        const autoMap = {}
        fields.forEach(field => {
          if (headers.includes(field.name)) {
            autoMap[field.name] = field.name
          } else {
            autoMap[field.name] = ''
          }
        })
        setMapping(autoMap)
        setStep(2)
      },
      error: () => {
        setError('Failed to parse CSV file')
      }
    })
  }

  const handleImport = async () => {
  setLoading(true)
  setError('')

  try {
      const requiredFields = fields.filter((field) => field.required).map((field) => field.name)
      const missingRequiredMappings = requiredFields.filter((fieldName) => !mapping[fieldName])
      if (missingRequiredMappings.length > 0) {
        setError(`Required mappings missing: ${missingRequiredMappings.join(', ')}`)
        setLoading(false)
        return
      }

    const mapped = fullData.map(row => {
      const obj = {}
      fields.forEach(field => {
        const csvCol = mapping[field.name]
        if (csvCol && row[csvCol] !== undefined) {
          obj[field.name] = row[csvCol]
        }
      })
      return obj
    })

    let successCount = 0
    let failedCount = 0
    for (const row of mapped) {
      try {
        const res = await axios.post(`/api/data/${configId}/${entityName}`, row, { headers })
        onImport(res.data)
        successCount++
      } catch {
        failedCount++
      }
    }

    if (successCount > 0) {
      setStep(3)
      pushToast(`Import successful (${successCount} rows)`, 'success')
      if (failedCount > 0) {
        pushToast(`${failedCount} rows failed`, 'error')
      }
    } else {
      setError('All rows failed to import')
      pushToast('Import failed', 'error')
    }
    setLoading(false)

  } catch (err) {
    setError('Import failed: ' + err.message)
      pushToast('Import failed', 'error')
  }
}

  const handleReset = () => {
    setStep(1)
    setPreview([])
    setMapping({})
    setCsvHeaders([])
    setError('')
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>CSV Import</h2>

      {/* Step 1 - Upload */}
      {step === 1 && (
        <div style={styles.uploadArea}>
          <p style={styles.hint}>
            Upload a CSV file to bulk import data
          </p>
          {error && <p style={styles.error}>❌ {error}</p>}
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={styles.fileInput}
          />
          <label htmlFor="csv-input" style={styles.uploadBtn}>
            Choose CSV File
          </label>
        </div>
      )}

      {/* Step 2 - Map columns */}
      {step === 2 && (
        <div>
          <p style={styles.hint}>
            Map your CSV columns to app fields:
          </p>

          {/* mapping UI */}
          <div style={styles.mappingGrid}>
            {fields.map(field => (
              <div key={field.name} style={styles.mappingRow}>
                <span style={styles.fieldName}>
                  {field.name}
                  {field.required &&
                    <span style={styles.required}> *</span>}
                </span>
                <span style={styles.arrow}>→</span>
                <select
                  value={mapping[field.name] || ''}
                  onChange={e => setMapping(prev => ({
                    ...prev,
                    [field.name]: e.target.value
                  }))}
                  style={styles.select}
                >
                  <option value="">-- skip --</option>
                  {csvHeaders.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* preview */}
          <div style={styles.previewBox}>
            <p style={styles.previewTitle}>
              📋 Preview (first 3 rows):
            </p>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {csvHeaders.map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {csvHeaders.map(h => (
                        <td key={h} style={styles.td}>
                          {row[h] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && <p style={styles.error}>❌ {error}</p>}

          <div style={styles.btnRow}>
            <button
              onClick={handleReset}
              style={styles.cancelBtn}
            >
              ← Back
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              style={styles.importBtn}
            >
              {loading ? '⏳ Importing...' : '✅ Import Data'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 - Done */}
      {step === 3 && (
        <div style={styles.successBox}>
          <p style={styles.successText}>
            Import Successful
          </p>
          <p style={styles.hint}>
            Data has been added to the table below.
          </p>
          <button
            onClick={handleReset}
            style={styles.importBtn}
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: '#ffffff',
    padding: '20px',
    borderRadius: '14px',
    marginBottom: '20px',
    border: '1px solid #d9e4ef',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)'
  },
  heading: {
    marginBottom: '15px',
    color: '#0f172a',
    fontFamily: 'var(--font-heading)',
    fontSize: '1.15rem'
  },
  hint: {
    color: '#888',
    marginBottom: '15px',
    fontSize: '0.9rem'
  },
  error: {
    color: 'red',
    fontSize: '0.9rem',
    marginBottom: '10px'
  },
  uploadArea: {
    textAlign: 'center',
    padding: '20px'
  },
  fileInput: {
    display: 'none'
  },
  uploadBtn: {
    background: '#0f172a',
    color: 'white',
    padding: '10px 25px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.92rem',
    fontWeight: 700,
    display: 'inline-block'
  },
  mappingGrid: {
    marginBottom: '20px'
  },
  mappingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '10px'
  },
  fieldName: {
    width: '120px',
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize'
  },
  required: {
    color: 'red'
  },
  arrow: {
    color: '#888'
  },
  select: {
    padding: '6px 10px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
    minWidth: '150px'
  },
  previewBox: {
    marginBottom: '20px'
  },
  previewTitle: {
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#555'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem'
  },
  th: {
    background: '#0f172a',
    color: 'white',
    padding: '8px 12px',
    textAlign: 'left'
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #eee',
    color: '#333'
  },
  btnRow: {
    display: 'flex',
    gap: '10px'
  },
  cancelBtn: {
    background: '#64748b',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 700
  },
  importBtn: {
    background: 'linear-gradient(140deg, #0a84ff 0%, #0057d9 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 25px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 700
  },
  successBox: {
    textAlign: 'center',
    padding: '20px'
  },
  successText: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: '10px'
  }
}