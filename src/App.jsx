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

const PAGES = {
  dashboard:    <Dashboard />,
  actes:        <Actes />,
  remplacements:<Remplacements />,
  cabinets:     <Cabinets />,
  finances:     <Finances />,
  historique:   <Historique />,
  parametres:   <Parametres />,
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4F8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🦷</div>
        <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#1565C0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14, color: '#718096' }}>Chargement de DentaGest…</div>
      </div>
    </div>
  )
}

function AppContent() {
  const { isAuthenticated, loading, currentPage } = useApp()

  if (loading) return <Spinner />
  if (!isAuthenticated) return <Auth />

  return (
    <Layout>
      {PAGES[currentPage] ?? <Dashboard />}
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
