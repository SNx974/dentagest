import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  LayoutDashboard, Calendar, Users, Building2, TrendingUp,
  History, Settings, LogOut, ChevronLeft, ChevronRight,
  Menu, Bell, Moon, Sun, Search, Plus, Stethoscope
} from 'lucide-react'

const NAV_ITEMS = [
  { section: 'Principal', items: [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'actes', label: 'Actes & Patients', icon: Users },
    { id: 'remplacements', label: 'Remplacements', icon: Calendar },
  ]},
  { section: 'Gestion', items: [
    { id: 'cabinets', label: 'Cabinets', icon: Building2 },
    { id: 'finances', label: 'Finances', icon: TrendingUp },
    { id: 'historique', label: 'Historique', icon: History },
  ]},
  { section: 'Compte', items: [
    { id: 'parametres', label: 'Paramètres', icon: Settings },
  ]},
]

function Sidebar({ mobileOpen, onClose }) {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, data, logout, updateSettings } = useApp()
  const theme = data?.settings?.theme || 'light'

  const initials = data?.user
    ? `${data.user.firstName[0]}${data.user.lastName[0]}`
    : 'DR'

  const activeReplacements = data?.replacements?.filter(r => r.status === 'active').length || 0

  return (
    <aside className={`sidebar${!sidebarOpen ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">🦷</div>
        {sidebarOpen && (
          <div className="logo-text">
            <div className="logo-title">DentaGest</div>
            <div className="logo-sub">Micro-BNC</div>
          </div>
        )}
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Réduire' : 'Agrandir'}
          style={sidebarOpen ? {} : { marginLeft: 'auto', marginRight: 'auto' }}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(section => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map(item => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className={`nav-item${currentPage === item.id ? ' active' : ''}`}
                  onClick={() => { setCurrentPage(item.id); onClose && onClose() }}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <Icon className="nav-icon" size={20} />
                  <span className="nav-label">{item.label}</span>
                  {item.id === 'remplacements' && activeReplacements > 0 && (
                    <span className="nav-badge">{activeReplacements}</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div
          className="nav-item"
          style={{ marginBottom: 6 }}
          onClick={() => updateSettings({ theme: theme === 'light' ? 'dark' : 'light' })}
          title={!sidebarOpen ? (theme === 'light' ? 'Mode sombre' : 'Mode clair') : ''}
        >
          {theme === 'light' ? <Moon size={20} className="nav-icon" /> : <Sun size={20} className="nav-icon" />}
          <span className="nav-label">{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>
        </div>
        <div className="user-card" onClick={() => setCurrentPage('parametres')}>
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{data?.user ? `Dr ${data.user.lastName}` : 'Docteur'}</div>
            <div className="user-role">Remplaçant · Micro-BNC</div>
          </div>
        </div>
        <div
          className="nav-item"
          style={{ color: 'var(--error)', marginTop: 4 }}
          onClick={logout}
          title={!sidebarOpen ? 'Déconnexion' : ''}
        >
          <LogOut size={20} className="nav-icon" style={{ color: 'var(--error)' }} />
          <span className="nav-label">Déconnexion</span>
        </div>
      </div>
    </aside>
  )
}

export default function Layout({ children }) {
  const { sidebarOpen, data, setCurrentPage } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = data?.settings?.theme || 'light'

  return (
    <div className={`app-layout${theme === 'dark' ? ' dark' : ''}`}>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className={`main-content${!sidebarOpen ? ' sidebar-collapsed' : ''}`}>
        <TopBar onMenuClick={() => setMobileOpen(o => !o)} />
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  )
}

function TopBar({ onMenuClick }) {
  const { data, setCurrentPage } = useApp()
  const [search, setSearch] = useState('')

  const stats = data ? (() => {
    const paid = data.acts.filter(a => a.paymentStatus === 'paid')
    const rev = paid.reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0)
    const ceil = data.settings.microBncCeiling
    return { pct: Math.min((rev / ceil) * 100, 100), rev, ceil }
  })() : null

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      padding: '0 28px',
      height: 'var(--header-height)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
      gap: 16,
    }}>
      <button className="hamburger-btn" onClick={onMenuClick} aria-label="Menu">
        <Menu size={22} />
      </button>
      <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
        <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          placeholder="Rechercher un patient, acte, cabinet..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {stats && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => setCurrentPage('finances')}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Plafond Micro-BNC
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: stats.pct > 80 ? 'var(--error)' : stats.pct > 60 ? 'var(--warning)' : 'var(--success)' }}>
              {stats.rev.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € / {stats.ceil.toLocaleString('fr-FR')} €
            </div>
          </div>
          <div style={{ width: 80 }}>
            <div className="progress-bar">
              <div
                className={`progress-fill ${stats.pct > 80 ? 'red' : stats.pct > 60 ? 'orange' : 'green'}`}
                style={{ width: `${stats.pct}%` }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, textAlign: 'center' }}>
              {stats.pct.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setCurrentPage('actes')}
          style={{ gap: 6 }}
        >
          <Plus size={15} />
          Acte rapide
        </button>
      </div>
    </div>
  )
}
