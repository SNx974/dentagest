import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { FileText, X, Calendar, Percent } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/* ─── helpers ─── */
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const fmtDateShort = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fmtMoney = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s

/* ─── build derived data ─── */
function buildRecapData(acts, retrocessionRate) {
  // Group by date → daily totals
  const byDate = {}
  acts.forEach(a => {
    const d = a.date.split('T')[0]
    if (!byDate[d]) byDate[d] = { date: d, acts: [], ca: 0, retro: 0 }
    byDate[d].acts.push(a)
    byDate[d].ca += a.fee
    byDate[d].retro += a.fee * a.retrocessionRate / 100
  })
  const days = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))

  // Group by patient → patient details
  const byPatient = {}
  acts.forEach(a => {
    const key = `${a.patientLastName}||${a.patientFirstName || ''}`
    if (!byPatient[key]) byPatient[key] = { lastName: a.patientLastName, firstName: a.patientFirstName || '', acts: [], ca: 0, retro: 0 }
    byPatient[key].acts.push(a)
    byPatient[key].ca += a.fee
    byPatient[key].retro += a.fee * a.retrocessionRate / 100
  })
  const patients = Object.values(byPatient).sort((a, b) => a.lastName.localeCompare(b.lastName))

  const totalCA = acts.reduce((s, a) => s + a.fee, 0)
  const totalRetro = acts.reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0)

  return { days, patients, totalCA, totalRetro }
}

/* ─── PDF export ─── */
function exportPDF({ replacement, cabinet, user, acts, days, patients, totalCA, totalRetro }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PRIMARY = [21, 101, 192]
  const GREY = [100, 100, 100]
  const pageW = doc.internal.pageSize.getWidth()
  const retro = replacement.retrocessionRate

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  const title = `Comptabilité remplacement Dr ${user?.firstName || ''} ${user?.lastName || ''}`
  doc.text(title, pageW / 2, 18, { align: 'center' })

  // Underline
  const titleW = doc.getTextWidth(title)
  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.5)
  doc.line((pageW - titleW) / 2, 20, (pageW + titleW) / 2, 20)

  // Cabinet / period info
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GREY)
  const period = `${fmtDateShort(replacement.startDate)}${replacement.endDate ? ' — ' + fmtDateShort(replacement.endDate) : ''}`
  doc.text(`Cabinet : ${cabinet?.name || ''}   ·   Dr ${cabinet?.titulaireFirstName || ''} ${cabinet?.titulaireLastName || ''}   ·   Période : ${period}`, pageW / 2, 26, { align: 'center' })

  let curY = 33

  // ── Table 1: Soins par jour ──
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Soins :', 14, curY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GREY)
  doc.text('(tous les actes par journée)', 32, curY)
  curY += 3

  autoTable(doc, {
    startY: curY,
    head: [['Jour', 'CA', `Rétro ${retro}%`]],
    body: days.map(d => [
      capitalize(fmtDate(d.date)),
      d.ca.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      d.retro.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    ]),
    foot: [['Total', totalCA.toLocaleString('fr-FR', { minimumFractionDigits: 2 }), totalRetro.toLocaleString('fr-FR', { minimumFractionDigits: 2 })]],
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: [240, 247, 255], textColor: PRIMARY, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 252, 255] },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: 'bold' },
      1: { cellWidth: 45, halign: 'center' },
      2: { cellWidth: 45, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  })

  curY = doc.lastAutoTable.finalY + 10

  // ── Table 2: Détail patients ──
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Détail patients :', 14, curY)
  curY += 3

  // Build rows — one row per act, with patient name only on first act
  const patientRows = []
  patients.forEach(p => {
    p.acts.forEach((a, idx) => {
      const myPart = a.fee * a.retrocessionRate / 100
      patientRows.push({
        patient: idx === 0 ? `${p.lastName} ${p.firstName}\n${fmtMoney(p.ca)}` : '',
        acte: a.actType,
        ca: fmtMoney(a.fee),
        retro: fmtMoney(myPart),
        isFirst: idx === 0,
        isLast: idx === p.acts.length - 1,
      })
    })
  })

  autoTable(doc, {
    startY: curY,
    head: [['Patient', 'Acte', 'CA', `Rétro ${retro}%`]],
    body: patientRows.map(r => [r.patient, r.acte, r.ca, r.retro]),
    foot: [['Total', '', fmtMoney(totalCA), fmtMoney(totalRetro)]],
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: [240, 247, 255], textColor: PRIMARY, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: {},
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0 && data.cell.raw) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [245, 248, 255]
      }
    },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 60 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  const finalY = doc.lastAutoTable.finalY + 8

  // ── Totaux finaux ──
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(`Total (soins) : ${fmtMoney(totalCA)}`, 14, finalY)
  doc.text(`Total rétro ${retro}% : ${fmtMoney(totalRetro)}`, 14, finalY + 7)

  // Footer
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text(`DentaGest — Généré le ${new Date().toLocaleDateString('fr-FR')} — Document confidentiel`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' })

  const filename = `Compta_${user?.lastName || 'Dr'}_${cabinet?.name?.replace(/\s+/g, '_') || 'cabinet'}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

/* ─── Main Component ─── */
export default function RecapRemplacement({ replacementId, onClose }) {
  const { data } = useApp()

  const replacement = data?.replacements?.find(r => r.id === replacementId)
  const cabinet = replacement ? data?.cabinets?.find(c => c.id === replacement.cabinetId) : null
  const acts = useMemo(() => (data?.acts || []).filter(a => a.replacementId === replacementId), [data?.acts, replacementId])

  const { days, patients, totalCA, totalRetro } = useMemo(() => buildRecapData(acts, replacement?.retrocessionRate), [acts, replacement])

  if (!replacement) return null

  const retro = replacement.retrocessionRate

  const thStyle = { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '2px solid var(--border)', background: 'var(--bg)', whiteSpace: 'nowrap' }
  const tdStyle = (extra = {}) => ({ padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, ...extra })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxHeight: '95vh', display: 'flex', flexDirection: 'column', width: 'min(96vw, 820px)' }}>

        {/* Header */}
        <div className="modal-header" style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 2 }}>
              Comptabilité remplacement Dr {data?.user?.firstName} {data?.user?.lastName}
            </h2>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>🏥 {cabinet?.name}</span>
              <span>👨‍⚕️ Dr {cabinet?.titulaireFirstName} {cabinet?.titulaireLastName}</span>
              <span>📅 {fmtDateShort(replacement.startDate)}{replacement.endDate ? ' → ' + fmtDateShort(replacement.endDate) : ''}</span>
              <span>💰 Rétro {retro}%</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {acts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Aucun acte enregistré pour ce remplacement</div>
              <div style={{ fontSize: 13 }}>Associez des actes à ce remplacement pour voir le récapitulatif.</div>
            </div>
          ) : (
            <>
              {/* Summary totals */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                  { label: 'CA total', val: totalCA, color: 'var(--primary)', bg: 'var(--primary-50)' },
                  { label: `Ma part (${retro}%)`, val: totalRetro, color: 'var(--success)', bg: 'var(--success-bg)' },
                  { label: `Part titulaire (${100 - retro}%)`, val: totalCA - totalRetro, color: 'var(--warning)', bg: 'var(--warning-bg)' },
                  { label: 'Actes', val: null, display: `${acts.length}`, color: 'var(--text)', bg: 'var(--bg)' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 130, background: s.bg, border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>
                      {s.display || fmtMoney(s.val)}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Table 1: CA par jour ── */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ textDecoration: 'underline' }}>Soins :</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>récapitulatif par journée</span>
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, textAlign: 'left' }}>Jour</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>CA</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Rétro {retro}%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((d, i) => (
                        <tr key={d.date} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
                          <td style={tdStyle({ fontWeight: 600 })}>{capitalize(fmtDate(d.date))}</td>
                          <td style={tdStyle({ textAlign: 'center' })}>{d.ca.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                          <td style={tdStyle({ textAlign: 'center', color: 'var(--success)', fontWeight: 600 })}>{d.retro.toLocaleString('fr-FR', { minimumFractionDigits: 3 })}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--primary-50)', fontWeight: 700 }}>
                        <td style={{ ...tdStyle({ fontWeight: 700 }), color: 'var(--primary)', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.5px' }}>Total</td>
                        <td style={{ ...tdStyle({ textAlign: 'center', fontWeight: 800 }), color: 'var(--primary)' }}>{totalCA.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                        <td style={{ ...tdStyle({ textAlign: 'center', fontWeight: 800 }), color: 'var(--success)' }}>{totalRetro.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ── Table 2: Détail patients ── */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ textDecoration: 'underline' }}>Détail patients :</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>actes par patient</span>
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, textAlign: 'left' }}>Patient</th>
                        <th style={{ ...thStyle, textAlign: 'left' }}>Acte</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>CA</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Rétro {retro}%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => (
                        p.acts.map((a, idx) => {
                          const myPart = a.fee * a.retrocessionRate / 100
                          return (
                            <tr key={a.id} style={{ borderBottom: idx === p.acts.length - 1 ? '2px solid var(--border)' : '1px solid var(--border)' }}>
                              {idx === 0 ? (
                                <td rowSpan={p.acts.length} style={{ ...tdStyle(), verticalAlign: 'top', background: 'var(--primary-50)', borderRight: '1px solid var(--border)' }}>
                                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.lastName} {p.firstName}</div>
                                  <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>{fmtMoney(p.ca)}</div>
                                </td>
                              ) : null}
                              <td style={tdStyle({ color: 'var(--text-secondary)' })}>{a.actType}</td>
                              <td style={tdStyle({ textAlign: 'right', fontWeight: 600 })}>{fmtMoney(a.fee)}</td>
                              <td style={tdStyle({ textAlign: 'right', color: 'var(--success)', fontWeight: 600 })}>{fmtMoney(myPart)}</td>
                            </tr>
                          )
                        })
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--primary-50)', fontWeight: 700 }}>
                        <td style={{ ...tdStyle({ fontWeight: 700 }), color: 'var(--primary)', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.5px' }}>Total</td>
                        <td style={tdStyle()}></td>
                        <td style={{ ...tdStyle({ textAlign: 'right', fontWeight: 800 }), color: 'var(--primary)' }}>{fmtMoney(totalCA)}</td>
                        <td style={{ ...tdStyle({ textAlign: 'right', fontWeight: 800 }), color: 'var(--success)' }}>{fmtMoney(totalRetro)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ── Totaux finaux ── */}
              <div style={{ paddingTop: 16, borderTop: '2px solid var(--border)' }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
                  Total (soins) : <span style={{ color: 'var(--primary)' }}>{fmtMoney(totalCA)}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>
                  Total rétro {retro}% : <span style={{ color: 'var(--success)' }}>{fmtMoney(totalRetro)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
          <button
            className="btn btn-primary"
            disabled={acts.length === 0}
            onClick={() => exportPDF({ replacement, cabinet, user: data?.user, acts, days, patients, totalCA, totalRetro })}
          >
            <FileText size={15} /> Exporter PDF
          </button>
        </div>
      </div>
    </div>
  )
}
