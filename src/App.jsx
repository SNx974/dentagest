import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Actes from './pages/Actes'
import Remplacements from './pages/Remplacements'
import Cabinets from './pages/Cabinets'
import Finances from './pages/Finances'
import Historique from './pages/Historique'
import Parametres from './pages/Parametres'

function AppContent() {
  const { isAuthenticated, currentPage, data } = useApp()

  if (!isAuthenticated) {
    return <Auth />
  }

  const pages = {
    dashboard: <Dashboard />,
    actes: <Actes />,
    remplacements: <Remplacements />,
    cabinets: <Cabinets />,
    finances: <Finances />,
    historique: <Historique />,
    parametres: <Parametres />,
  }

  return (
    <Layout>
      {pages[currentPage] || <Dashboard />}
    </Layout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
