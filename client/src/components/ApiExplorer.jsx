import { useMemo } from 'react'

export default function ApiExplorer({ meta, loading, error }) {
  const entities = useMemo(() => meta?.entities || [], [meta])

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>API + Database Explorer</h2>
        {meta?.generatedAt && <span style={styles.generatedAt}>Generated: {new Date(meta.generatedAt).toLocaleString()}</span>}
      </div>

      {loading && <p style={styles.muted}>Loading generated contracts...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && entities.length === 0 && (
        <p style={styles.muted}>No generated entities found.</p>
      )}

      {!loading && !error && entities.map((entity) => (
        <div key={entity.entity} style={styles.entityCard}>
          <h3 style={styles.entityTitle}>{entity.entity}</h3>

          <div style={styles.section}>
            <p style={styles.sectionTitle}>Endpoints</p>
            <ul style={styles.list}>
              <li>{entity.endpoints.list}</li>
              <li>{entity.endpoints.create}</li>
              <li>{entity.endpoints.update}</li>
              <li>{entity.endpoints.remove}</li>
            </ul>
          </div>

          <div style={styles.section}>
            <p style={styles.sectionTitle}>Database Schema</p>
            <div style={styles.schemaGrid}>
              {Object.entries(entity.database.schema || {}).map(([key, value]) => (
                <div key={key} style={styles.schemaRow}>
                  <span style={styles.schemaName}>{key}</span>
                  <span style={styles.schemaType}>{value.type}{value.required ? ' • required' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  card: {
    background: '#ffffff',
    border: '1px solid #d9e4ef',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
    marginBottom: '16px'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  heading: {
    margin: 0,
    color: '#0f172a',
    fontSize: '1.15rem',
    fontFamily: 'var(--font-heading)'
  },
  generatedAt: {
    color: '#64748b',
    fontSize: '0.8rem'
  },
  muted: {
    color: '#64748b',
    marginTop: '10px'
  },
  error: {
    color: '#991b1b',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '8px 10px',
    marginTop: '10px'
  },
  entityCard: {
    marginTop: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px 12px'
  },
  entityTitle: {
    margin: '0 0 8px 0',
    color: '#0f172a'
  },
  section: {
    marginTop: '8px'
  },
  sectionTitle: {
    margin: '0 0 6px 0',
    color: '#334155',
    fontWeight: 700,
    fontSize: '0.88rem'
  },
  list: {
    margin: 0,
    color: '#334155',
    fontSize: '0.85rem',
    paddingLeft: '18px',
    display: 'grid',
    gap: '3px'
  },
  schemaGrid: {
    display: 'grid',
    gap: '6px'
  },
  schemaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '7px 9px'
  },
  schemaName: {
    color: '#0f172a',
    fontWeight: 700,
    fontSize: '0.84rem'
  },
  schemaType: {
    color: '#475569',
    fontSize: '0.82rem'
  }
}
