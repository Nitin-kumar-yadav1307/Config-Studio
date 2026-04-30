import { useI18n } from '../context/I18nContext'

export default function DynamicTable({ fields, data, onDelete }) {
  const { t } = useI18n()

  if (!fields || fields.length === 0) return (
    <p>⚠️ {t('noFields')}</p>
  )

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>{data.length} Records</h2>

      {data.length === 0 ? (
        <p style={styles.empty}>{t('noData')} ☝️</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {fields.map(field => (
                  <th key={field.name} style={styles.th}>
                    {field.name}
                  </th>
                ))}
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row._id}
                  style={{
                    ...styles.tr,
                    background: index % 2 === 0 ? '#fff' : '#f9f9f9'
                  }}
                >
                  {fields.map(field => (
                    <td key={field.name} style={styles.td}>
                      {row[field.name] ?? (
                        <span style={styles.empty}>—</span>
                      )}
                    </td>
                  ))}
                  <td style={styles.td}>
                    <button
                      onClick={() => onDelete(row._id)}
                      style={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    border: '1px solid #d9e4ef',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)'
  },
  heading: {
    marginBottom: '15px',
    color: '#0f172a',
    fontFamily: 'var(--font-heading)',
    fontSize: '1.15rem'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.92rem',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  th: {
    textAlign: 'left',
    padding: '10px 15px',
    background: '#0f172a',
    color: 'white',
    textTransform: 'capitalize'
  },
  tr: {
    borderBottom: '1px solid #eee'
  },
  td: {
    padding: '10px 15px',
    color: '#333'
  },
  empty: {
    color: '#aaa',
    fontStyle: 'italic'
  },
  deleteBtn: {
    background: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '6px 11px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 700
  }
}