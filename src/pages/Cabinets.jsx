import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Edit2, Trash2, Building2, Phone, Mail, MapPin, Percent } from 'lucide-react'

const COLORS = ['#1565C0', '#00695C', '#6A1B9A', '#C62828', '#E65100', '#1B5E20', '#0D47A1', '#37474F']

function CabinetModal({ cabinet, onClose, onSave }) {
  const [form, setForm] = useState(cabinet || {
    name: '',
    titulaireFirstName: '',
    titulaireLastName: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    defaultRetrocessionRate: 70,
    color: COLORS[0],
    notes: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.titulaireLastName) return
    onSave(form)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">{cabinet ? 'Modifier le cabinet' : 'Nouveau cabinet'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Titulaire</div>
              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prénom</label>
                  <input className="form-control" placeholder="Jean" value={form.titulaireFirstName} onChange={e => set('titulaireFirstName', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nom <span>*</span></label>
                  <input className="form-control" placeholder="Martin" value={form.titulaireLastName} onChange={e => set('titulaireLastName', e.target.value)} required />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Cabinet</div>
              <div className="form-group">
                <label className="form-label">Nom du cabinet <span>*</span></label>
                <input className="form-control" placeholder="Cabinet Dr Martin" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Adresse</label>
                  <input className="form-control" placeholder="12 rue de la Paix" value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ville</label>
                  <input className="form-control" placeholder="Paris 75001" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
              </div>
              <div className="form-row" style={{ marginTop: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Téléphone</label>
                  <input className="form-control" placeholder="01 42 33 55 66" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" placeholder="cabinet@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Rétrocession par défaut <span>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" className="form-control" min={0} max={100} step={1}
                    value={form.defaultRetrocessionRate}
                    onChange={e => set('defaultRetrocessionRate', parseFloat(e.target.value))}
                    style={{ paddingRight: 32 }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {[50, 60, 65, 70, 75, 80].map(p => (
                    <button key={p} type="button"
                      className={`btn btn-sm ${form.defaultRetrocessionRate === p ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => set('defaultRetrocessionRate', p)}
                    >{p}%</button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Couleur d'identification</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {COLORS.map(c => (
                    <button key={c} type="button"
                      onClick={() => set('color', c)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', background: c,
                        border: form.color === c ? '3px solid var(--text)' : '3px solid transparent',
                        cursor: 'pointer', transition: 'transform 0.15s',
                        transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Notes</label>
              <textarea className="form-control" placeholder="Informations sur le cabinet, accès, codes..." value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">
              <Plus size={15} /> {cabinet ? 'Modifier' : 'Ajouter le cabinet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Cabinets() {
  const { data, addCabinet, updateCabinet, deleteCabinet } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const handleSave = (form) => {
    if (editing) updateCabinet(editing.id, form)
    else addCabinet(form)
    setEditing(null)
  }
  const handleEdit = (c) => { setEditing(c); setShowModal(true) }
  const handleDelete = (id) => {
    const actsCount = data?.acts?.filter(a => a.cabinetId === id).length || 0
    if (actsCount > 0 && !window.confirm(`Ce cabinet a ${actsCount} acte(s) associé(s). Supprimer quand même ?`)) return
    deleteCabinet(id)
  }

  const getCabinetStats = (cabId) => {
    const acts = (data?.acts || []).filter(a => a.cabinetId === cabId && a.paymentStatus === 'paid')
    const repls = (data?.replacements || []).filter(r => r.cabinetId === cabId)
    const revenus = acts.reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0)
    const patients = new Set(acts.map(a => `${a.patientLastName}-${a.patientFirstName}`)).size
    return { revenus, actes: acts.length, patients, remplacements: repls.length }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cabinets</h1>
          <p className="page-subtitle">{data?.cabinets?.length || 0} cabinet(s) enregistré(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true) }}>
          <Plus size={16} /> Nouveau cabinet
        </button>
      </div>

      {(!data?.cabinets || data.cabinets.length === 0) ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏥</div>
            <div className="empty-state-title">Aucun cabinet</div>
            <div className="empty-state-text">Ajoutez les cabinets où vous effectuez des remplacements.</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              <Plus size={16} /> Ajouter un cabinet
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {data.cabinets.map(cab => {
            const stats = getCabinetStats(cab.id)
            return (
              <div key={cab.id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ height: 5, background: `linear-gradient(90deg, ${cab.color}, ${cab.color}88)` }} />
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: `${cab.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0
                      }}>🏥</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{cab.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          Dr {cab.titulaireFirstName} {cab.titulaireLastName}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleEdit(cab)}><Edit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(cab.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    {cab.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        {cab.address}{cab.city ? `, ${cab.city}` : ''}
                      </div>
                    )}
                    {cab.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Phone size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        {cab.phone}
                      </div>
                    )}
                    {cab.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Mail size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        {cab.email}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <Percent size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      Rétrocession par défaut : <strong style={{ color: 'var(--success)' }}>{cab.defaultRetrocessionRate}%</strong>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 12 }}>
                    {[
                      { label: 'Revenus', value: stats.revenus.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €', color: 'var(--primary)' },
                      { label: 'Actes', value: stats.actes, color: 'var(--text)' },
                      { label: 'Patients', value: stats.patients, color: 'var(--text)' },
                      { label: 'Rempl.', value: stats.remplacements, color: 'var(--text)' },
                    ].map((s, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {cab.notes && (
                    <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      📝 {cab.notes}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <CabinetModal
          cabinet={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
