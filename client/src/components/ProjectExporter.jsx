import { useState } from 'react'

export default function ProjectExporter({
  exportData,
  loading,
  error,
  onGenerate,
  onDownloadZip,
  onPushGithub,
  pushLoading,
  pushError
}) {
  const [repoName, setRepoName] = useState('')
  const [githubToken, setGithubToken] = useState('')

  const handleDownload = () => {
    if (!exportData) return

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exportData.scaffold?.projectName || 'generated-app'}-scaffold.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const files = exportData?.scaffold?.files || []

  const handlePush = () => {
    onPushGithub({ repo: repoName, token: githubToken })
  }

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>Project Generator</h2>
        <button onClick={onGenerate} style={styles.generateBtn} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Scaffold'}
        </button>
      </div>

      <p style={styles.subtext}>
        Generates a standalone full-stack scaffold (frontend + backend + contracts) from your live config.
      </p>

      {error && <p style={styles.error}>{error}</p>}

      {exportData && (
        <>
          <div style={styles.metaRow}>
            <span>Files: {exportData.scaffold?.summary?.fileCount || files.length}</span>
            <span>Entities: {exportData.scaffold?.summary?.entityCount || 0}</span>
            <button onClick={handleDownload} style={styles.downloadBtn}>Download JSON</button>
            <button onClick={onDownloadZip} style={styles.zipBtn}>Download ZIP</button>
          </div>

          <div style={styles.fileList}>
            {files.slice(0, 14).map((file) => (
              <div key={file.path} style={styles.fileItem}>{file.path}</div>
            ))}
            {files.length > 14 && (
              <div style={styles.more}>+{files.length - 14} more files</div>
            )}
          </div>

          <div style={styles.githubBox}>
            <p style={styles.githubTitle}>Push to GitHub</p>
            <p style={styles.githubHint}>Repository format: owner/repo. Token is used only for this action.</p>
            <div style={styles.githubRow}>
              <input
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="owner/repo"
                style={styles.input}
              />
              <input
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="GitHub token"
                type="password"
                style={styles.input}
              />
              <button onClick={handlePush} style={styles.pushBtn} disabled={pushLoading}>
                {pushLoading ? 'Pushing...' : 'Push to GitHub'}
              </button>
            </div>
            {pushError && <p style={styles.pushError}>{pushError}</p>}
          </div>
        </>
      )}
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
  subtext: {
    marginTop: '8px',
    color: '#475569',
    fontSize: '0.88rem'
  },
  error: {
    color: '#991b1b',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '8px 10px',
    marginTop: '10px'
  },
  generateBtn: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '9px 12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  metaRow: {
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    color: '#334155',
    fontSize: '0.86rem'
  },
  downloadBtn: {
    background: 'linear-gradient(140deg, #0a84ff 0%, #0057d9 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  zipBtn: {
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  fileList: {
    marginTop: '10px',
    display: 'grid',
    gap: '6px'
  },
  fileItem: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '7px 9px',
    fontSize: '0.82rem',
    color: '#334155',
    background: '#f8fbff'
  },
  more: {
    fontSize: '0.82rem',
    color: '#64748b'
  },
  githubBox: {
    marginTop: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px'
  },
  githubTitle: {
    color: '#0f172a',
    fontWeight: 700,
    marginBottom: '4px',
    fontSize: '0.9rem'
  },
  githubHint: {
    color: '#64748b',
    fontSize: '0.8rem',
    marginBottom: '8px'
  },
  githubRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: '8px'
  },
  input: {
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '0.82rem'
  },
  pushBtn: {
    background: 'linear-gradient(140deg, #0a84ff 0%, #0057d9 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  pushError: {
    marginTop: '8px',
    color: '#991b1b',
    fontSize: '0.82rem'
  }
}
