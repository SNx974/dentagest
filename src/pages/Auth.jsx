import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Eye, EyeOff, ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react'

export default function Auth() {
  const { login, register } = useApp()
  const [mode, setMode] = useState('login')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', rpps: ''
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    if (mode === 'login') {
      const ok = login(form.email, form.password)
      if (!ok) setError('Email ou mot de passe incorrect.')
    } else {
      if (!form.firstName || !form.lastName || !form.email || !form.password) {
        setError('Veuillez remplir tous les champs obligatoires.')
        setLoading(false)
        return
      }
      register({ firstName: form.firstName, lastName: form.lastName, email: form.email, rpps: form.rpps })
    }
    setLoading(false)
  }

  const demoLogin = () => {
    setForm({ ...form, email: 'demo@dentagest.fr', password: 'demo' })
    login('demo@dentagest.fr', 'demo')
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
            <div style={{
              width: 56, height: 56,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 30
            }}>🦷</div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>DentaGest</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Gestion Remplaçant Micro-BNC</p>
            </div>
          </div>

          <h2 style={{ fontSize: 34, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 16 }}>
            Gérez votre activité<br />de remplaçant en toute<br />simplicité.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 48, lineHeight: 1.6 }}>
            Suivi du CA, calcul des rétrocessions, cotisations URSSAF et revenus nets — tout en un.
          </p>

          <div className="auth-feature">
            <div className="auth-feature-icon"><TrendingUp size={20} color="white" /></div>
            <div>
              <div style={{ fontWeight: 600 }}>Suivi financier en temps réel</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>CA brut, rétrocessions, revenu net</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon"><Shield size={20} color="white" /></div>
            <div>
              <div style={{ fontWeight: 600 }}>Calcul Micro-BNC automatique</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>URSSAF, CARCDSF, plafond annuel</div>
            </div>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon"><Zap size={20} color="white" /></div>
            <div>
              <div style={{ fontWeight: 600 }}>Enregistrement ultra-rapide</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Moins de 10 secondes par acte</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form">
          <div className="auth-logo">
            <div className="auth-logo-icon">🦷</div>
            <div className="auth-logo-text">
              <h1>DentaGest</h1>
              <p>Remplaçant · Micro-BNC</p>
            </div>
          </div>

          <h2 className="auth-title">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Accédez à votre espace de gestion'
              : 'Commencez à gérer votre activité'}
          </p>

          {error && (
            <div style={{
              background: 'var(--error-bg)', border: '1px solid #ffcdd2',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'var(--error)', fontSize: 14, marginBottom: 20
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prénom <span>*</span></label>
                  <input
                    className="form-control"
                    placeholder="Marie"
                    value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nom <span>*</span></label>
                  <input
                    className="form-control"
                    placeholder="Dupont"
                    value={form.lastName}
                    onChange={e => set('lastName', e.target.value)}
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">N° RPPS (optionnel)</label>
                <input
                  className="form-control"
                  placeholder="10012345678"
                  value={form.rpps}
                  onChange={e => set('rpps', e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email <span>*</span></label>
              <input
                className="form-control"
                type="email"
                placeholder="marie.dupont@email.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe <span>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                  Connexion...
                </span>
              ) : (
                <>
                  {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
                onClick={demoLogin}
              >
                🎯 Essayer avec des données démo
              </button>
            )}

            <div className="divider" />

            <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
              {mode === 'login' ? (
                <>Pas encore de compte ?{' '}
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setMode('register'); setError('') }}>
                    Créer un compte
                  </button>
                </>
              ) : (
                <>Déjà un compte ?{' '}
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setMode('login'); setError('') }}>
                    Se connecter
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
