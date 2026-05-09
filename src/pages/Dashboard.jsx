import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Euro, Users, Activity, TrendingUp, TrendingDown,
  Building2, Target, AlertTriangle, Calendar, Award
} from 'lucide-react'

const fmt = (n, decimals = 0) =>
  (n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' €'

const fmtN = (n) => (n ?? 0).toLocaleString('fr-FR')

function StatCard({ label, value, icon: Icon, color, subtitle, change }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {subtitle && <div className="stat-change" style={{ color: 'var(--text-muted)' }}>{subtitle}</div>}
      {change !== undefined && (
        <div className={`stat-change ${change >= 0 ? 'up' : 'down'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs mois préc.
        </div>
      )}
    </div>
  )
}

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '10px 14px', boxShadow: 'var(--shadow)'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 2 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}: </span>
          <span style={{ fontWeight: 600 }}>{p.value?.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data, getStats, getMonthlyData, getCabinetStats, setCurrentPage } = useApp()

  const stats = getStats()
  const monthlyData = getMonthlyData()
  const cabinetStats = getCabinetStats()

  const plafondColor = stats.plafondPct > 80 ? 'red' : stats.plafondPct > 60 ? 'orange' : 'green'
  const plafondTextColor = stats.plafondPct > 80 ? 'var(--error)' : stats.plafondPct > 60 ? 'var(--warning)' : 'var(--success)'

  const pieData = [
    { name: 'Revenu net', value: Math.max(stats.revenuNet, 0), color: '#1565C0' },
    { name: 'Charges', value: stats.chargesTotal, color: '#E65100' },
    { name: 'Rétrocessions', value: stats.retrocessions, color: '#00897B' },
  ]

  const recentActs = useMemo(() => {
    if (!data?.acts) return []
    return [...data.acts]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8)
  }, [data?.acts])

  const activeReplacement = data?.replacements?.find(r => r.status === 'active')
  const activeCabinet = activeReplacement ? data?.cabinets?.find(c => c.id === activeReplacement?.cabinetId) : null

  const goalPct = data?.settings?.revenueGoal
    ? Math.min((stats.revenusEncaisses / data.settings.revenueGoal) * 100, 100)
    : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue d'ensemble de votre activité · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="header-actions">
          {activeReplacement && activeCabinet && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--success-bg)', border: '1px solid #c8e6c9',
              borderRadius: 'var(--radius)', padding: '8px 14px'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>Remplacement en cours</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{activeCabinet.name}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stat Grid */}
      <div className="stat-grid">
        <StatCard label="CA Brut" value={fmt(stats.caBrut)} icon={Euro} color="blue" subtitle="Honoraires totaux" />
        <StatCard label="Revenus encaissés" value={fmt(stats.revenusEncaisses)} icon={TrendingUp} color="green" subtitle="Ma part des honoraires" />
        <StatCard label="Patients" value={fmtN(stats.nbPatients)} icon={Users} color="teal" subtitle={`${fmtN(stats.nbActes)} actes réalisés`} />
        <StatCard label="Rétrocessions" value={fmt(stats.retrocessions)} icon={TrendingDown} color="orange" subtitle="Part des titulaires" />
        <StatCard label="Charges estimées" value={fmt(stats.chargesTotal)} icon={Activity} color="red" subtitle="URSSAF + CARCDSF" />
        <StatCard label="Revenu net estimé" value={fmt(stats.revenuNet)} icon={Award} color="purple" subtitle="Après charges" />
        <StatCard label="Moy. / patient" value={fmt(stats.moyenneParPatient)} icon={Target} color="indigo" subtitle="Revenu moyen" />
        <StatCard label="Cabinets" value={fmtN(data?.cabinets?.length || 0)} icon={Building2} color="cyan" subtitle={`${data?.replacements?.length || 0} remplacements`} />
      </div>

      {/* Plafond Micro-BNC */}
      <div className="card mb-24" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Plafond Micro-BNC 2026</span>
                {stats.plafondPct > 80 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--error-bg)', padding: '2px 8px', borderRadius: 20 }}>
                    <AlertTriangle size={12} style={{ color: 'var(--error)' }} />
                    <span style={{ fontSize: 11, color: 'var(--error)', fontWeight: 600 }}>Dépassement proche !</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {fmt(stats.revenusEncaisses)} encaissés sur {fmt(data?.settings?.microBncCeiling)} autorisés
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: plafondTextColor }}>{stats.plafondPct?.toFixed(1)}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Restant : {fmt(stats.plafondRestant)}</div>
            </div>
          </div>
          <div className="progress-bar" style={{ height: 12 }}>
            <div className={`progress-fill ${plafondColor}`} style={{ width: `${stats.plafondPct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>0 €</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Plafond : {fmt(data?.settings?.microBncCeiling)}</span>
          </div>

          {/* Objectif */}
          {data?.settings?.revenueGoal > 0 && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>🎯 Objectif annuel : {fmt(data.settings.revenueGoal)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{goalPct.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill green" style={{ width: `${goalPct}%`, background: 'linear-gradient(90deg, var(--primary), #42A5F5)' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="chart-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Évolution des revenus</div>
              <div className="card-subtitle">CA brut vs revenus encaissés par mois</div>
            </div>
          </div>
          <div className="card-body">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="caBrut" name="CA Brut" stroke="#1565C0" fill="url(#colorCa)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="revenus" name="Revenus" stroke="#2E7D32" fill="url(#colorRev)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">Enregistrez des actes pour voir l'évolution</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Répartition financière</div>
              <div className="card-subtitle">Net · Charges · Rétrocessions</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stats.caBrut > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v?.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`} />
                  </PieChart>
                </ResponsiveContainer>
                <div>
                  {pieData.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {fmt(item.value)} ({stats.caBrut > 0 ? ((item.value / stats.caBrut) * 100).toFixed(0) : 0}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">🥧</div>
                <div className="empty-state-text">Les données s'afficheront ici</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cabinets & Actes récents */}
      <div className="chart-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Performance par cabinet</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('cabinets')}>Voir tout</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {cabinetStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cabinetStats} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => v.length > 14 ? v.substring(0, 14) + '…' : v} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Bar dataKey="revenus" name="Revenus" radius={[4, 4, 0, 0]}>
                    {cabinetStats.map((c, i) => <Cell key={i} fill={c.color || '#1565C0'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">🏥</div>
                <div className="empty-state-text">Ajoutez des cabinets pour voir les stats</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Actes récents</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('actes')}>Voir tout</button>
          </div>
          <div style={{ overflow: 'hidden' }}>
            {recentActs.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Patient</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Acte</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Ma part</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActs.map(act => {
                    const myPart = act.fee * act.retrocessionRate / 100
                    return (
                      <tr key={act.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 500 }}>
                          {act.patientLastName} {act.patientFirstName}
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(act.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{act.actType}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          {myPart.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">Aucun acte enregistré</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
