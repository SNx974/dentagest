import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Edit2, Trash2, Calendar, MapPin, Percent, Search, Filter, ChevronDown } from 'lucide-react'

const STATUS_LABELS = {
  planned: { label: 'Planifié', class: 'badge-info' },
  active: { label: 'En cours', class: 'badge-success' },
  completed: { label: 'Terminé', class: 'badge-neutral' },
  cancelled: { label: 'Annulé', class: 'badge-error' },
}

function ReplacementModal({ replacement, onClose, onSave }) {
  const { data } = useApp()
  const [form, setForm] = useState(replacement || {
    cabinetId: data?.cabinets?.[0]?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    retrocessionRate: data?.settings?.defaultRetrocessionRate || 70,
    status: 'planned',
    notes: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCabinetChange = (cabinetId) => {
    const cab = data?.cabinets?.find(c => c.id === cabinetId)
    set('cabinetId', cabinetId)
    if (cab && !replacement) set('retrocessionRate', cab.defaultRetrocessionRate)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.cabinetId || !form.startDate) return
    onSave(form)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{replacement ? 'Modifier le remplacement' : 'Nouveau remplacement'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Cabinet <span>*</span></label>
              <select className="form-control" value={form.cabinetId} onChange={e => handleCabinetChange(e.target.value)} required>
                <option value="">Sélectionner un cabinet</option>
                {data?.cabinets?.map(c => (
                  <option key={c.id} value={c.id}>Dr {c.titulaireLastName} — {c.name}</option>
                ))}
              </select>
              {data?.cabinets?.length === 0 && (
                <p className="form-hint" style={{ color: 'var(--warning)' }}>⚠ Ajoutez d'abord un cabinet dans la section Cabinets.</p>
              )}
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Début <span>*</span></label>
                <input type="date" className="form-control" value={form.startDate} onChange={e => set('startDate', e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fin</label>
                <input type="date" className="form-control" value={form.endDate} onChange={e => set('endDate', e.target.value)} min={form.startDate} />
              </div>
            </div>

            <div style={{ height: 16 }} />

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Rétrocession <span>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" className="form-control" min={0} max={100} step={1}
                    value={form.retrocessionRate}
                    onChange={e => set('retrocessionRate', parseFloat(e.target.value))}
                    style={{ paddingRight: 32 }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>%</span>
                </div>
                <p className="form-hint">Part qui vous revient</p>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Statut</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="planned">Planifié</option>
                  <option value="active">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            </div>

            {/* Quick percentages */}
            <div style={{ marginTop: 8 }}>
              <div className="form-hint" style={{ marginBottom: 6 }}>Raccourcis :</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[50, 60, 65, 70, 75, 80, 90].map(p => (
                  <button
                    key={p} type="button"
                    className={`btn btn-sm ${form.retrocessionRate === p ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => set('retrocessionRate', p)}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Notes</label>
              <textarea className="form-control" placeholder="Conditions spécifiques, informations utiles..." value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
            </div>

            {/* Preview */}
            {form.cabinetId && (
              <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)', borderRadius: 'var(--radius)', padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>Aperçu de la répartition</div>
                <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Votre part : </span>
                    <strong style={{ color: 'var(--success)' }}>{form.retrocessionRate}%</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Part titulaire : </span>
                    <strong style={{ color: 'var(--warning)' }}>{100 - form.retrocessionRate}%</strong>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Ex : pour 100€ d'honoraires → {form.retrocessionRate}€ pour vous, {100 - form.retrocessionRate}€ pour le titulaire
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">
              <Plus size={15} />
              {replacement ? 'Modifier' : 'Créer le remplacement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Remplacements() {
  const { data, addReplacement, updateReplacement, deleteReplacement } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCabinet, setFilterCabinet] = useState('all')

  const getCabinet = (id) => data?.cabinets?.find(c => c.id === id)

  const filtered = useMemo(() => {
    if (!data?.replacements) return []
    return data.replacements
      .filter(r => {
        if (filterStatus !== 'all' && r.status !== filterStatus) return false
        if (filterCabinet !== 'all' && r.cabinetId !== filterCabinet) return false
        if (search) {
          const cab = getCabinet(r.cabinetId)
          const s = search.toLowerCase()
          return (cab?.name?.toLowerCase().includes(s) || cab?.titulaireLastName?.toLowerCase().includes(s) || r.notes?.toLowerCase().includes(s))
        }
        return true
      })
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  }, [data?.replacements, search, filterStatus, filterCabinet])

  const handleSave = (form) => {
    if (editing) updateReplacement(editing.id, form)
    else addReplacement(form)
    setEditing(null)
  }

  const handleEdit = (r) => { setEditing(r); setShowModal(true) }
  const handleDelete = (id) => { if (window.confirm('Supprimer ce remplacement ?')) deleteReplacement(id) }
  const handleNew = () => { setEditing(null); setShowModal(true) }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const countDays = (start, end) => {
    if (!start || !end) return '?'
    const d = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1
    return `${d}j`
  }

  const getActsForReplacement = (id) => data?.acts?.filter(a => a.replacementId === id) || []
  const getRevenueForReplacement = (r) => {
    return getActsForReplacement(r.id)
      .filter(a => a.paymentStatus === 'paid')
      .reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Remplacements</h1>
          <p className="page-subtitle">{data?.replacements?.length || 0} remplacement(s) · {data?.replacements?.filter(r => r.status === 'active').length || 0} en cours</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={16} /> Nouveau remplacement
        </button>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="search-bar" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Tous les statuts</option>
          <option value="active">En cours</option>
          <option value="planned">Planifié</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">Annulé</option>
        </select>
        <select className="form-control" style={{ width: 200 }} value={filterCabinet} onChange={e => setFilterCabinet(e.target.value)}>
          <option value="all">Tous les cabinets</option>
          {data?.cabinets?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">Aucun remplacement</div>
            <div className="empty-state-text">Créez votre premier remplacement pour commencer à suivre votre activité.</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleNew}>
              <Plus size={16} /> Créer un remplacement
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(r => {
            const cab = getCabinet(r.cabinetId)
            const acts = getActsForReplacement(r.id)
            const revenue = getRevenueForReplacement(r)
            const status = STATUS_LABELS[r.status] || STATUS_LABELS.completed
            return (
              <div key={r.id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                  height: 4,
                  background: r.status === 'active' ? 'linear-gradient(90deg, #2E7D32, #66BB6A)'
                    : r.status === 'planned' ? 'linear-gradient(90deg, #1565C0, #42A5F5)'
                      : r.status === 'cancelled' ? 'linear-gradient(90deg, #B71C1C, #EF5350)'
                        : 'linear-gradient(90deg, #607D8B, #90A4AE)'
                }} />
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: cab?.color ? `${cab.color}20` : 'var(--primary-50)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: cab?.color || 'var(--primary)', fontWeight: 700, fontSize: 16,
                          flexShrink: 0
                        }}>
                          🏥
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{cab?.name || 'Cabinet inconnu'}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Dr {cab?.titulaireFirstName} {cab?.titulaireLastName}
                            {cab?.city && ` · ${cab.city}`}
                          </div>
                        </div>
                        <span className={`badge ${status.class}`}>{status.label}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{formatDate(r.startDate)}</span>
                          {r.endDate && <><span style={{ color: 'var(--text-muted)' }}>→</span><span style={{ color: 'var(--text-secondary)' }}>{formatDate(r.endDate)}</span></>}
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({countDays(r.startDate, r.endDate)})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <Percent size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>Rétrocession :</span>
                          <span style={{ fontWeight: 700, color: 'var(--success)' }}>{r.retrocessionRate}%</span>
                          <span style={{ color: 'var(--text-muted)' }}>(titulaire {100 - r.retrocessionRate}%)</span>
                        </div>
                      </div>

                      {r.notes && (
                        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          📝 {r.notes}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>
                          {revenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {acts.filter(a => a.paymentStatus === 'paid').length} actes payés
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Total actes : {acts.length}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleEdit(r)} title="Modifier">
                          <Edit2 size={15} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(r.id)} title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(showModal || editing) && (
        <ReplacementModal
          replacement={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
