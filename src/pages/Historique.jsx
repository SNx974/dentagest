import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Search, Download, Filter, Calendar, Euro, Users } from 'lucide-react'

export default function Historique() {
  const { data } = useApp()
  const [search, setSearch] = useState('')
  const [filterCabinet, setFilterCabinet] = useState('all')
  const [filterYear, setFilterYear] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [tab, setTab] = useState('acts')

  const getCabinet = (id) => data?.cabinets?.find(c => c.id === id)

  const years = useMemo(() => {
    const ys = new Set((data?.acts || []).map(a => new Date(a.date).getFullYear()))
    return [...ys].sort((a, b) => b - a)
  }, [data?.acts])

  const filteredActs = useMemo(() => {
    return (data?.acts || [])
      .filter(a => {
        const d = new Date(a.date)
        if (filterCabinet !== 'all' && a.cabinetId !== filterCabinet) return false
        if (filterYear !== 'all' && d.getFullYear() !== parseInt(filterYear)) return false
        if (filterMonth !== 'all' && d.getMonth() !== parseInt(filterMonth)) return false
        if (search) {
          const s = search.toLowerCase()
          return (
            a.patientLastName?.toLowerCase().includes(s) ||
            a.patientFirstName?.toLowerCase().includes(s) ||
            a.actType?.toLowerCase().includes(s)
          )
        }
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [data?.acts, filterCabinet, filterYear, filterMonth, search])

  const filteredRepls = useMemo(() => {
    return (data?.replacements || [])
      .filter(r => {
        if (filterCabinet !== 'all' && r.cabinetId !== filterCabinet) return false
        if (filterYear !== 'all' && new Date(r.startDate).getFullYear() !== parseInt(filterYear)) return false
        if (search) {
          const cab = getCabinet(r.cabinetId)
          const s = search.toLowerCase()
          return cab?.name?.toLowerCase().includes(s) || cab?.titulaireLastName?.toLowerCase().includes(s) || r.notes?.toLowerCase().includes(s)
        }
        return true
      })
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  }, [data?.replacements, filterCabinet, filterYear, search])

  const totals = useMemo(() => {
    const paid = filteredActs.filter(a => a.paymentStatus === 'paid')
    return {
      ca: filteredActs.reduce((s, a) => s + a.fee, 0),
      revenus: paid.reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0),
      retrocessions: paid.reduce((s, a) => s + a.fee * (100 - a.retrocessionRate) / 100, 0),
      nbPaid: paid.length,
      nbTotal: filteredActs.length,
      nbPatients: new Set(paid.map(a => `${a.patientLastName}-${a.patientFirstName}`)).size,
    }
  }, [filteredActs])

  const exportCSV = () => {
    const headers = ['Date', 'Patient', 'Type d\'acte', 'Cabinet', 'Honoraires', 'Rétrocession %', 'Ma part', 'Paiement', 'Statut']
    const rows = filteredActs.map(a => {
      const cab = getCabinet(a.cabinetId)
      const myPart = a.fee * a.retrocessionRate / 100
      return [
        new Date(a.date).toLocaleDateString('fr-FR'),
        `${a.patientLastName} ${a.patientFirstName}`,
        a.actType,
        cab?.name || '',
        a.fee.toFixed(2),
        a.retrocessionRate,
        myPart.toFixed(2),
        a.paymentMethod,
        a.paymentStatus,
      ]
    })
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `historique_actes_${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Historique</h1>
          <p className="page-subtitle">Toutes vos données enregistrées</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>
          <Download size={15} /> Exporter CSV
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'CA brut', value: totals.ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €', color: 'var(--primary)' },
          { label: 'Revenus', value: totals.revenus.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €', color: 'var(--success)' },
          { label: 'Rétrocessions', value: totals.retrocessions.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €', color: 'var(--warning)' },
          { label: 'Patients', value: totals.nbPatients, color: 'var(--text)' },
          { label: 'Actes payés', value: `${totals.nbPaid}/${totals.nbTotal}`, color: 'var(--text)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 4, width: 'fit-content' }}>
        {[{ id: 'acts', label: `Actes (${filteredActs.length})` }, { id: 'repls', label: `Remplacements (${filteredRepls.length})` }].map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar" style={{ flex: 1, maxWidth: 280 }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 180 }} value={filterCabinet} onChange={e => setFilterCabinet(e.target.value)}>
          <option value="all">Tous cabinets</option>
          {data?.cabinets?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-control" style={{ width: 120 }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="all">Toutes années</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {tab === 'acts' && (
          <select className="form-control" style={{ width: 140 }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="all">Tous mois</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        )}
      </div>

      {tab === 'acts' ? (
        filteredActs.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">Aucun acte trouvé</div></div></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Acte</th>
                  <th>Cabinet</th>
                  <th>Honoraires</th>
                  <th>Rétro.</th>
                  <th>Ma part</th>
                  <th>Mode</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredActs.map(act => {
                  const cab = getCabinet(act.cabinetId)
                  const myPart = act.fee * act.retrocessionRate / 100
                  const statusColors = { paid: 'badge-success', pending: 'badge-warning', partial: 'badge-error' }
                  const statusLabels = { paid: 'Payé', pending: 'En attente', partial: 'Partiel' }
                  const pmLabels = { card: '💳', cash: '💵', check: '📄', virement: '🏦' }
                  return (
                    <tr key={act.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {new Date(act.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 600 }}>{act.patientLastName} {act.patientFirstName}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{act.actType}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{cab?.name?.replace('Cabinet ', '') || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{act.fee.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{act.retrocessionRate}%</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>{myPart.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</td>
                      <td style={{ fontSize: 16 }}>{pmLabels[act.paymentMethod] || act.paymentMethod}</td>
                      <td><span className={`badge ${statusColors[act.paymentStatus] || 'badge-neutral'}`}>{statusLabels[act.paymentStatus] || act.paymentStatus}</span></td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--primary-50)', borderTop: '2px solid var(--primary)' }}>
                  <td colSpan={4} style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--primary)' }}>TOTAL ({filteredActs.length} actes)</td>
                  <td style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--primary)' }}>{totals.ca.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</td>
                  <td></td>
                  <td style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--success)' }}>{totals.revenus.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      ) : (
        filteredRepls.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-title">Aucun remplacement trouvé</div></div></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Période</th>
                  <th>Cabinet</th>
                  <th>Titulaire</th>
                  <th>Durée</th>
                  <th>Rétro.</th>
                  <th>Actes</th>
                  <th>Revenus</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepls.map(r => {
                  const cab = getCabinet(r.cabinetId)
                  const acts = (data?.acts || []).filter(a => a.replacementId === r.id && a.paymentStatus === 'paid')
                  const revenus = acts.reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0)
                  const days = r.endDate ? Math.round((new Date(r.endDate) - new Date(r.startDate)) / (1000 * 60 * 60 * 24)) + 1 : '?'
                  const statusLabels = { active: { l: 'En cours', c: 'badge-success' }, planned: { l: 'Planifié', c: 'badge-info' }, completed: { l: 'Terminé', c: 'badge-neutral' }, cancelled: { l: 'Annulé', c: 'badge-error' } }
                  const s = statusLabels[r.status] || statusLabels.completed
                  return (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {new Date(r.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                        {r.endDate ? ` → ${new Date(r.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}` : ''}
                      </td>
                      <td style={{ fontWeight: 600 }}>{cab?.name || '—'}</td>
                      <td>Dr {cab?.titulaireFirstName} {cab?.titulaireLastName}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{days}j</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>{r.retrocessionRate}%</td>
                      <td>{acts.length}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{revenus.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</td>
                      <td><span className={`badge ${s.c}`}>{s.l}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
