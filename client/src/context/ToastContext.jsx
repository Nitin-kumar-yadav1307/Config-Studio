/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const ToastContext = createContext()

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const pushToast = (message, type = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 3200)
  }

  const value = { pushToast }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={styles.container}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              ...styles.toast,
              ...(toast.type === 'success' ? styles.success : {}),
              ...(toast.type === 'error' ? styles.error : {})
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

const styles = {
  container: {
    position: 'fixed',
    right: 16,
    bottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 1000
  },
  toast: {
    background: '#1f2937',
    color: '#ffffff',
    padding: '10px 14px',
    borderRadius: 10,
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
    fontSize: '0.9rem',
    maxWidth: 320
  },
  success: {
    background: '#14532d'
  },
  error: {
    background: '#7f1d1d'
  }
}
