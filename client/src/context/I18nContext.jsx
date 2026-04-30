/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'

const translations = {
  en: {
    loading: 'Loading...',
    loadingApp: 'Loading app...',
    unknownComponent: 'Unsupported component. Falling back to table view.',
    noFields: 'No fields found in config',
    noData: 'No data yet. Add some entries above!',
    addEntry: 'Add New Entry',
    submit: 'Submit',
    csvImport: 'CSV Import',
    importSuccessful: 'Import successful',
    importFailed: 'Import failed',
    saveSuccess: 'Record created',
    deleteSuccess: 'Record deleted',
    actionFailed: 'Something went wrong'
  }
}

const I18nContext = createContext()

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('en')

  const value = useMemo(() => {
    const t = (key) => translations[locale]?.[key] || translations.en[key] || key
    return { locale, setLocale, t, supportedLocales: ['en'] }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
