import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Edit2, Trash2, Search, Check, Clock, AlertCircle, Minus } from 'lucide-react'

const DEFAULT_ACT_TYPES = [
  'Consultation', 'Urgence', 'Détartrage', 'Extraction simple', 'Extraction complexe',
  'Composite antérieur', 'Composite postérieur', 'Inlay-Onlay', 'Couronne céramique',
  'Couronne métal-céramique', 'Bridge 3 éléments', 'Bridge 4 éléments', 'Bridge 5+ éléments',
  'Prothèse amovible complète', 'Prothèse amovible partielle', 'Implant', 'Greffe osseuse',
  'Sinus lift', 'Traitement canalaire (1 canal)', 'Traitement canalaire (2 canaux)',
  'Traitement canalaire (3+ canaux)', 'Retraitement canalaire', 'Parodontologie',
  'Orthodontie adulte', 'Gouttière', 'Blanchiment', 'Radiographie', 'Panoramique',
  'Autre',
]

/* Encode/decode payment as JSON string stored in paymentMethod column */
const encodePayment = (p) => JSON.stringify(p)
const decodePayment = (pm) => {
  if (!pm) return { ss: false, mutuelle: false, cash: null }
  try {
    if (pm.startsWith('{')) return JSON.parse(pm)
  } catch {}
  // backward compat with old string values
  if (pm === 'ss_ok') return { ss: true, mutuelle: false, cash: null }
  if (pm === 'mutuelle_ok') return { ss: false, mutuelle: true, cash: null }
  if (pm === 'cb' || pm === 'card') return { ss: false, mutuelle: false, cash: 'cb' }
  if (pm === 'especes' || pm === 'cash') return { ss: false, mutuelle: false, cash: 'especes' }
  return { ss: false, mutuelle: false, cash: null }
}
const formatPaymentLabel = (pm) => {
  const p = decodePayment(pm)
  const parts = []
  if (p.ss) parts.push('SS ✓')
  if (p.mutuelle) parts.push('Mutuelle ✓')
  if (p.cash === 'cb') parts.push('💳 CB')
  if (p.cash === 'especes') parts.push('💵 Espèces')
  return parts.length ? parts.join(' · ') : '—'
}

function newActRow(ACT_TYPES, settings, retro) {
  const type = ACT_TYPES[0] || 'Consultation'
  return { actType: type, fee: settings?.actPrices?.[type] || '', retrocessionRate: retro }
}

function ActModal({ act, onClose, onSave }) {
  const { data } = useApp()
  const ACT_TYPES = data?.settings?.actTypes || DEFAULT_ACT_TYPES
  const defaultRepl = data?.replacements?.find(r => r.status === 'active') || data?.replacements?.[0]
  const defaultRate = defaultRepl?.retrocessionRate || data?.settings?.defaultRetrocessionRate || 70

  // Shared fields
  const [patientLastName, setPatientLastName] = useState(act?.patientLastName || '')
  const [patientFirstName, setPatientFirstName] = useState(act?.patientFirstName || '')
  const [date, setDate] = useState(act?.date || new Date().toISOString().split('T')[0])
  const [replacementId, setReplacementId] = useState(act?.replacementId || defaultRepl?.id || '')
  const [cabinetId, setCabinetId] = useState(act?.cabinetId || defaultRepl?.cabinetId || '')
  const [paymentStatus, setPaymentStatus] = useState(act?.paymentStatus || 'paid')
  const [notes, setNotes] = useState(act?.notes || '')

  // Payment checkboxes
  const initPay = decodePayment(act?.paymentMethod)
  const [ssOk, setSsOk] = useState(initPay.ss)
  const [mutuelleOk, setMutuelleOk] = useState(initPay.mutuelle)
  const [cashMethod, setCashMethod] = useState(initPay.cash || '')

  // Acts list (multi-act when creating, single when editing)
  const [acts, setActs] = useState(
    act
      ? [{ actType: act.actType, fee: act.fee, retrocessionRate: act.retrocessionRate }]
      : [newActRow(ACT_TYPES, data?.settings, defaultRate)]
  )

  const setActField = (idx, k, v) => setActs(a => a.map((row, i) => i === idx ? { ...row, [k]: v } : row))

  const handleActTypeChange = (idx, type) => {
    const price = data?.settings?.actPrices?.[type]
    setActs(a => a.map((row, i) => i === idx ? { ...row, actType: type, ...(price && !act ? { fee: price } : {}) } : row))
  }

  const addActRow = () => setActs(a => [...a, newActRow(ACT_TYPES, data?.settings, a[a.length - 1]?.retrocessionRate || defaultRate)])
  const removeActRow = (idx) => setActs(a => a.filter((_, i) => i !== idx))

  const handleReplChange = (replId) => {
    setReplacementId(replId)
    const repl = data?.replacements?.find(r => r.id === replId)
    if (repl) {
      setCabinetId(repl.cabinetId)
      if (!act) setActs(a => a.map(row => ({ ...row, retrocessionRate: repl.retrocessionRate })))
    }
  }

  const paymentMethod = encodePayment({ ss: ssOk, mutuelle: mutuelleOk, cash: cashMethod || null })

  const totalFee = acts.reduce((s, r) => s + (parseFloat(r.fee) || 0), 0)
  const totalMoi = acts.reduce((s, r) => s + (parseFloat(r.fee) || 0) * r.retrocessionRate / 100, 0)
  const totalTit = totalFee - totalMoi

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!patientLastName) return
    const hasEmpty = acts.some(r => !r.fee || !r.actType)
    if (hasEmpty) return
    acts.forEach(row => {
      onSave({ patientLastName, patientFirstName, date, replacementId, cabinetId, paymentStatus, paymentMethod, notes, actType: row.actType, fee: parseFloat(row.fee), retrocessionRate: row.retrocessionRate })
    })
    onClose()
  }

  const SectionTitle = ({ children }) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>{children}</div>
  )

  const CheckBox = ({ checked, onChange, label, color }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: checked ? (color === 'blue' ? 'var(--primary-50)' : 'var(--success-bg)') : 'var(--bg-card)', border: `2px solid ${checked ? (color === 'blue' ? 'var(--primary)' : 'var(--success)') : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', transition: 'all 0.15s', userSelect: 'none' }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checked ? (color === 'blue' ? 'var(--primary)' : 'var(--success)') : 'var(--border)'}`, background: checked ? (color === 'blue' ? 'var(--primary)' : 'var(--success)') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
        {checked && <Check size={12} color="white" strokeWidth={3} />}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: checked ? (color === 'blue' ? 'var(--primary)' : 'var(--success)') : 'var(--text-secondary)' }}>{label}</span>
      {checked && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: color === 'blue' ? 'var(--primary)' : 'var(--success)', background: color === 'blue' ? 'var(--primary-100)' : '#c8e6c9', padding: '2px 8px', borderRadius: 10 }}>VALIDÉ</span>}
    </label>
  )

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2 className="modal-title">{act ? 'Modifier l\'acte' : '⚡ Enregistrer des actes'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>

            {/* Patient */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 14 }}>
              <SectionTitle>Patient</SectionTitle>
              <div className="form-row" style={{ marginBottom: 8 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nom <span>*</span></label>
                  <input className="form-control" placeholder="DUPONT" value={patientLastName} onChange={e => setPatientLastName(e.target.value.toUpperCase())} required autoFocus />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prénom</label>
                  <input className="form-control" placeholder="Marie" value={patientFirstName} onChange={e => setPatientFirstName(e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date <span>*</span></label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
            </div>

            {/* Actes */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <SectionTitle>Acte{acts.length > 1 ? 's' : ''}</SectionTitle>
                {!act && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addActRow} style={{ gap: 5 }}>
                    <Plus size={13} /> Ajouter un acte
                  </button>
                )}
              </div>

              {acts.map((row, idx) => {
                const myPart = (parseFloat(row.fee) || 0) * row.retrocessionRate / 100
                const titPart = (parseFloat(row.fee) || 0) - myPart
                return (
                  <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: idx < acts.length - 1 ? 10 : 0 }}>
                    {acts.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>Acte {idx + 1}</span>
                        <button type="button" onClick={() => removeActRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          <Minus size={13} /> Retirer
                        </button>
                      </div>
                    )}
                    <div className="form-row" style={{ marginBottom: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Type d'acte <span>*</span></label>
                        <select className="form-control" value={row.actType} onChange={e => handleActTypeChange(idx, e.target.value)}>
                          {ACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Honoraires <span>*</span></label>
                        <div style={{ position: 'relative' }}>
                          <input type="number" className="form-control" min={0} step={0.01} placeholder="0.00" value={row.fee}
                            onChange={e => setActField(idx, 'fee', e.target.value)} required style={{ paddingRight: 32 }} />
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>€</span>
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Rétrocession</label>
                        <div style={{ position: 'relative' }}>
                          <input type="number" className="form-control" min={0} max={100} step={1} value={row.retrocessionRate}
                            onChange={e => setActField(idx, 'retrocessionRate', parseFloat(e.target.value))} style={{ paddingRight: 32 }} />
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
                        </div>
                      </div>
                    </div>
                    {parseFloat(row.fee) > 0 && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, background: 'var(--success-bg)', borderRadius: 6, padding: '7px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase' }}>Ma part</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--success)' }}>{myPart.toFixed(2)} €</div>
                        </div>
                        <div style={{ flex: 1, background: 'var(--warning-bg)', borderRadius: 6, padding: '7px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase' }}>Titulaire</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--warning)' }}>{titPart.toFixed(2)} €</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {acts.length > 1 && totalFee > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, padding: '10px 14px', background: 'var(--primary-50)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>Total honoraires</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{totalFee.toFixed(2)} €</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase' }}>Total ma part</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>{totalMoi.toFixed(2)} €</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase' }}>Total titulaire</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--warning)' }}>{totalTit.toFixed(2)} €</div>
                  </div>
                </div>
              )}
            </div>

            {/* Paiement */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 14 }}>
              <SectionTitle>Paiement</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <CheckBox checked={ssOk} onChange={setSsOk} label="SS : OK envoyé" color="blue" />
                <CheckBox checked={mutuelleOk} onChange={setMutuelleOk} label="Mutuelle : OK" color="green" />
              </div>
              {(!ssOk || !mutuelleOk) && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {['cb', 'especes'].map(m => (
                    <label key={m} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '9px 12px', background: cashMethod === m ? 'var(--primary-50)' : 'var(--bg-card)', border: `2px solid ${cashMethod === m ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', transition: 'all 0.15s', userSelect: 'none' }}>
                      <input type="radio" name="cash" value={m} checked={cashMethod === m} onChange={() => setCashMethod(cashMethod === m ? '' : m)} style={{ display: 'none' }} />
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${cashMethod === m ? 'var(--primary)' : 'var(--border)'}`, background: cashMethod === m ? 'var(--primary)' : 'transparent', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: cashMethod === m ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        {m === 'cb' ? '💳 CB' : '💵 Espèces'}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Statut global</label>
                <select className="form-control" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                  <option value="paid">✅ Payé</option>
                  <option value="pending">⏳ En attente</option>
                  <option value="partial">⚠ Partiel</option>
                </select>
              </div>
            </div>

            {/* Cabinet / Remplacement */}
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Remplacement</label>
                <select className="form-control" value={replacementId} onChange={e => handleReplChange(e.target.value)}>
                  <option value="">Aucun</option>
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
                <select className="form-control" value={cabinetId} onChange={e => setCabinetId(e.target.value)}>
                  <option value="">Sélectionner</option>
                  {data?.cabinets?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-control" placeholder="Informations complémentaires..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">
              <Check size={15} />
              {act ? 'Modifier' : acts.length > 1 ? `Enregistrer ${acts.length} actes` : 'Enregistrer l\'acte'}
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
  }

  const handleModalClose = () => { setShowModal(false); setEditing(null) }

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
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatPaymentLabel(act.paymentMethod)}</td>
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
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
