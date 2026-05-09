import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Edit2, Trash2, Search, Filter, Euro, Check, Clock, AlertCircle } from 'lucide-react'

const ACT_TYPES = [
  'Consultation', 'Urgence', 'Détartrage', 'Extraction simple', 'Extraction complexe',
  'Composite antérieur', 'Composite postérieur', 'Inlay-Onlay', 'Couronne céramique',
  'Couronne métal-céramique', 'Bridge 3 éléments', 'Bridge 4 éléments', 'Bridge 5+ éléments',
  'Prothèse amovible complète', 'Prothèse amovible partielle', 'Implant', 'Greffe osseuse',
  'Sinus lift', 'Traitement canalaire (1 canal)', 'Traitement canalaire (2 canaux)',
  'Traitement canalaire (3+ canaux)', 'Retraitement canalaire', 'Parodontologie',
  'Orthodontie adulte', 'Gouttière', 'Blanchiment', 'Radiographie', 'Panoramique',
  'Autre',
]

const PAYMENT_METHODS = [
  { value: 'mutuelle_ok', label: '🏥 Mutuelle : OK' },
  { value: 'ss_ok', label: '🏛 SS : OK envoyé' },
  { value: 'cb', label: '💳 CB' },
  { value: 'especes', label: '💵 Espèces' },
]

function ActModal({ act, onClose, onSave }) {
  const { data } = useApp()
  const defaultRepl = data?.replacements?.find(r => r.status === 'active') || data?.replacements?.[0]
  const defaultRate = defaultRepl?.retrocessionRate || data?.settings?.defaultRetrocessionRate || 70

  const [form, setForm] = useState(act || {
    replacementId: defaultRepl?.id || '',
    cabinetId: defaultRepl?.cabinetId || '',
    patientLastName: '',
    patientFirstName: '',
    date: new Date().toISOString().split('T')[0],
    actType: 'Consultation',
    fee: '',
    paymentMethod: 'mutuelle_ok',
    paymentStatus: 'paid',
    retrocessionRate: defaultRate,
    notes: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleReplChange = (replId) => {
    const repl = data?.replacements?.find(r => r.id === replId)
    set('replacementId', replId)
    if (repl) {
      set('cabinetId', repl.cabinetId)
      if (!act) set('retrocessionRate', repl.retrocessionRate)
    }
  }

  const handleActTypeChange = (type) => {
    set('actType', type)
    if (!act) {
      const price = data?.settings?.actPrices?.[type]
      if (price) set('fee', price)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.patientLastName || !form.fee || !form.actType) return
    onSave({ ...form, fee: parseFloat(form.fee) })
    onClose()
  }

  const myPart = form.fee ? (parseFloat(form.fee) * form.retrocessionRate / 100) : 0
  const titulairePart = form.fee ? (parseFloat(form.fee) * (100 - form.retrocessionRate) / 100) : 0

  const activeCabinet = form.cabinetId ? data?.cabinets?.find(c => c.id === form.cabinetId) : null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">{act ? 'Modifier l\'acte' : '⚡ Enregistrer un acte'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Patient */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Patient</div>
              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nom <span>*</span></label>
                  <input className="form-control" placeholder="Dupont" value={form.patientLastName} onChange={e => set('patientLastName', e.target.value.toUpperCase())} required autoFocus />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prénom</label>
                  <input className="form-control" placeholder="Marie" value={form.patientFirstName} onChange={e => set('patientFirstName', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Acte */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Acte</div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date <span>*</span></label>
                  <input type="date" className="form-control" value={form.date} onChange={e => set('date', e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Type d'acte <span>*</span></label>
                  <select className="form-control" value={form.actType} onChange={e => handleActTypeChange(e.target.value)}>
                    {ACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Finance */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Honoraires</div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Montant total <span>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" className="form-control" min={0} step={0.01}
                      placeholder="0.00" value={form.fee}
                      onChange={e => set('fee', e.target.value)}
                      required style={{ paddingRight: 32 }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>€</span>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Rétrocession</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" className="form-control" min={0} max={100} step={1}
                      value={form.retrocessionRate}
                      onChange={e => set('retrocessionRate', parseFloat(e.target.value))}
                      style={{ paddingRight: 32 }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>
              </div>

              {form.fee > 0 && (
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <div style={{ flex: 1, background: 'var(--success-bg)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Votre part</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>{myPart.toFixed(2)} €</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--warning-bg)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Part titulaire</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--warning)' }}>{titulairePart.toFixed(2)} €</div>
                  </div>
                </div>
              )}
            </div>

            {/* Paiement */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Paiement</div>
              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Moyen de paiement</label>
                  <select className="form-control" value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Statut</label>
                  <select className="form-control" value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
                    <option value="paid">✅ Payé</option>
                    <option value="pending">⏳ En attente</option>
                    <option value="partial">⚠ Partiel</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cabinet / Remplacement */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Remplacement</label>
                <select className="form-control" value={form.replacementId} onChange={e => handleReplChange(e.target.value)}>
                  <option value="">Aucun (hors remplacement)</option>
                  {data?.replacements?.map(r => {
                    const cab = data?.cabinets?.find(c => c.id === r.cabinetId)
                    return (
                      <option key={r.id} value={r.id}>
                        {cab?.name} — {new Date(r.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        {r.endDate ? ` au ${new Date(r.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cabinet</label>
                <select className="form-control" value={form.cabinetId} onChange={e => set('cabinetId', e.target.value)}>
                  <option value="">Sélectionner</option>
                  {data?.cabinets?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Notes</label>
              <input className="form-control" placeholder="Informations complémentaires..." value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">
              <Check size={15} />
              {act ? 'Modifier' : 'Enregistrer l\'acte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const PAYMENT_STATUS_CONFIG = {
  paid: { label: 'Payé', class: 'badge-success', icon: <Check size={10} /> },
  pending: { label: 'En attente', class: 'badge-warning', icon: <Clock size={10} /> },
  partial: { label: 'Partiel', class: 'badge-error', icon: <AlertCircle size={10} /> },
}

export default function Actes() {
  const { data, addAct, updateAct, deleteAct } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCabinet, setFilterCabinet] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')

  const getCabinet = (id) => data?.cabinets?.find(c => c.id === id)

  const filtered = useMemo(() => {
    if (!data?.acts) return []
    const now = new Date()
    return data.acts
      .filter(a => {
        if (filterCabinet !== 'all' && a.cabinetId !== filterCabinet) return false
        if (filterStatus !== 'all' && a.paymentStatus !== filterStatus) return false
        if (filterPeriod !== 'all') {
          const d = new Date(a.date)
          const y = d.getFullYear(), m = d.getMonth()
          if (filterPeriod === 'thisMonth' && (y !== now.getFullYear() || m !== now.getMonth())) return false
          if (filterPeriod === 'thisYear' && y !== now.getFullYear()) return false
        }
        if (search) {
          const s = search.toLowerCase()
          return (
            a.patientLastName?.toLowerCase().includes(s) ||
            a.patientFirstName?.toLowerCase().includes(s) ||
            a.actType?.toLowerCase().includes(s) ||
            getCabinet(a.cabinetId)?.name?.toLowerCase().includes(s)
          )
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date)
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date)
        if (sortBy === 'fee-desc') return b.fee - a.fee
        if (sortBy === 'patient') return a.patientLastName.localeCompare(b.patientLastName)
        return 0
      })
  }, [data?.acts, search, filterCabinet, filterStatus, filterPeriod, sortBy])

  const totals = useMemo(() => {
    const paid = filtered.filter(a => a.paymentStatus === 'paid')
    return {
      caBrut: filtered.reduce((s, a) => s + a.fee, 0),
      revenus: paid.reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0),
      nbPaid: paid.length,
    }
  }, [filtered])

  const handleSave = (form) => {
    if (editing) updateAct(editing.id, form)
    else addAct(form)
    setEditing(null)
  }

  const handleEdit = (a) => { setEditing(a); setShowModal(true) }
  const handleDelete = (id) => { if (window.confirm('Supprimer cet acte ?')) deleteAct(id) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Actes & Patients</h1>
          <p className="page-subtitle">{data?.acts?.length || 0} acte(s) enregistré(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true) }}>
          <Plus size={16} /> Nouvel acte
        </button>
      </div>

      {/* Summary band */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'CA brut filtré', value: totals.caBrut.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €', color: 'var(--primary)' },
          { label: 'Revenus filtrés', value: totals.revenus.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €', color: 'var(--success)' },
          { label: 'Actes payés', value: `${totals.nbPaid} / ${filtered.length}`, color: 'var(--text)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar" style={{ flex: 1, maxWidth: 280 }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Nom, prénom, acte..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 160 }} value={filterCabinet} onChange={e => setFilterCabinet(e.target.value)}>
          <option value="all">Tous cabinets</option>
          {data?.cabinets?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-control" style={{ width: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Tous statuts</option>
          <option value="paid">Payé</option>
          <option value="pending">En attente</option>
          <option value="partial">Partiel</option>
        </select>
        <select className="form-control" style={{ width: 140 }} value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
          <option value="all">Toute période</option>
          <option value="thisMonth">Ce mois</option>
          <option value="thisYear">Cette année</option>
        </select>
        <select className="form-control" style={{ width: 160 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date-desc">Date ↓</option>
          <option value="date-asc">Date ↑</option>
          <option value="fee-desc">Montant ↓</option>
          <option value="patient">Patient A→Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🦷</div>
            <div className="empty-state-title">Aucun acte trouvé</div>
            <div className="empty-state-text">
              {data?.acts?.length === 0
                ? 'Enregistrez votre premier acte pour commencer.'
                : 'Aucun acte ne correspond aux filtres sélectionnés.'}
            </div>
            {data?.acts?.length === 0 && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                <Plus size={16} /> Enregistrer un acte
              </button>
            )}
          </div>
        </div>
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
                <th>Paiement</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(act => {
                const cab = getCabinet(act.cabinetId)
                const myPart = act.fee * act.retrocessionRate / 100
                const status = PAYMENT_STATUS_CONFIG[act.paymentStatus] || PAYMENT_STATUS_CONFIG.paid
                const pm = PAYMENT_METHODS.find(m => m.value === act.paymentMethod)
                return (
                  <tr key={act.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                      {new Date(act.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {act.patientLastName}{act.patientFirstName ? ` ${act.patientFirstName[0]}.` : ''}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{act.actType}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {cab ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cab.color || 'var(--primary)', flexShrink: 0 }} />
                          {cab.name.replace('Cabinet ', '').substring(0, 18)}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{act.fee.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{act.retrocessionRate}%</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{myPart.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{pm?.label.split(' ')[0]} {pm?.label.split(' ').slice(1).join(' ')}</td>
                    <td><span className={`badge ${status.class}`}>{status.icon} {status.label}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleEdit(act)} title="Modifier"><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(act.id)} title="Supprimer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ActModal
          act={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
