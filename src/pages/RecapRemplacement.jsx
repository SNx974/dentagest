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

/* ─── PDF number helpers (évite l'espace insécable U+00A0 de toLocaleString) ─── */
const pdfNum = (n, dec = 2) => {
  const [int, d] = n.toFixed(dec).split('.')
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + d
}
const pdfMoney = (n) => pdfNum(n, 2) + ' €'  // € en Unicode safe

/* ─── PDF export ─── */
function exportPDF({ replacement, cabinet, user, acts, days, patients, totalCA, totalRetro }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const P  = [21, 101, 192]   // primary blue
  const G  = [100, 116, 139]  // grey
  const BG = [241, 245, 249]  // light bg
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const retro = replacement.retrocessionRate
  const M = 14  // margin

  /* ── Bandeau header bleu ── */
  doc.setFillColor(...P)
  doc.rect(0, 0, pageW, 30, 'F')

  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`Comptabilite remplacement Dr ${user?.firstName || ''} ${user?.lastName || ''}`, pageW / 2, 12, { align: 'center' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 220, 255)
  const period = `${fmtDateShort(replacement.startDate)}${replacement.endDate ? ' - ' + fmtDateShort(replacement.endDate) : ''}`
  doc.text(`${cabinet?.name || ''}  |  Dr ${cabinet?.titulaireFirstName || ''} ${cabinet?.titulaireLastName || ''}  |  Periode : ${period}  |  Retrocession : ${retro}%`, pageW / 2, 22, { align: 'center' })

  let curY = 38

  /* ── Section label helper ── */
  const sectionLabel = (label, y) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...P)
    doc.text(label, M, y)
    doc.setDrawColor(...P)
    doc.setLineWidth(0.4)
    doc.line(M, y + 1, M + doc.getTextWidth(label), y + 1)
  }

  /* ══════════════════════════════════
     TABLE 1 — CA PAR JOUR
  ══════════════════════════════════ */
  sectionLabel('Soins - Recapitulatif par journee', curY)
  curY += 4

  autoTable(doc, {
    startY: curY,
    showFoot: 'lastPage',
    head: [['Jour', 'CA (EUR)', `Retro ${retro}% (EUR)`]],
    body: days.map(d => [
      capitalize(fmtDate(d.date)),
      pdfNum(d.ca, 2),
      pdfNum(d.retro, 3),
    ]),
    foot: [['TOTAL', pdfNum(totalCA, 2), pdfNum(totalRetro, 2)]],
    headStyles: {
      fillColor: P, textColor: [255, 255, 255],
      fontStyle: 'bold', fontSize: 9, halign: 'left',
    },
    footStyles: {
      fillColor: [227, 242, 253], textColor: P,
      fontStyle: 'bold', fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [30, 40, 50] },
    alternateRowStyles: { fillColor: [248, 252, 255] },
    columnStyles: {
      0: { cellWidth: 108, fontStyle: 'bold' },
      1: { cellWidth: 37, halign: 'right' },
      2: { cellWidth: 37, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'foot') {
        if (data.column.index >= 1) data.cell.styles.halign = 'right'
      }
    },
    margin: { left: M, right: M },
  })

  curY = doc.lastAutoTable.finalY + 10

  /* ══════════════════════════════════
     TABLE 2 — DETAIL PATIENTS
  ══════════════════════════════════ */
  sectionLabel('Detail patients', curY)
  curY += 4

  // Construction des lignes : une ligne = un acte
  // La cellule Patient n'est remplie que sur la 1ère ligne du patient
  const bodyRows = []
  const patientMeta = []   // garde trace pour le coloriage
  patients.forEach(p => {
    p.acts.forEach((a, idx) => {
      const myPart = a.fee * a.retrocessionRate / 100
      bodyRows.push([
        idx === 0 ? `${p.lastName} ${p.firstName}\n${pdfMoney(p.ca)}` : '',
        a.actType,
        pdfMoney(a.fee),
        pdfMoney(myPart),
      ])
      patientMeta.push({ isFirst: idx === 0, isLast: idx === p.acts.length - 1 })
    })
  })

  autoTable(doc, {
    startY: curY,
    showFoot: 'lastPage',
    head: [['Patient', 'Acte', 'CA', `Retro ${retro}%`]],
    body: bodyRows,
    foot: [['TOTAL', '', pdfMoney(totalCA), pdfMoney(totalRetro)]],
    headStyles: {
      fillColor: P, textColor: [255, 255, 255],
      fontStyle: 'bold', fontSize: 9,
    },
    footStyles: {
      fillColor: [227, 242, 253], textColor: P,
      fontStyle: 'bold', fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [30, 40, 50] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 75 },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const meta = patientMeta[data.row.index]
        if (data.column.index === 0 && data.cell.raw) {
          // Cellule patient remplie → fond bleu clair + gras
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fontSize = 8.5
          data.cell.styles.fillColor = [232, 240, 254]
          data.cell.styles.textColor = [20, 60, 130]
        } else if (data.column.index === 0 && !data.cell.raw) {
          // Cellule patient vide (actes suivants) → fond encore plus clair
          data.cell.styles.fillColor = [245, 248, 255]
        }
        if (data.column.index >= 2) data.cell.styles.halign = 'right'
        if (data.column.index === 3) {
          data.cell.styles.textColor = [30, 100, 50]
          data.cell.styles.fontStyle = 'bold'
        }
      }
      if (data.section === 'foot' && data.column.index >= 2) {
        data.cell.styles.halign = 'right'
      }
    },
    didDrawCell: (data) => {
      // Trait de séparation entre patients (bas de la dernière ligne d'un patient)
      if (data.section === 'body') {
        const meta = patientMeta[data.row.index]
        if (meta?.isLast) {
          doc.setDrawColor(180, 200, 230)
          doc.setLineWidth(0.3)
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height)
        }
      }
    },
    margin: { left: M, right: M },
  })

  /* ── Totaux finaux (boîtes colorées) ── */
  const finalY = doc.lastAutoTable.finalY + 10
  const pageLeft = doc.lastAutoTable.settings.margin.left
  const usableW = pageW - M * 2
  const boxW = (usableW - 8) / 3
  const boxH = 16
  const boxes = [
    { label: 'Total honoraires', val: totalCA, bg: [227, 242, 253], fg: P },
    { label: `Ma part (${retro}%)`, val: totalRetro, bg: [232, 245, 233], fg: [30, 100, 50] },
    { label: `Part titulaire (${100 - retro}%)`, val: totalCA - totalRetro, bg: [255, 243, 224], fg: [180, 80, 0] },
  ]

  // Vérifie qu'on a assez de place, sinon nouvelle page
  if (finalY + boxH + 12 > pageH - 15) {
    doc.addPage()
    const newY = 20
    drawBoxes(doc, boxes, M, newY, boxW, boxH, pdfMoney)
  } else {
    drawBoxes(doc, boxes, M, finalY, boxW, boxH, pdfMoney)
  }

  /* ── Numéros de page ── */
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 160, 160)
    doc.text(
      `DentaGest  -  Genere le ${new Date().toLocaleDateString('fr-FR')}  -  Page ${i}/${totalPages}`,
      pageW / 2, pageH - 5, { align: 'center' }
    )
  }

  const filename = `Compta_${(user?.lastName || 'Dr').replace(/\s+/g,'_')}_${(cabinet?.name || 'cabinet').replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

function drawBoxes(doc, boxes, x0, y, boxW, boxH, pdfMoney) {
  boxes.forEach((b, i) => {
    const x = x0 + i * (boxW + 4)
    doc.setFillColor(...b.bg)
    doc.roundedRect(x, y, boxW, boxH, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...b.fg)
    doc.text(b.label, x + boxW / 2, y + 5.5, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(pdfMoney(b.val), x + boxW / 2, y + 12, { align: 'center' })
  })
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
