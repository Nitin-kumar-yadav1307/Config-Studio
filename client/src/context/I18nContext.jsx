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
  },
  es: {
    loading: 'Cargando...',
    loadingApp: 'Cargando aplicacion...',
    unknownComponent: 'Componente no compatible. Mostrando tabla por defecto.',
    noFields: 'No hay campos en la configuracion',
    noData: 'Todavia no hay datos. Agrega entradas arriba.',
    addEntry: 'Agregar entrada',
    submit: 'Enviar',
    csvImport: 'Importar CSV',
    importSuccessful: 'Importacion exitosa',
    importFailed: 'Fallo la importacion',
    saveSuccess: 'Registro creado',
    deleteSuccess: 'Registro eliminado',
    actionFailed: 'Algo salio mal'
  },
  hi: {
    loading: 'Load ho raha hai...',
    loadingApp: 'App load ho raha hai...',
    unknownComponent: 'Unknown component mila, table fallback dikhaya ja raha hai.',
    noFields: 'Config me fields nahi mile',
    noData: 'Abhi data nahi hai. Upar se entry add karein.',
    addEntry: 'Nayi entry jodo',
    submit: 'Submit',
    csvImport: 'CSV import',
    importSuccessful: 'Import successful',
    importFailed: 'Import fail hua',
    saveSuccess: 'Record ban gaya',
    deleteSuccess: 'Record delete ho gaya',
    actionFailed: 'Kuch galat ho gaya'
  }
}

const I18nContext = createContext()

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('en')

  const value = useMemo(() => {
    const t = (key) => translations[locale]?.[key] || translations.en[key] || key
    return { locale, setLocale, t, supportedLocales: Object.keys(translations) }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
