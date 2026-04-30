/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import DynamicForm from '../components/DynamicForm'
import DynamicTable from '../components/DynamicTable'
import CSVImport from '../components/CSVImport'
import DynamicDashboard from '../components/DynamicDashboard'
import ApiExplorer from '../components/ApiExplorer'
import ProjectExporter from '../components/ProjectExporter'
import { useI18n } from '../context/I18nContext'
import { useToast } from '../context/ToastContext'

export default function AppRuntime({ config, onBack }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError] = useState('')
  const [exportData, setExportData] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState('')
  const [pushLoading, setPushLoading] = useState(false)
  const [pushError, setPushError] = useState('')
  const [activeEntityName, setActiveEntityName] = useState(config.entities?.[0]?.name || '')
  const { locale, setLocale, t } = useI18n()
  const { pushToast } = useToast()

  const token = localStorage.getItem('token')
  const entity = config.entities?.find((item) => item.name === activeEntityName) || config.entities?.[0]
  const supportedLocales = config.settings?.supportedLocales || ['en']

  const fetchData = useCallback(async () => {
    if (!entity?.name) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await axios.get(
        `/api/data/${config._id}/${entity.name}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setData(res.data)
      setLoading(false)
    } catch (err) {
      pushToast(err.response?.data?.error || t('actionFailed'), 'error')
      setLoading(false)
    }
  }, [config._id, entity?.name, pushToast, t, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchMeta = useCallback(async () => {
    setMetaLoading(true)
    setMetaError('')
    try {
      const res = await axios.get(`/api/data/meta/${config._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMeta(res.data)
      setMetaLoading(false)
    } catch (err) {
      setMetaError(err.response?.data?.error || 'Failed to load API metadata')
      setMetaLoading(false)
    }
  }, [config._id, token])

  useEffect(() => {
    fetchMeta()
  }, [fetchMeta])

  const handleSubmit = async (formData) => {
    try {
      const res = await axios.post(
        `/api/data/${config._id}/${entity.name}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setData(prev => [...prev, res.data])
      pushToast(t('saveSuccess'), 'success')
    } catch (err) {
      pushToast(err.response?.data?.error || t('actionFailed'), 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `/api/data/${config._id}/${entity.name}/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setData(prev => prev.filter(item => item._id !== id))
      pushToast(t('deleteSuccess'), 'success')
    } catch (err) {
      pushToast(err.response?.data?.error || t('actionFailed'), 'error')
    }
  }

  const handleImport = (newRow) => {
    setData(prev => [...prev, newRow])
  }

  const handleGenerateProject = async () => {
    setExportLoading(true)
    setExportError('')
    try {
      const res = await axios.get(`/api/generator/${config._id}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setExportData(res.data)
      setExportLoading(false)
      pushToast('Project scaffold generated', 'success')
    } catch (err) {
      setExportError(err.response?.data?.error || 'Failed to generate project scaffold')
      setExportLoading(false)
      pushToast('Failed to generate project scaffold', 'error')
    }
  }

  const handleDownloadZip = async () => {
    try {
      const res = await axios.get(`/api/generator/${config._id}/export.zip`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })

      const blobUrl = URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${(config.app || 'generated-app').toLowerCase().replace(/\s+/g, '-')}-scaffold.zip`
      link.click()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      pushToast(err.response?.data?.error || 'Failed to download ZIP', 'error')
    }
  }

  const handlePushGithub = async ({ repo, token: githubToken }) => {
    if (!repo || !githubToken) {
      setPushError('repo and token are required')
      return
    }

    setPushLoading(true)
    setPushError('')
    try {
      const res = await axios.post(
        `/api/generator/${config._id}/push-github`,
        { repo, token: githubToken },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPushLoading(false)
      pushToast(`Pushed ${res.data.filesPushed} files to ${res.data.repository}`, 'success')
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to push scaffold to GitHub'
      setPushError(message)
      setPushLoading(false)
      pushToast(message, 'error')
    }
  }

  if (!entity) {
    return <div style={styles.center}>⚠️ Invalid config: no entities available.</div>
  }

  const configuredComponents = Array.isArray(entity.uiComponents) && entity.uiComponents.length > 0
    ? entity.uiComponents
    : entity.ui
      ? [entity.ui]
      : ['form', 'table', 'dashboard', 'csv']

  const runtimeComponents = [...new Set(configuredComponents.map((component) => String(component).toLowerCase()))]
  const unknownComponents = runtimeComponents.filter((component) => !['form', 'table', 'dashboard', 'csv'].includes(component))
  const componentRegistry = {
    form: () => <DynamicForm fields={entity.fields} onSubmit={handleSubmit} />,
    csv: () => (
      <CSVImport
        fields={entity.fields}
        entityName={entity.name}
        configId={config._id}
        onImport={handleImport}
        headers={{ Authorization: `Bearer ${token}` }}
      />
    ),
    dashboard: () => <DynamicDashboard fields={entity.fields} data={data} />,
    table: () => <DynamicTable fields={entity.fields} data={data} onDelete={handleDelete} />
  }

  if (loading) return <div style={styles.center}>⏳ {t('loadingApp')}</div>

  const requiredCount = entity.fields?.filter((field) => field.required).length || 0
  const optionalCount = (entity.fields?.length || 0) - requiredCount

  return (
    <div style={styles.container}>
      <div style={styles.bgGlow} />
      <div style={styles.header}>
        <div>
          <button onClick={onBack} style={styles.backBtn}>
            ← My Apps
          </button>
          <h1 style={styles.title}>{config.app}</h1>
          <p style={styles.subtitle}>Powered by dynamic config</p>
        </div>

        <div style={styles.controlsRow}>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={styles.select}
          >
            {supportedLocales.map((item) => (
              <option key={item} value={item}>{item.toUpperCase()}</option>
            ))}
          </select>
          <select
            value={entity.name}
            onChange={(e) => setActiveEntityName(e.target.value)}
            style={styles.select}
          >
            {config.entities.map((item) => (
              <option key={item.name} value={item.name}>{item.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Active Entity</p>
          <p style={styles.statValue}>{entity.name}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Records</p>
          <p style={styles.statValue}>{data.length}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Required Fields</p>
          <p style={styles.statValue}>{requiredCount}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Optional Fields</p>
          <p style={styles.statValue}>{optionalCount}</p>
        </div>
      </div>

      {unknownComponents.length > 0 && (
        <div style={styles.warning}>{t('unknownComponent')}</div>
      )}

      {runtimeComponents
        .filter((component) => componentRegistry[component])
        .map((component) => (
          <div key={component}>{componentRegistry[component]()}</div>
        ))}

      <ProjectExporter
        exportData={exportData}
        loading={exportLoading}
        error={exportError}
        onGenerate={handleGenerateProject}
        onDownloadZip={handleDownloadZip}
        onPushGithub={handlePushGithub}
        pushLoading={pushLoading}
        pushError={pushError}
      />

      <ApiExplorer meta={meta} loading={metaLoading} error={metaError} />
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1080px',
    margin: '0 auto',
    padding: '28px 20px',
    fontFamily: 'var(--font-sans)',
    position: 'relative',
    overflow: 'hidden'
  },
  bgGlow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: '999px',
    background: 'radial-gradient(circle, rgba(14,165,233,0.13) 0%, rgba(14,165,233,0) 72%)',
    top: -120,
    right: -120,
    pointerEvents: 'none'
  },
  header: {
    marginBottom: '25px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap'
  },
  controlsRow: {
    display: 'flex',
    gap: '8px'
  },
  select: {
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '8px 10px',
    background: '#ffffff'
  },
  warning: {
    background: '#fff7ed',
    color: '#9a3412',
    border: '1px solid #fdba74',
    borderRadius: '8px',
    padding: '10px 12px',
    marginBottom: '12px'
  },
  backBtn: {
    background: '#e2e8f0',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#1e293b',
    fontWeight: 700,
    marginBottom: '10px',
    display: 'block'
  },
  title: {
    color: '#0f172a',
    fontSize: 'clamp(1.35rem, 2.7vw, 1.9rem)',
    marginBottom: '5px',
    fontFamily: 'var(--font-heading)'
  },
  subtitle: {
    color: '#475569',
    margin: 0
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 12,
    marginBottom: 16
  },
  statCard: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '10px 12px',
    background: '#ffffff'
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
    fontSize: '1.1rem'
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem'
  }
}