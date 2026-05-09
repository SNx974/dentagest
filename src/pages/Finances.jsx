import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { Info, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calculator, Target } from 'lucide-react'

const fmt = (n, d = 0) => (n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' €'
const fmtPct = (n) => (n ?? 0).toFixed(1) + '%'

function InfoBadge({ text }) {
  return (
    <div className="tooltip" style={{ display: 'inline-block', marginLeft: 6 }}>
      <Info size={13} style={{ color: 'var(--text-muted)', cursor: 'help', verticalAlign: 'middle' }} />
      <span className="tooltip-text">{text}</span>
    </div>
  )
}

export default function Finances() {
  const { data, getStats, getMonthlyData, updateSettings } = useApp()
  const [year, setYear] = useState(new Date().getFullYear())
  const [simFee, setSimFee] = useState('')

  const settings = data?.settings || {}
  const stats = getStats()
  const monthlyData = getMonthlyData()

  const yearlyActs = useMemo(() => {
    return (data?.acts || []).filter(a => {
      const y = new Date(a.date).getFullYear()
      return y === year && a.paymentStatus === 'paid'
    })
  }, [data?.acts, year])

  const yearlyRevenu = yearlyActs.reduce((s, a) => s + a.fee * a.retrocessionRate / 100, 0)
  const yearlyCA = yearlyActs.reduce((s, a) => s + a.fee, 0)

  const abattement = yearlyRevenu * settings.abattementRate / 100
  const revenuImposable = yearlyRevenu - abattement
  const urssaf = yearlyRevenu * settings.urssafRate / 100
  const cotisForce = settings.carcdsf?.cotisationForcelitaire || 0
  const cotisProps = yearlyRevenu * (settings.carcdsf?.cotisationProportionnelle || 0) / 100
  const prevoyance = settings.carcdsf?.prevoyance || 0
  const invalidite = settings.carcdsf?.invaliditeDeces || 0
  const carcdsf = cotisForce + cotisProps + prevoyance + invalidite
  const chargesTotal = urssaf + carcdsf
  const revenuNet = yearlyRevenu - chargesTotal
  const tauxChargesEffectif = yearlyRevenu > 0 ? (chargesTotal / yearlyRevenu) * 100 : 0
  const plafondPct = Math.min((yearlyRevenu / settings.microBncCeiling) * 100, 100)
  const plafondColor = plafondPct > 80 ? 'var(--error)' : plafondPct > 60 ? 'var(--warning)' : 'var(--success)'

  // Simulation
  const simResult = useMemo(() => {
    const addRevenu = parseFloat(simFee) || 0
    const totalRevenu = yearlyRevenu + addRevenu
    const totalUR = totalRevenu * settings.urssafRate / 100
    const totalCARC = cotisForce + totalRevenu * (settings.carcdsf?.cotisationProportionnelle || 0) / 100 + prevoyance + invalidite
    const totalCharges = totalUR + totalCARC
    const net = totalRevenu - totalCharges
    const netAdd = net - revenuNet
    return { totalRevenu, totalCharges, net, netAdd }
  }, [simFee, yearlyRevenu, settings])

  const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', boxShadow: 'var(--shadow)' }}>
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

  const years = useMemo(() => {
    const ys = new Set((data?.acts || []).map(a => new Date(a.date).getFullYear()))
    ys.add(new Date().getFullYear())
    return [...ys].sort((a, b) => b - a)
  }, [data?.acts])

  const quarterlyData = useMemo(() => {
    const q = { 'T1': { label: 'T1 (Jan-Mar)', revenus: 0, charges: 0 }, 'T2': { label: 'T2 (Avr-Jun)', revenus: 0, charges: 0 }, 'T3': { label: 'T3 (Jul-Sep)', revenus: 0, charges: 0 }, 'T4': { label: 'T4 (Oct-Déc)', revenus: 0, charges: 0 } }
    yearlyActs.forEach(a => {
      const m = new Date(a.date).getMonth()
      const key = m < 3 ? 'T1' : m < 6 ? 'T2' : m < 9 ? 'T3' : 'T4'
      const rev = a.fee * a.retrocessionRate / 100
      q[key].revenus += rev
      q[key].charges += rev * tauxChargesEffectif / 100
    })
    return Object.values(q).map(item => ({ ...item, net: item.revenus - item.charges }))
  }, [yearlyActs, tauxChargesEffectif])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Finances & Micro-BNC</h1>
          <p className="page-subtitle">Calculs automatiques URSSAF · CARCDSF · Revenu net</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="form-control" style={{ width: 120 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {years.map(y => <option key={y} value={y}>Année {y}</option>)}
          </select>
        </div>
      </div>

      {/* Plafond banner */}
      <div className="card mb-24" style={{ marginBottom: 20, border: `1px solid ${plafondPct > 80 ? 'var(--error)' : plafondPct > 60 ? 'var(--warning)' : 'var(--border)'}` }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {plafondPct > 80 ? <AlertTriangle size={20} style={{ color: 'var(--error)' }} /> : <CheckCircle size={20} style={{ color: 'var(--success)' }} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Plafond Micro-BNC {year}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {plafondPct > 80
                    ? `⚠ Attention ! Vous approchez du plafond. Restant : ${fmt(Math.max(settings.microBncCeiling - yearlyRevenu, 0))}`
                    : `Restant avant plafond : ${fmt(Math.max(settings.microBncCeiling - yearlyRevenu, 0))}`}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 30, fontWeight: 900, color: plafondColor }}>{plafondPct.toFixed(1)}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(yearlyRevenu)} / {fmt(settings.microBncCeiling)}</div>
            </div>
          </div>
          <div className="progress-bar" style={{ height: 14, borderRadius: 7 }}>
            <div className={`progress-fill ${plafondPct > 80 ? 'red' : plafondPct > 60 ? 'orange' : 'green'}`} style={{ width: `${plafondPct}%`, borderRadius: 7 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>0 €</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Plafond : {fmt(settings.microBncCeiling)}</span>
          </div>
        </div>
      </div>

      {/* Finance table */}
      <div className="chart-grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Tableau financier {year}</div>
              <div className="card-subtitle">Estimation Micro-BNC</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>* Estimations indicatives</div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="finance-table">
              <tbody>
                <tr>
                  <td>CA brut (honoraires totaux)</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(yearlyCA)}</td>
                </tr>
                <tr style={{ background: 'var(--bg)' }}>
                  <td style={{ paddingLeft: 24, color: 'var(--text-secondary)', fontSize: 13 }}>— Rétrocessions versées au(x) titulaire(s)</td>
                  <td style={{ textAlign: 'right', color: 'var(--warning)', fontWeight: 600 }}>— {fmt(yearlyCA - yearlyRevenu)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td style={{ fontWeight: 700 }}>
                    Revenus encaissés (base Micro-BNC)
                    <InfoBadge text="Vos honoraires après déduction des rétrocessions" />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{fmt(yearlyRevenu)}</td>
                </tr>
                <tr style={{ background: 'var(--bg)' }}>
                  <td style={{ paddingLeft: 24, color: 'var(--text-secondary)', fontSize: 13 }}>
                    — Abattement forfaitaire ({settings.abattementRate}%)
                    <InfoBadge text="Abattement Micro-BNC pour frais professionnels" />
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>— {fmt(abattement)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>
                    Base imposable estimée
                    <InfoBadge text="Revenu soumis à l'impôt sur le revenu" />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(revenuImposable)}</td>
                </tr>

                <tr><td colSpan={2} style={{ padding: '4px 16px', background: 'var(--bg)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Charges sociales estimées</td></tr>

                <tr>
                  <td style={{ paddingLeft: 24, color: 'var(--text-secondary)', fontSize: 13 }}>
                    URSSAF (maladie, retraite de base) — {settings.urssafRate}%
                    <InfoBadge text="Cotisations URSSAF libéraux non salariés" />
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--error)', fontWeight: 600 }}>— {fmt(urssaf)}</td>
                </tr>
                <tr style={{ background: 'var(--bg)' }}>
                  <td style={{ paddingLeft: 24, color: 'var(--text-secondary)', fontSize: 13 }}>
                    CARCDSF — Cotisation forfaitaire
                    <InfoBadge text="Retraite complémentaire dentistes" />
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--error)', fontWeight: 600 }}>— {fmt(cotisForce + prevoyance + invalidite)}</td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 24, color: 'var(--text-secondary)', fontSize: 13 }}>
                    CARCDSF — Cotisation proportionnelle ({settings.carcdsf?.cotisationProportionnelle}%)
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--error)', fontWeight: 600 }}>— {fmt(cotisProps)}</td>
                </tr>
                <tr style={{ background: 'var(--error-bg)' }}>
                  <td style={{ fontWeight: 700, color: 'var(--error)' }}>Total charges estimées</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--error)' }}>— {fmt(chargesTotal)}</td>
                </tr>
                <tr style={{ background: 'var(--success-bg)', borderTop: '2px solid var(--success)' }}>
                  <td style={{ fontWeight: 800, fontSize: 15, color: 'var(--success)' }}>
                    🎯 Revenu net estimé
                    <InfoBadge text="Avant impôt sur le revenu" />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, fontSize: 20, color: 'var(--success)' }}>{fmt(revenuNet)}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>Taux de charges effectif</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>{fmtPct(tauxChargesEffectif)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mini stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Revenus encaissés', value: fmt(yearlyRevenu), color: 'var(--primary)', bg: 'var(--primary-50)' },
              { label: 'Charges totales', value: fmt(chargesTotal), color: 'var(--error)', bg: 'var(--error-bg)' },
              { label: 'Revenu net', value: fmt(revenuNet), color: 'var(--success)', bg: 'var(--success-bg)' },
              { label: 'Base imposable', value: fmt(revenuImposable), color: 'var(--text)', bg: 'var(--bg)' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Simulation */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calculator size={16} /> Simulateur
              </div>
            </div>
            <div className="card-body">
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                Si vous encaissez <strong>X €</strong> supplémentaires ce mois-ci :
              </div>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <input
                  type="number" className="form-control" placeholder="Montant supplémentaire..."
                  value={simFee} onChange={e => setSimFee(e.target.value)}
                  style={{ paddingRight: 32 }}
                />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>€</span>
              </div>
              {simFee && (
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nouveau total revenus :</span>
                    <strong>{fmt(simResult.totalRevenu)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Charges supplémentaires :</span>
                    <strong style={{ color: 'var(--error)' }}>+{fmt(simResult.totalCharges - chargesTotal)}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Gain net réel :</span>
                    <strong style={{ color: 'var(--success)', fontSize: 16 }}>+{fmt(simResult.netAdd)}</strong>
                  </div>
                  {simResult.totalRevenu > settings.microBncCeiling && (
                    <div style={{ marginTop: 8, background: 'var(--error-bg)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: 'var(--error)', fontWeight: 500 }}>
                      ⚠ Dépassement du plafond Micro-BNC !
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly chart */}
      <div className="chart-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Répartition trimestrielle {year}</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={quarterlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenus" name="Revenus" fill="#1565C0" radius={[3, 3, 0, 0]} />
                <Bar dataKey="charges" name="Charges" fill="#EF5350" radius={[3, 3, 0, 0]} />
                <Bar dataKey="net" name="Net" fill="#2E7D32" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Évolution mensuelle {year}</div>
          </div>
          <div className="card-body">
            {monthlyData.filter(m => m.month.startsWith(year)).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData.filter(m => m.month.startsWith(String(year)))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenus" name="Revenus" stroke="#1565C0" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="retrocessions" name="Rétrocessions" stroke="#E65100" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">📈</div>
                <div className="empty-state-text">Aucune donnée pour cette année</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          ⚠️ <strong>Avertissement :</strong> Ces calculs sont des estimations indicatives basées sur les taux paramétrés. Les taux réels URSSAF et CARCDSF peuvent varier. Consultez un expert-comptable ou l'URSSAF pour des calculs officiels.
          Taux configurés : URSSAF {settings.urssafRate}% · Abattement {settings.abattementRate}% · CARCDSF proportionnel {settings.carcdsf?.cotisationProportionnelle}%.
          <button
            style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
            onClick={() => {}}
          >
            Modifier les taux →
          </button>
        </div>
      </div>
    </div>
  )
}
