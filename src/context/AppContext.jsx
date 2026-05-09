import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Charge toutes les données après connexion
  const loadAll = useCallback(async () => {
    try {
      const [user, cabinets, replacements, acts] = await Promise.all([
        api.getUser(),
        api.getCabinets(),
        api.getReplacements(),
        api.getActs(),
      ])
      setData({ user, cabinets, replacements, acts, settings: user.settings })
      setIsAuthenticated(true)
    } catch {
      localStorage.removeItem('dentagest_token')
      setIsAuthenticated(false)
    }
  }, [])

  // Vérification du token au démarrage
  useEffect(() => {
    const token = localStorage.getItem('dentagest_token')
    if (token) {
      loadAll().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [loadAll])

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.login(email, password)
    localStorage.setItem('dentagest_token', token)
    await loadAll()
  }, [loadAll])

  const register = useCallback(async (userData) => {
    const { token } = await api.register(userData)
    localStorage.setItem('dentagest_token', token)
    await loadAll()
  }, [loadAll])

  const logout = useCallback(() => {
    localStorage.removeItem('dentagest_token')
    setIsAuthenticated(false)
    setData(null)
    setCurrentPage('dashboard')
  }, [])

  // ── CABINETS ──────────────────────────────────────────────
  const addCabinet = useCallback(async (body) => {
    const created = await api.createCabinet(body)
    setData(prev => ({ ...prev, cabinets: [...prev.cabinets, created] }))
  }, [])

  const updateCabinet = useCallback(async (id, body) => {
    const updated = await api.updateCabinet(id, body)
    setData(prev => ({ ...prev, cabinets: prev.cabinets.map(c => c.id === id ? updated : c) }))
  }, [])

  const deleteCabinet = useCallback(async (id) => {
    await api.deleteCabinet(id)
    setData(prev => ({ ...prev, cabinets: prev.cabinets.filter(c => c.id !== id) }))
  }, [])

  // ── REPLACEMENTS ──────────────────────────────────────────
  const addReplacement = useCallback(async (body) => {
    const created = await api.createReplacement(body)
    setData(prev => ({ ...prev, replacements: [...prev.replacements, created] }))
  }, [])

  const updateReplacement = useCallback(async (id, body) => {
    const updated = await api.updateReplacement(id, body)
    setData(prev => ({ ...prev, replacements: prev.replacements.map(r => r.id === id ? updated : r) }))
  }, [])

  const deleteReplacement = useCallback(async (id) => {
    await api.deleteReplacement(id)
    setData(prev => ({ ...prev, replacements: prev.replacements.filter(r => r.id !== id) }))
  }, [])

  // ── ACTS ──────────────────────────────────────────────────
  const addAct = useCallback(async (body) => {
    const created = await api.createAct(body)
    setData(prev => ({ ...prev, acts: [created, ...prev.acts] }))
  }, [])

  const updateAct = useCallback(async (id, body) => {
    const updated = await api.updateAct(id, body)
    setData(prev => ({ ...prev, acts: prev.acts.map(a => a.id === id ? updated : a) }))
  }, [])

  const deleteAct = useCallback(async (id) => {
    await api.deleteAct(id)
    setData(prev => ({ ...prev, acts: prev.acts.filter(a => a.id !== id) }))
  }, [])

  // ── USER / SETTINGS ───────────────────────────────────────
  const updateUser = useCallback(async (body) => {
    const updated = await api.updateUser(body)
    setData(prev => ({ ...prev, user: updated }))
  }, [])

  const updateSettings = useCallback(async (updates) => {
    const settings = await api.updateSettings(updates)
    setData(prev => ({ ...prev, settings, user: { ...prev.user, settings } }))
  }, [])

  // ── COMPUTED STATS (synchrones, pas d'appel API) ──────────
  const getStats = useCallback(() => {
    if (!data) return {}
    const paid = data.acts.filter(a => a.paymentStatus === 'paid')
    const caBrut = paid.reduce((s, a) => s + a.fee, 0)
    const revenusEncaisses = paid.reduce((s, a) => s + (a.fee * a.retrocessionRate / 100), 0)
    const retrocessions = paid.reduce((s, a) => s + (a.fee * (100 - a.retrocessionRate) / 100), 0)
    const s = data.settings
    const abattement = revenusEncaisses * s.abattementRate / 100
    const revenuImposable = revenusEncaisses - abattement
    const urssaf = revenusEncaisses * s.urssafRate / 100
    const carcdsf =
      (s.carcdsf.cotisationForcelitaire + s.carcdsf.prevoyance + s.carcdsf.invaliditeDeces) +
      (revenusEncaisses * s.carcdsf.cotisationProportionnelle / 100)
    const chargesTotal = urssaf + carcdsf
    const revenuNet = revenusEncaisses - chargesTotal
    const plafondPct = Math.min((revenusEncaisses / s.microBncCeiling) * 100, 100)
    return {
      caBrut, revenusEncaisses, retrocessions,
      nbPatients: new Set(paid.map(a => `${a.patientLastName}-${a.patientFirstName}`)).size,
      nbActes: paid.length,
      abattement, revenuImposable, urssaf, carcdsf, chargesTotal, revenuNet,
      plafondPct,
      plafondRestant: Math.max(s.microBncCeiling - revenusEncaisses, 0),
      moyenneParPatient: paid.length > 0
        ? revenusEncaisses / Math.max(new Set(paid.map(a => `${a.patientLastName}-${a.patientFirstName}`)).size, 1)
        : 0,
    }
  }, [data])

  const getMonthlyData = useCallback(() => {
    if (!data) return []
    const months = {}
    data.acts.filter(a => a.paymentStatus === 'paid').forEach(act => {
      const month = act.date.substring(0, 7)
      if (!months[month]) months[month] = { month, caBrut: 0, revenus: 0, retrocessions: 0 }
      months[month].caBrut += act.fee
      months[month].revenus += act.fee * act.retrocessionRate / 100
      months[month].retrocessions += act.fee * (100 - act.retrocessionRate) / 100
    })
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).map(m => ({
      ...m,
      label: new Date(m.month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    }))
  }, [data])

  const getCabinetStats = useCallback(() => {
    if (!data) return []
    return data.cabinets.map(cab => {
      const acts = data.acts.filter(a => a.cabinetId === cab.id && a.paymentStatus === 'paid')
      return {
        ...cab,
        revenus: acts.reduce((s, a) => s + (a.fee * a.retrocessionRate / 100), 0),
        nbActes: acts.length,
        nbPatients: new Set(acts.map(a => `${a.patientLastName}-${a.patientFirstName}`)).size,
      }
    })
  }, [data])

  const theme = data?.settings?.theme || 'light'

  return (
    <AppContext.Provider value={{
      isAuthenticated, loading,
      login, register, logout,
      data, theme,
      currentPage, setCurrentPage,
      sidebarOpen, setSidebarOpen,
      addCabinet, updateCabinet, deleteCabinet,
      addReplacement, updateReplacement, deleteReplacement,
      addAct, updateAct, deleteAct,
      updateSettings, updateUser,
      getStats, getMonthlyData, getCabinetStats,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
