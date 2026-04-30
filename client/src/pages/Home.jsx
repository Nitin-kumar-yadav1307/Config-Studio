/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import { useToast } from '../context/ToastContext'
import AppBuilder from './AppBuilder'
import AppRuntime from './AppRuntime'

export default function Home() {
  const { user, logout } = useAuth()
  const { locale, setLocale, supportedLocales } = useI18n()
  const { pushToast } = useToast()
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('dashboard') // dashboard | builder | runtime
  const [activeConfig, setActiveConfig] = useState(null)

  const token = localStorage.getItem('token')

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await axios.get('/api/configs/my', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConfigs(res.data)
      setLoading(false)
    } catch (err) {
      pushToast(err.response?.data?.error || 'Failed to load apps', 'error')
      setLoading(false)
    }
  }, [pushToast, token])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const handleAppCreated = (newConfig) => {
    setConfigs(prev => [...prev, newConfig])
    setView('dashboard')
  }

  const handleDeleteConfig = async (id) => {
    try {
      await axios.delete(`/api/configs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConfigs(prev => prev.filter(c => c._id !== id))
      pushToast('App deleted', 'success')
    } catch (err) {
      pushToast(err.response?.data?.error || 'Failed to delete app', 'error')
    }
  }

  const openApp = (config) => {
    setActiveConfig(config)
    setView('runtime')
  }

  if (loading) return (
    <div style={styles.center}>⏳ Loading...</div>
  )

  if (view === 'builder') return (
    <AppBuilder
      onCreated={handleAppCreated}
      onBack={() => setView('dashboard')}
    />
  )

  if (view === 'runtime' && activeConfig) return (
    <AppRuntime
      config={activeConfig}
      onBack={() => setView('dashboard')}
    />
  )

  return (
    <div style={styles.container}>
      <div style={styles.bgGlowOne} />
      <div style={styles.bgGlowTwo} />

      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>CONFIG STUDIO</p>
          <h1 style={styles.title}>Launch Config-Driven Apps Fast</h1>
          <p style={styles.subtitle}>Build runtime-ready apps from JSON, not from hardcoded screens.</p>
        </div>
        <div style={styles.headerRight}>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={styles.localeSelect}
          >
            {supportedLocales.map((item) => (
              <option key={item} value={item}>{item.toUpperCase()}</option>
            ))}
          </select>
          <span style={styles.userName}>{user?.name}</span>
          <button
            onClick={() => setView('builder')}
            style={styles.createBtn}
          >
            Create App
          </button>
          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Apps Generated</p>
          <p style={styles.statValue}>{configs.length}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Entities Total</p>
          <p style={styles.statValue}>{configs.reduce((sum, config) => sum + (config.entities?.length || 0), 0)}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Fields Total</p>
          <p style={styles.statValue}>{configs.reduce((sum, config) => sum + (config.entities || []).reduce((inner, entity) => inner + (entity.fields?.length || 0), 0), 0)}</p>
        </div>
      </div>

      {/* App Cards */}
      {configs.length === 0 ? (
        <div style={styles.emptyState}>
          <h2>Your studio is ready.</h2>
          <p>Start with one app blueprint and add entities like customers, invoices, and activities.</p>
          <button
            onClick={() => setView('builder')}
            style={styles.createBtn}
          >
            Create Your First App
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {configs.map(config => (
            <div key={config._id} style={styles.card}>
              <h2 style={styles.cardTitle}>{config.app}</h2>
              <p style={styles.cardMeta}>
                {config.entities?.length || 0} entities • {config.entities?.[0]?.fields.length || 0} fields in first entity
              </p>
              <div style={styles.cardFields}>
                {(config.entities || []).slice(0, 4).map((entity) => (
                  <span key={entity.name} style={styles.fieldTag}>{entity.name}</span>
                ))}
              </div>

              {(config.metadata?.normalizationWarnings || []).length > 0 && (
                <p style={styles.warningText}>
                  {config.metadata.normalizationWarnings.length} normalization warning(s) captured
                </p>
              )}

              <div style={styles.cardActions}>
                <button
                  onClick={() => openApp(config)}
                  style={styles.openBtn}
                >
                  Open App
                </button>
                <button
                  onClick={() => handleDeleteConfig(config._id)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '28px 20px',
    fontFamily: 'var(--font-sans)',
    position: 'relative',
    overflow: 'hidden'
  },
  bgGlowOne: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: '999px',
    background: 'radial-gradient(circle, rgba(14,165,233,0.18) 0%, rgba(14,165,233,0) 72%)',
    top: -100,
    right: -80,
    pointerEvents: 'none'
  },
  bgGlowTwo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: '999px',
    background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0) 70%)',
    left: -80,
    bottom: 40,
    pointerEvents: 'none'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '22px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  title: {
    color: '#0f172a',
    fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)',
    marginBottom: '8px',
    marginTop: 0,
    letterSpacing: '-0.03em',
    fontFamily: 'var(--font-heading)'
  },
  kicker: {
    fontSize: '0.75rem',
    letterSpacing: '0.14em',
    fontWeight: 700,
    color: '#0369a1',
    marginBottom: 8
  },
  subtitle: {
    color: '#475569',
    margin: 0,
    fontSize: '0.96rem'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  userName: {
    color: '#334155',
    fontWeight: 600
  },
  localeSelect: {
    border: '1px solid #ddd',
    borderRadius: '10px',
    padding: '8px 10px',
    background: '#ffffff'
  },
  createBtn: {
    background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.92rem',
    fontWeight: 700
  },
  logoutBtn: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#334155',
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '12px',
    marginBottom: 22
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '12px 14px'
  },
  statLabel: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.8rem'
  },
  statValue: {
    margin: '6px 0 0 0',
    color: '#0f172a',
    fontWeight: 700,
    fontSize: '1.35rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  card: {
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 14px 28px rgba(15,23,42,0.07)'
  },
  cardTitle: {
    fontSize: '1.08rem',
    marginBottom: '8px',
    color: '#0f172a',
    fontFamily: 'var(--font-heading)'
  },
  cardMeta: {
    color: '#64748b',
    fontSize: '0.82rem',
    marginBottom: '12px'
  },
  cardFields: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '15px'
  },
  fieldTag: {
    background: '#e0f2fe',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    color: '#075985'
  },
  cardActions: {
    display: 'flex',
    gap: '10px'
  },
  warningText: {
    marginBottom: '10px',
    color: '#9a3412',
    fontSize: '0.8rem',
    background: '#fff7ed',
    border: '1px solid #fdba74',
    padding: '6px 8px',
    borderRadius: '8px'
  },
  openBtn: {
    flex: 1,
    background: '#0f172a',
    color: 'white',
    border: 'none',
    padding: '9px 10px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700
  },
  deleteBtn: {
    background: '#ff4d4d',
    color: 'white',
    border: 'none',
    padding: '9px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem'
  }
}