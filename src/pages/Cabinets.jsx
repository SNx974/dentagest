import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Edit2, Trash2, Building2, Phone, Mail, MapPin, Percent, FileText, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = ['#1565C0', '#00695C', '#6A1B9A', '#C62828', '#E65100', '#1B5E20', '#0D47A1', '#37474F']

/* ─── PDF Generator ─── */
function generatePDF({ cabinet, acts, user, period }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const PRIMARY = [21, 101, 192]
  const LIGHT_BLUE = [227, 242, 253]
  const SUCCESS_BG = [232, 245, 233]
  const WARNING_BG = [255, 243, 224]
  const GREY = [120, 120, 120]

  const pageW = doc.internal.pageSize.getWidth()

  // Header background
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageW, 38, 'F')

  // Logo area
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('🦷 DentaGest', 14, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Récapitulatif des actes — Micro-BNC', 14, 23)

  // Date generated
  doc.setFontSize(8)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 30)

  // Cabinet info box
  doc.setFillColor(...LIGHT_BLUE)
  doc.roundedRect(14, 44, pageW - 28, 30, 3, 3, 'F')
  doc.setTextColor(...PRIMARY)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(cabinet.name, 20, 54)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GREY)
  doc.text(`Titulaire : Dr ${cabinet.titulaireFirstName || ''} ${cabinet.titulaireLastName}`, 20, 61)
  if (cabinet.city) doc.text(`📍 ${cabinet.address ? cabinet.address + ', ' : ''}${cabinet.city}`, 20, 67)

  doc.setTextColor(...PRIMARY)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Période : ${period}`, pageW - 14, 61, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GREY)
  doc.text(`Remplaçant : Dr ${user?.firstName || ''} ${user?.lastName || ''}`, pageW - 14, 67, { align: 'right' })

  // Table
  const rows = acts.map(a => {
    const myPart = a.fee * a.retrocessionRate / 100
    const titPart = a.fee - myPart
    return [
      new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      `${a.patientLastName}${a.patientFirstName ? ' ' + a.patientFirstName : ''}`,
      a.actType,
      a.fee.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €',
      `${a.retrocessionRate}%`,
      myPart.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €',
      titPart.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €',
    ]
  })

  const totalHono = acts.reduce((s, a) => s + a.fee, 0)
  const totalMoi = acts.reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0)
  const totalTit = totalHono - totalMoi

  autoTable(doc, {
    startY: 80,
    head: [['Date', 'Patient', 'Acte', 'Honoraires', 'Rétro.', 'Ma part', 'Part titulaire']],
    body: rows,
    foot: [['', '', 'TOTAUX', `${totalHono.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, '', `${totalMoi.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, `${totalTit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`]],
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    footStyles: { fillColor: [240, 247, 255], textColor: PRIMARY, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 38 },
      2: { cellWidth: 38 },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 24, halign: 'right', textColor: [46, 125, 50], fontStyle: 'bold' },
      6: { cellWidth: 26, halign: 'right', textColor: [230, 81, 0] },
    },
    margin: { left: 14, right: 14 },
  })

  const finalY = doc.lastAutoTable.finalY + 8

  // Summary boxes
  const boxW = (pageW - 28 - 12) / 3
  const boxes = [
    { label: 'Total honoraires', value: `${totalHono.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, bg: LIGHT_BLUE, color: PRIMARY },
    { label: 'À conserver (ma part)', value: `${totalMoi.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, bg: SUCCESS_BG, color: [46, 125, 50] },
    { label: 'À reverser au titulaire', value: `${totalTit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`, bg: WARNING_BG, color: [230, 81, 0] },
  ]
  boxes.forEach((b, i) => {
    const x = 14 + i * (boxW + 6)
    doc.setFillColor(...b.bg)
    doc.roundedRect(x, finalY, boxW, 20, 3, 3, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREY)
    doc.text(b.label, x + boxW / 2, finalY + 7, { align: 'center' })
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...b.color)
    doc.text(b.value, x + boxW / 2, finalY + 15, { align: 'center' })
  })

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 180, 180)
    doc.text(`DentaGest — Document confidentiel — Page ${i}/${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' })
  }

  const filename = `DentaGest_${cabinet.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

/* ─── Recap Modal ─── */
function RecapModal({ cabinet, onClose }) {
  const { data } = useApp()
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [filterReplacement, setFilterReplacement] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const replacements = useMemo(() =>
    (data?.replacements || []).filter(r => r.cabinetId === cabinet.id)
  , [data?.replacements, cabinet.id])

  const acts = useMemo(() => {
    const now = new Date()
    return (data?.acts || [])
      .filter(a => {
        if (a.cabinetId !== cabinet.id) return false
        if (filterReplacement !== 'all' && a.replacementId !== filterReplacement) return false
        if (filterStatus !== 'all' && a.paymentStatus !== filterStatus) return false
        if (filterPeriod !== 'all') {
          const d = new Date(a.date)
          if (filterPeriod === 'thisMonth' && (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth())) return false
          if (filterPeriod === 'thisYear' && d.getFullYear() !== now.getFullYear()) return false
          if (filterPeriod.startsWith('month-')) {
            const [, y, m] = filterPeriod.split('-')
            if (d.getFullYear() !== parseInt(y) || d.getMonth() !== parseInt(m)) return false
          }
        }
        return true
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [data?.acts, cabinet.id, filterPeriod, filterReplacement, filterStatus])

  const totals = useMemo(() => ({
    hono: acts.reduce((s, a) => s + a.fee, 0),
    moi: acts.reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0),
    tit: acts.reduce((s, a) => s + a.fee * (100 - a.retrocessionRate) / 100, 0),
  }), [acts])

  // Available months from acts of this cabinet
  const months = useMemo(() => {
    const set = new Set()
    ;(data?.acts || []).filter(a => a.cabinetId === cabinet.id).forEach(a => {
      const d = new Date(a.date)
      set.add(`${d.getFullYear()}-${d.getMonth()}`)
    })
    return [...set].sort().reverse().map(k => {
      const [y, m] = k.split('-')
      return { key: `month-${y}-${m}`, label: new Date(parseInt(y), parseInt(m), 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }
    })
  }, [data?.acts, cabinet.id])

  const periodLabel = filterPeriod === 'all' ? 'Toute la période'
    : filterPeriod === 'thisMonth' ? 'Ce mois'
    : filterPeriod === 'thisYear' ? 'Cette année'
    : months.find(m => m.key === filterPeriod)?.label || ''

  const PAYMENT_STATUS = { paid: { label: 'Payé', color: 'var(--success)' }, pending: { label: 'En attente', color: 'var(--warning)' }, partial: { label: 'Partiel', color: 'var(--error)' } }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ marginBottom: 2 }}>Récapitulatif — {cabinet.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Dr {cabinet.titulaireFirstName} {cabinet.titulaireLastName}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="form-control" style={{ width: 'auto', flex: 1, minWidth: 140 }} value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
            <option value="all">Toute la période</option>
            <option value="thisMonth">Ce mois</option>
            <option value="thisYear">Cette année</option>
            {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto', flex: 1, minWidth: 140 }} value={filterReplacement} onChange={e => setFilterReplacement(e.target.value)}>
            <option value="all">Tous remplacements</option>
            {replacements.map(r => (
              <option key={r.id} value={r.id}>
                {new Date(r.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                {r.endDate ? ` → ${new Date(r.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}` : ''}
              </option>
            ))}
          </select>
          <select className="form-control" style={{ width: 'auto', flex: 1, minWidth: 120 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tous statuts</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
            <option value="partial">Partiel</option>
          </select>
        </div>

        {/* Summary totals */}
        <div style={{ padding: '12px 20px', display: 'flex', gap: 10, background: 'var(--bg)', flexWrap: 'wrap' }}>
          {[
            { label: 'Total honoraires', val: totals.hono, color: 'var(--primary)' },
            { label: 'À conserver (ma part)', val: totals.moi, color: 'var(--success)' },
            { label: 'À reverser au titulaire', val: totals.tit, color: 'var(--warning)' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, minWidth: 130, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {acts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Aucun acte pour cette sélection.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg)', position: 'sticky', top: 0 }}>
                  {['Date', 'Patient', 'Acte', 'Honoraires', 'Rétro.', 'Ma part', 'Part titulaire', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: h === 'Date' || h === 'Patient' || h === 'Acte' || h === 'Statut' ? 'left' : 'right', fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {acts.map((a, idx) => {
                  const myPart = a.fee * a.retrocessionRate / 100
                  const titPart = a.fee - myPart
                  const ps = PAYMENT_STATUS[a.paymentStatus] || PAYMENT_STATUS.paid
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>
                        {a.patientLastName}{a.patientFirstName ? ` ${a.patientFirstName}` : ''}
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>{a.actType}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600 }}>{a.fee.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>{a.retrocessionRate}%</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{myPart.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--warning)', fontWeight: 600 }}>{titPart.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: ps.color }}>{ps.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--primary-50)', fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: '10px 12px', color: 'var(--primary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAUX ({acts.length} acte{acts.length > 1 ? 's' : ''})</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--primary)' }}>{totals.hono.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                  <td></td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--success)' }}>{totals.moi.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--warning)' }}>{totals.tit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
          <button
            className="btn btn-primary"
            disabled={acts.length === 0}
            onClick={() => generatePDF({ cabinet, acts, user: data?.user, period: periodLabel })}
          >
            <FileText size={15} /> Exporter PDF
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Cabinet Modal ─── */
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

/* ─── Main Page ─── */
export default function Cabinets() {
  const { data, addCabinet, updateCabinet, deleteCabinet } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [recapCabinet, setRecapCabinet] = useState(null)
  const [expandedPending, setExpandedPending] = useState({})

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
    const allActs = (data?.acts || []).filter(a => a.cabinetId === cabId)
    const paid = allActs.filter(a => a.paymentStatus === 'paid')
    const pending = allActs.filter(a => a.paymentStatus !== 'paid')
    const repls = (data?.replacements || []).filter(r => r.cabinetId === cabId)
    const revenus = paid.reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0)
    const patients = new Set(paid.map(a => `${a.patientLastName}-${a.patientFirstName}`)).size
    return { revenus, actes: paid.length, patients, remplacements: repls.length, pending }
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
            const showPend = expandedPending[cab.id]
            return (
              <div key={cab.id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ height: 5, background: `linear-gradient(90deg, ${cab.color}, ${cab.color}88)` }} />
                <div className="card-body">
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${cab.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🏥</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{cab.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Dr {cab.titulaireFirstName} {cab.titulaireLastName}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleEdit(cab)}><Edit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(cab.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 12, marginBottom: 14 }}>
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

                  {/* Pending patients */}
                  {stats.pending.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <button
                        onClick={() => setExpandedPending(p => ({ ...p, [cab.id]: !p[cab.id] }))}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--warning-bg)', border: '1px solid #ffcc80', borderRadius: 'var(--radius-sm)', padding: '8px 12px', cursor: 'pointer', color: 'var(--warning)', fontWeight: 600, fontSize: 13 }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} />
                          {stats.pending.length} acte{stats.pending.length > 1 ? 's' : ''} en attente
                          <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>
                            — {stats.pending.reduce((s, a) => s + a.fee, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                          </span>
                        </span>
                        {showPend ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {showPend && (
                        <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', overflow: 'hidden' }}>
                          {stats.pending.map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 13, gap: 8 }}>
                              <div>
                                <span style={{ fontWeight: 600 }}>{a.patientLastName}{a.patientFirstName ? ` ${a.patientFirstName}` : ''}</span>
                                <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>{a.actType}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                                <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{a.fee.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</span>
                                <span style={{ fontSize: 11, color: a.paymentStatus === 'partial' ? 'var(--error)' : 'var(--warning)', fontWeight: 600 }}>
                                  {a.paymentStatus === 'partial' ? 'Partiel' : 'En attente'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {cab.notes && (
                    <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      📝 {cab.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                    onClick={() => setRecapCabinet(cab)}
                  >
                    <FileText size={15} />
                    Récapitulatif & export PDF
                  </button>
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

      {recapCabinet && (
        <RecapModal
          cabinet={recapCabinet}
          onClose={() => setRecapCabinet(null)}
        />
      )}
    </div>
  )
}
