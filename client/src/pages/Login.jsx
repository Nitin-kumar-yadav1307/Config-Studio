import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        await register(form.name, form.email, form.password)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.glowLeft} />
      <div style={styles.glowRight} />
      <div style={styles.card}>
        <p style={styles.kicker}>CONFIG STUDIO</p>
       
        <h2 style={styles.subtitle}>
          {isLogin ? 'Sign in to continue' : 'Create your workspace account'}
        </h2>

        {error && (
          <div style={styles.error}>❌ {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={styles.toggle}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            style={styles.link}
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden'
  },
  glowLeft: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: '999px',
    background: 'radial-gradient(circle, rgba(8,145,178,0.24) 0%, rgba(8,145,178,0) 72%)',
    left: -100,
    top: 40,
    pointerEvents: 'none'
  },
  glowRight: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: '999px',
    background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, rgba(37,99,235,0) 72%)',
    right: -120,
    bottom: -80,
    pointerEvents: 'none'
  },
  card: {
    background: 'linear-gradient(165deg, #ffffff 0%, #f8fbff 100%)',
    padding: '34px',
    borderRadius: '18px',
    width: '100%',
    maxWidth: '440px',
    border: '1px solid #d9e4ef',
    boxShadow: '0 24px 50px rgba(14, 40, 72, 0.12)',
    position: 'relative',
    zIndex: 1
  },
  kicker: {
    margin: 0,
    fontSize: '0.75rem',
    letterSpacing: '0.16em',
    color: '#0369a1',
    fontWeight: 700,
    textAlign: 'center'
  },
  title: {
    textAlign: 'center',
    margin: '10px 0 6px 0',
    color: '#0f172a',
    fontSize: '2rem',
    lineHeight: '1.15',
    fontFamily: 'var(--font-heading)'
  },
  subtitle: {
    textAlign: 'center',
    margin: '0 0 24px 0',
    color: '#475569',
    fontWeight: 500,
    fontSize: '1rem'
  },
  error: {
    background: '#fef2f2',
    color: '#991b1b',
    padding: '10px 12px',
    borderRadius: '10px',
    marginBottom: '16px',
    border: '1px solid #fecaca',
    fontSize: '0.9rem'
  },
  fieldGroup: {
    marginBottom: '14px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#334155',
    fontSize: '0.86rem',
    fontWeight: 600
  },
  input: {
    width: '100%',
    padding: '11px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    background: '#ffffff',
    outline: 'none'
  },
  button: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(140deg, #0a84ff 0%, #0057d9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '12px',
    boxShadow: '0 10px 18px rgba(0, 87, 217, 0.25)'
  },
  toggle: {
    textAlign: 'center',
    marginTop: '18px',
    color: '#475569',
    fontSize: '0.9rem'
  },
  link: {
    color: '#0369a1',
    cursor: 'pointer',
    fontWeight: 700
  }
}