import { AuthProvider, useAuth } from './context/AuthContext'
import { I18nProvider } from './context/I18nContext'
import { ToastProvider } from './context/ToastContext'
import Home from './pages/Home'
import Login from './pages/Login'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.2rem'
    }}>
      ⏳ Loading...
    </div>
  )

  return user ? <Home /> : <Login />
}

function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  )
}

export default App