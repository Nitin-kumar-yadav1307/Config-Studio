export default function DynamicDashboard({ fields = [], data = [] }) {
  const numericFields = fields.filter((field) => field.type === 'number')

  const totalByField = numericFields.map((field) => {
    const total = data.reduce((sum, row) => {
      const value = Number(row[field.name])
      return Number.isNaN(value) ? sum : sum + value
    }, 0)

    return {
      name: field.name,
      total
    }
  })

  const completion = fields.length > 0
    ? Math.round((fields.filter((field) => field.required).length / fields.length) * 100)
    : 0

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.heading}>Dashboard</h2>

      <div style={styles.grid}>
        <div style={styles.card}>
          <p style={styles.label}>Total Records</p>
          <p style={styles.value}>{data.length}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.label}>Field Completion Baseline</p>
          <p style={styles.value}>{completion}%</p>
        </div>
        <div style={styles.card}>
          <p style={styles.label}>Numeric Fields</p>
          <p style={styles.value}>{numericFields.length}</p>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Totals by Numeric Field</h3>
        {totalByField.length === 0 ? (
          <p style={styles.empty}>No numeric fields to aggregate.</p>
        ) : (
          <div style={styles.metricsList}>
            {totalByField.map((item) => (
              <div key={item.name} style={styles.metricItem}>
                <span style={styles.metricName}>{item.name}</span>
                <span style={styles.metricValue}>{item.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Latest Activity</h3>
        {data.length === 0 ? (
          <p style={styles.empty}>No records yet.</p>
        ) : (
          <div style={styles.activityList}>
            {data.slice(0, 5).map((row) => (
              <div key={row._id} style={styles.activityItem}>
                <strong>{row._id?.slice(-6) || 'record'}</strong>
                <span>{new Date(row.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    background: '#ffffff',
    border: '1px solid #d9e4ef',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '18px',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)'
  },
  heading: {
    margin: '0 0 12px 0',
    color: '#0f172a',
    fontFamily: 'var(--font-heading)',
    fontSize: '1.15rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
    marginBottom: '14px'
  },
  card: {
    borderRadius: '12px',
    border: '1px solid #dbeafe',
    background: '#f8fbff',
    padding: '10px'
  },
  label: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.8rem'
  },
  value: {
    margin: '6px 0 0 0',
    color: '#0f172a',
    fontWeight: 700,
    fontSize: '1.1rem'
  },
  section: {
    marginTop: '12px'
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    color: '#1e293b',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.98rem'
  },
  metricsList: {
    display: 'grid',
    gap: '6px'
  },
  metricItem: {
    display: 'flex',
    justifyContent: 'space-between',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 10px',
    background: '#ffffff'
  },
  metricName: {
    color: '#334155'
  },
  metricValue: {
    color: '#0f172a',
    fontWeight: 700
  },
  activityList: {
    display: 'grid',
    gap: '6px'
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 10px'
  },
  empty: {
    margin: 0,
    color: '#64748b'
  }
}
