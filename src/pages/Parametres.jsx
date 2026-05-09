import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Save, User, Calculator, Target, Palette, Download, Trash2, AlertTriangle, Tag } from 'lucide-react'

const ACT_TYPES = [
  'Consultation', 'Urgence', 'Détartrage', 'Extraction simple', 'Extraction complexe',
  'Composite antérieur', 'Composite postérieur', 'Inlay-Onlay', 'Couronne céramique',
  'Couronne métal-céramique', 'Bridge 3 éléments', 'Bridge 4 éléments', 'Bridge 5+ éléments',
  'Prothèse amovible complète', 'Prothèse amovible partielle', 'Implant', 'Greffe osseuse',
  'Sinus lift', 'Traitement canalaire (1 canal)', 'Traitement canalaire (2 canaux)',
  'Traitement canalaire (3+ canaux)', 'Retraitement canalaire', 'Parodontologie',
  'Orthodontie adulte', 'Gouttière', 'Blanchiment', 'Radiographie', 'Panoramique', 'Autre',
]

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={18} style={{ color: 'var(--primary)' }} />
          <div className="card-title">{title}</div>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  )
}

export default function Parametres() {
  const { data, updateSettings, updateUser, logout } = useApp()
  const [saved, setSaved] = useState('')
  const [userForm, setUserForm] = useState(data?.user || {})
  const [settingsForm, setSettingsForm] = useState(data?.settings || {})

  const setS = (k, v) => setSettingsForm(f => ({ ...f, [k]: v }))
  const setCarcdsf = (k, v) => setSettingsForm(f => ({ ...f, carcdsf: { ...f.carcdsf, [k]: parseFloat(v) || 0 } }))
  const setActPrice = (actType, v) => setSettingsForm(f => ({ ...f, actPrices: { ...(f.actPrices || {}), [actType]: v === '' ? undefined : parseFloat(v) || 0 } }))
  const setU = (k, v) => setUserForm(f => ({ ...f, [k]: v }))

  const handleSaveUser = () => {
    updateUser(userForm)
    setSaved('user')
    setTimeout(() => setSaved(''), 2000)
  }

  const handleSaveSettings = () => {
    updateSettings({ ...settingsForm, urssafRate: parseFloat(settingsForm.urssafRate), abattementRate: parseFloat(settingsForm.abattementRate), microBncCeiling: parseFloat(settingsForm.microBncCeiling), revenueGoal: parseFloat(settingsForm.revenueGoal) || 0 })
    setSaved('settings')
    setTimeout(() => setSaved(''), 2000)
  }

  const exportAllData = () => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dentagest_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const headers = ['Date', 'Patient', 'Type', 'Cabinet', 'Honoraires', 'Retrocession%', 'Ma part', 'Paiement', 'Statut']
    const rows = (data?.acts || []).map(a => {
      const cab = data?.cabinets?.find(c => c.id === a.cabinetId)
      return [
        new Date(a.date).toLocaleDateString('fr-FR'),
        `${a.patientLastName} ${a.patientFirstName}`,
        a.actType, cab?.name || '',
        a.fee.toFixed(2), a.retrocessionRate,
        (a.fee * a.retrocessionRate / 100).toFixed(2),
        a.paymentMethod, a.paymentStatus,
      ]
    })
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dentagest_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const resetData = () => {
    if (!window.confirm('⚠ ATTENTION : Cela supprimera TOUTES vos données (actes, remplacements, cabinets). Cette action est irréversible. Continuer ?')) return
    if (!window.confirm('Dernière confirmation : êtes-vous sûr de vouloir tout effacer ?')) return
    localStorage.clear()
    window.location.reload()
  }

  const SaveButton = ({ id, label = 'Enregistrer' }) => (
    <button
      className={`btn ${saved === id ? 'btn-success' : 'btn-primary'}`}
      onClick={id === 'user' ? handleSaveUser : handleSaveSettings}
    >
      {saved === id ? '✓ Sauvegardé !' : <><Save size={15} /> {label}</>}
    </button>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-subtitle">Configuration de votre compte et des calculs fiscaux</p>
        </div>
      </div>

      {/* Profile */}
      <Section title="Profil professionnel" icon={User}>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Prénom</label>
            <input className="form-control" value={userForm.firstName || ''} onChange={e => setU('firstName', e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nom</label>
            <input className="form-control" value={userForm.lastName || ''} onChange={e => setU('lastName', e.target.value)} />
          </div>
        </div>
        <div className="form-row" style={{ marginTop: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={userForm.email || ''} onChange={e => setU('email', e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">N° RPPS</label>
            <input className="form-control" placeholder="10012345678" value={userForm.rpps || ''} onChange={e => setU('rpps', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton id="user" label="Sauvegarder le profil" />
        </div>
      </Section>

      {/* Fiscal */}
      <Section title="Calculs fiscaux Micro-BNC" icon={Calculator}>
        <div style={{ background: 'var(--primary-50)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 16, fontSize: 13, color: 'var(--primary)' }}>
          ℹ Ces paramètres servent aux estimations de revenus nets. Valeurs 2024-2026 pré-remplies.
        </div>

        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Plafond Micro-BNC (€)</label>
            <input type="number" className="form-control" value={settingsForm.microBncCeiling || ''} onChange={e => setS('microBncCeiling', e.target.value)} />
            <p className="form-hint">77 700 € en 2024</p>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Abattement forfaitaire (%)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" className="form-control" min={0} max={100} step={0.1} value={settingsForm.abattementRate || ''} onChange={e => setS('abattementRate', e.target.value)} style={{ paddingRight: 32 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
            </div>
            <p className="form-hint">34% pour professions libérales</p>
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Taux URSSAF global (%)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" className="form-control" min={0} max={50} step={0.1} value={settingsForm.urssafRate || ''} onChange={e => setS('urssafRate', e.target.value)} style={{ paddingRight: 32 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
            </div>
            <p className="form-hint">≈ 23.2% (maladie + retraite de base)</p>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Rétrocession par défaut (%)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" className="form-control" min={0} max={100} step={1} value={settingsForm.defaultRetrocessionRate || ''} onChange={e => setS('defaultRetrocessionRate', e.target.value)} style={{ paddingRight: 32 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
            </div>
            <p className="form-hint">Appliqué par défaut aux nouveaux actes</p>
          </div>
        </div>

        <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>CARCDSF — Caisse de retraite des chirurgiens-dentistes</div>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cotisation forfaitaire (€/an)</label>
              <input type="number" className="form-control" value={settingsForm.carcdsf?.cotisationForcelitaire || ''} onChange={e => setCarcdsf('cotisationForcelitaire', e.target.value)} />
              <p className="form-hint">≈ 1 015 €/an (variable)</p>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cotisation proportionnelle (%)</label>
              <input type="number" className="form-control" step={0.1} value={settingsForm.carcdsf?.cotisationProportionnelle || ''} onChange={e => setCarcdsf('cotisationProportionnelle', e.target.value)} />
              <p className="form-hint">≈ 8.7% du revenu</p>
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prévoyance (€/an)</label>
              <input type="number" className="form-control" value={settingsForm.carcdsf?.prevoyance || ''} onChange={e => setCarcdsf('prevoyance', e.target.value)} />
              <p className="form-hint">≈ 891 €/an</p>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Invalidité-Décès (€/an)</label>
              <input type="number" className="form-control" value={settingsForm.carcdsf?.invaliditeDeces || ''} onChange={e => setCarcdsf('invaliditeDeces', e.target.value)} />
              <p className="form-hint">≈ 151 €/an</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton id="settings" label="Sauvegarder les taux" />
        </div>
      </Section>

      {/* Tarifs par acte */}
      <Section title="Tarifs par défaut par acte" icon={Tag}>
        <div style={{ background: 'var(--primary-50)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 16, fontSize: 13, color: 'var(--primary)' }}>
          💡 Renseignez vos tarifs habituels. Le montant sera pré-rempli automatiquement lors de la création d'un acte.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {ACT_TYPES.map(type => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
              <label style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={type}>{type}</label>
              <div style={{ position: 'relative', width: 90, flexShrink: 0 }}>
                <input
                  type="number"
                  className="form-control"
                  min={0}
                  step={0.5}
                  placeholder="—"
                  value={settingsForm.actPrices?.[type] ?? ''}
                  onChange={e => setActPrice(type, e.target.value)}
                  style={{ paddingRight: 24, fontSize: 13, height: 34, textAlign: 'right' }}
                />
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12, pointerEvents: 'none' }}>€</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton id="settings" label="Sauvegarder les tarifs" />
        </div>
      </Section>

      {/* Objectif */}
      <Section title="Objectif & suivi" icon={Target}>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Objectif de revenus annuel (€)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" className="form-control" placeholder="60000" value={settingsForm.revenueGoal || ''} onChange={e => setS('revenueGoal', e.target.value)} style={{ paddingRight: 32 }} />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>€</span>
            </div>
            <p className="form-hint">Affiché en progression sur le dashboard</p>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton id="settings" label="Sauvegarder l'objectif" />
        </div>
      </Section>

      {/* Apparence */}
      <Section title="Apparence" icon={Palette}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Mode d'affichage</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Choisissez entre le mode clair et sombre</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={`btn ${data?.settings?.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { updateSettings({ theme: 'light' }) }}
            >☀ Clair</button>
            <button
              className={`btn ${data?.settings?.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { updateSettings({ theme: 'dark' }) }}
            >🌙 Sombre</button>
          </div>
        </div>
      </Section>

      {/* Export / Données */}
      <Section title="Export & Données" icon={Download}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '16px' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Export CSV</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Tous vos actes au format tableur</div>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14} /> Télécharger CSV</button>
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '16px' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Sauvegarde complète</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Toutes vos données en JSON</div>
            <button className="btn btn-secondary btn-sm" onClick={exportAllData}><Download size={14} /> Télécharger JSON</button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={16} style={{ color: 'var(--error)' }} />
            <span style={{ fontWeight: 600, color: 'var(--error)' }}>Zone dangereuse</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger btn-sm" onClick={resetData}>
              <Trash2 size={14} /> Supprimer toutes les données
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Cette action supprime définitivement toutes vos données. Faites une sauvegarde avant.</p>
        </div>
      </Section>

      {/* Infos app */}
      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>
        <div style={{ marginBottom: 4 }}>🦷 <strong>DentaGest</strong> v1.0.0</div>
        <div>Gestion financière pour chirurgien-dentiste remplaçant · Micro-BNC</div>
        <div style={{ marginTop: 8, fontSize: 12 }}>Données stockées localement dans votre navigateur · Aucune donnée transmise en ligne</div>
      </div>
    </div>
  )
}
