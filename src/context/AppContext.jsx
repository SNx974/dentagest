import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext(null)

const STORAGE_KEY = 'dentagest_data'

const DEFAULT_SETTINGS = {
  microBncCeiling: 77700,
  urssafRate: 23.2,
  abattementRate: 34,
  csgCrdsRate: 9.7,
  carcdsf: {
    cotisationForcelitaire: 1015,
    cotisationProportionnelle: 8.7,
    prevoyance: 891,
    invaliditeDeces: 151,
  },
  revenueGoal: 60000,
  defaultRetrocessionRate: 70,
  currency: 'EUR',
  theme: 'light',
}

const DEMO_DATA = {
  user: {
    id: '1',
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'marie.dupont@email.com',
    rpps: '10012345678',
  },
  cabinets: [
    {
      id: 'c1',
      name: 'Cabinet Dr Martin',
      titulaireFirstName: 'Jean',
      titulaireLastName: 'Martin',
      address: '12 rue de la Paix',
      city: 'Paris 75001',
      phone: '01 42 33 55 66',
      email: 'cabinet.martin@email.com',
      defaultRetrocessionRate: 70,
      color: '#1565C0',
      notes: '',
    },
    {
      id: 'c2',
      name: 'Cabinet Dr Lefebvre',
      titulaireFirstName: 'Sophie',
      titulaireLastName: 'Lefebvre',
      address: '8 avenue Gambetta',
      city: 'Lyon 69003',
      phone: '04 72 11 22 33',
      email: 'cabinet.lefebvre@email.com',
      defaultRetrocessionRate: 65,
      color: '#00695C',
      notes: '',
    },
  ],
  replacements: [
    {
      id: 'r1',
      cabinetId: 'c1',
      startDate: '2026-01-06',
      endDate: '2026-01-17',
      retrocessionRate: 70,
      status: 'completed',
      notes: 'Remplacement congés annuels',
      createdAt: '2025-12-20T10:00:00Z',
    },
    {
      id: 'r2',
      cabinetId: 'c2',
      startDate: '2026-02-03',
      endDate: '2026-02-14',
      retrocessionRate: 65,
      status: 'completed',
      notes: '',
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'r3',
      cabinetId: 'c1',
      startDate: '2026-03-10',
      endDate: '2026-03-21',
      retrocessionRate: 70,
      status: 'completed',
      notes: '',
      createdAt: '2026-02-20T10:00:00Z',
    },
    {
      id: 'r4',
      cabinetId: 'c2',
      startDate: '2026-05-05',
      endDate: '2026-05-16',
      retrocessionRate: 65,
      status: 'active',
      notes: 'En cours',
      createdAt: '2026-04-20T10:00:00Z',
    },
  ],
  acts: [
    { id: 'a1', replacementId: 'r1', cabinetId: 'c1', patientLastName: 'Bernard', patientFirstName: 'Lucie', date: '2026-01-07', actType: 'Consultation', fee: 30, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a2', replacementId: 'r1', cabinetId: 'c1', patientLastName: 'Moreau', patientFirstName: 'Paul', date: '2026-01-07', actType: 'Détartrage', fee: 58.90, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a3', replacementId: 'r1', cabinetId: 'c1', patientLastName: 'Simon', patientFirstName: 'Anne', date: '2026-01-08', actType: 'Extraction', fee: 75.24, paymentMethod: 'check', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a4', replacementId: 'r1', cabinetId: 'c1', patientLastName: 'Laurent', patientFirstName: 'Marc', date: '2026-01-09', actType: 'Couronne céramique', fee: 350, paymentMethod: 'virement', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a5', replacementId: 'r1', cabinetId: 'c1', patientLastName: 'Petit', patientFirstName: 'Claire', date: '2026-01-10', actType: 'Composite antérieur', fee: 120, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a6', replacementId: 'r1', cabinetId: 'c1', patientLastName: 'Durand', patientFirstName: 'Thomas', date: '2026-01-12', actType: 'Détartrage', fee: 58.90, paymentMethod: 'cash', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a7', replacementId: 'r1', cabinetId: 'c1', patientLastName: 'Garcia', patientFirstName: 'Marie', date: '2026-01-13', actType: 'Consultation', fee: 30, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a8', replacementId: 'r1', cabinetId: 'c1', patientLastName: 'Roux', patientFirstName: 'Pierre', date: '2026-01-14', actType: 'Inlay-Onlay', fee: 280, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a9', replacementId: 'r1', cabinetId: 'c1', patientLastName: 'Blanc', patientFirstName: 'Julie', date: '2026-01-15', actType: 'Extraction', fee: 75.24, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a10', replacementId: 'r1', cabinetId: 'c1', patientLastName: 'Henry', patientFirstName: 'Luc', date: '2026-01-16', actType: 'Composite postérieur', fee: 150, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a11', replacementId: 'r2', cabinetId: 'c2', patientLastName: 'Leroy', patientFirstName: 'Sophie', date: '2026-02-04', actType: 'Détartrage', fee: 58.90, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 65, notes: '' },
    { id: 'a12', replacementId: 'r2', cabinetId: 'c2', patientLastName: 'Morel', patientFirstName: 'Nicolas', date: '2026-02-05', actType: 'Couronne céramique', fee: 420, paymentMethod: 'virement', paymentStatus: 'paid', retrocessionRate: 65, notes: '' },
    { id: 'a13', replacementId: 'r2', cabinetId: 'c2', patientLastName: 'Adam', patientFirstName: 'Eva', date: '2026-02-06', actType: 'Consultation', fee: 30, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 65, notes: '' },
    { id: 'a14', replacementId: 'r2', cabinetId: 'c2', patientLastName: 'Girard', patientFirstName: 'Paul', date: '2026-02-07', actType: 'Implant', fee: 1200, paymentMethod: 'virement', paymentStatus: 'paid', retrocessionRate: 65, notes: '' },
    { id: 'a15', replacementId: 'r2', cabinetId: 'c2', patientLastName: 'Bonnet', patientFirstName: 'Laure', date: '2026-02-10', actType: 'Bridge 3 éléments', fee: 950, paymentMethod: 'virement', paymentStatus: 'paid', retrocessionRate: 65, notes: '' },
    { id: 'a16', replacementId: 'r2', cabinetId: 'c2', patientLastName: 'Francois', patientFirstName: 'Ines', date: '2026-02-11', actType: 'Extraction', fee: 75.24, paymentMethod: 'cash', paymentStatus: 'paid', retrocessionRate: 65, notes: '' },
    { id: 'a17', replacementId: 'r2', cabinetId: 'c2', patientLastName: 'Vincent', patientFirstName: 'Hugo', date: '2026-02-12', actType: 'Détartrage', fee: 58.90, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 65, notes: '' },
    { id: 'a18', replacementId: 'r3', cabinetId: 'c1', patientLastName: 'Lemaire', patientFirstName: 'Charlotte', date: '2026-03-10', actType: 'Couronne céramique', fee: 380, paymentMethod: 'virement', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a19', replacementId: 'r3', cabinetId: 'c1', patientLastName: 'Perrin', patientFirstName: 'Baptiste', date: '2026-03-11', actType: 'Composite antérieur', fee: 130, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a20', replacementId: 'r3', cabinetId: 'c1', patientLastName: 'Colin', patientFirstName: 'Emma', date: '2026-03-12', actType: 'Détartrage', fee: 58.90, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a21', replacementId: 'r3', cabinetId: 'c1', patientLastName: 'Mercier', patientFirstName: 'Leo', date: '2026-03-13', actType: 'Consultation', fee: 30, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a22', replacementId: 'r3', cabinetId: 'c1', patientLastName: 'Dubois', patientFirstName: 'Chloe', date: '2026-03-14', actType: 'Implant', fee: 1150, paymentMethod: 'virement', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a23', replacementId: 'r3', cabinetId: 'c1', patientLastName: 'Renard', patientFirstName: 'Mathieu', date: '2026-03-17', actType: 'Extraction', fee: 75.24, paymentMethod: 'cash', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a24', replacementId: 'r3', cabinetId: 'c1', patientLastName: 'Picard', patientFirstName: 'Laura', date: '2026-03-18', actType: 'Prothèse amovible', fee: 680, paymentMethod: 'virement', paymentStatus: 'paid', retrocessionRate: 70, notes: '' },
    { id: 'a25', replacementId: 'r4', cabinetId: 'c2', patientLastName: 'Muller', patientFirstName: 'Anna', date: '2026-05-05', actType: 'Consultation', fee: 30, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 65, notes: '' },
    { id: 'a26', replacementId: 'r4', cabinetId: 'c2', patientLastName: 'Lambert', patientFirstName: 'Jules', date: '2026-05-06', actType: 'Détartrage', fee: 58.90, paymentMethod: 'card', paymentStatus: 'paid', retrocessionRate: 65, notes: '' },
    { id: 'a27', replacementId: 'r4', cabinetId: 'c2', patientLastName: 'Fontaine', patientFirstName: 'Elsa', date: '2026-05-07', actType: 'Couronne céramique', fee: 400, paymentMethod: 'virement', paymentStatus: 'paid', retrocessionRate: 65, notes: '' },
    { id: 'a28', replacementId: 'r4', cabinetId: 'c2', patientLastName: 'Rousseau', patientFirstName: 'Victor', date: '2026-05-08', actType: 'Composite postérieur', fee: 160, paymentMethod: 'card', paymentStatus: 'pending', retrocessionRate: 65, notes: '' },
  ],
  settings: DEFAULT_SETTINGS,
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [data, setData] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setData(parsed)
        setIsAuthenticated(true)
      } catch {
        setData(DEMO_DATA)
      }
    }
  }, [])

  useEffect(() => {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data])

  const login = useCallback((email, password) => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.user.email === email) {
        setData(parsed)
        setIsAuthenticated(true)
        return true
      }
    }
    if (email && password) {
      setData(DEMO_DATA)
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const register = useCallback((userData) => {
    const newData = {
      ...DEMO_DATA,
      user: { id: generateId(), ...userData },
      acts: [],
      replacements: [],
      cabinets: [],
    }
    setData(newData)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    setCurrentPage('dashboard')
  }, [])

  // CABINETS
  const addCabinet = useCallback((cabinet) => {
    setData(prev => ({ ...prev, cabinets: [...prev.cabinets, { id: generateId(), ...cabinet }] }))
  }, [])
  const updateCabinet = useCallback((id, updates) => {
    setData(prev => ({ ...prev, cabinets: prev.cabinets.map(c => c.id === id ? { ...c, ...updates } : c) }))
  }, [])
  const deleteCabinet = useCallback((id) => {
    setData(prev => ({ ...prev, cabinets: prev.cabinets.filter(c => c.id !== id) }))
  }, [])

  // REPLACEMENTS
  const addReplacement = useCallback((replacement) => {
    setData(prev => ({ ...prev, replacements: [...prev.replacements, { id: generateId(), createdAt: new Date().toISOString(), ...replacement }] }))
  }, [])
  const updateReplacement = useCallback((id, updates) => {
    setData(prev => ({ ...prev, replacements: prev.replacements.map(r => r.id === id ? { ...r, ...updates } : r) }))
  }, [])
  const deleteReplacement = useCallback((id) => {
    setData(prev => ({ ...prev, replacements: prev.replacements.filter(r => r.id !== id) }))
  }, [])

  // ACTS
  const addAct = useCallback((act) => {
    setData(prev => ({ ...prev, acts: [...prev.acts, { id: generateId(), createdAt: new Date().toISOString(), ...act }] }))
  }, [])
  const updateAct = useCallback((id, updates) => {
    setData(prev => ({ ...prev, acts: prev.acts.map(a => a.id === id ? { ...a, ...updates } : a) }))
  }, [])
  const deleteAct = useCallback((id) => {
    setData(prev => ({ ...prev, acts: prev.acts.filter(a => a.id !== id) }))
  }, [])

  // SETTINGS
  const updateSettings = useCallback((updates) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }))
  }, [])

  const updateUser = useCallback((updates) => {
    setData(prev => ({ ...prev, user: { ...prev.user, ...updates } }))
  }, [])

  // COMPUTED STATS
  const getStats = useCallback(() => {
    if (!data) return {}
    const paidActs = data.acts.filter(a => a.paymentStatus === 'paid')
    const caBrut = paidActs.reduce((sum, a) => sum + a.fee, 0)
    const revenusEncaisses = paidActs.reduce((sum, a) => sum + (a.fee * a.retrocessionRate / 100), 0)
    const retrocessions = paidActs.reduce((sum, a) => sum + (a.fee * (100 - a.retrocessionRate) / 100), 0)
    const settings = data.settings
    const abattement = revenusEncaisses * settings.abattementRate / 100
    const revenuImposable = revenusEncaisses - abattement
    const urssaf = revenusEncaisses * settings.urssafRate / 100
    const carcdsf = (settings.carcdsf.cotisationForcelitaire + settings.carcdsf.prevoyance + settings.carcdsf.invaliditeDeces) + (revenusEncaisses * settings.carcdsf.cotisationProportionnelle / 100)
    const chargesTotal = urssaf + carcdsf
    const revenuNet = revenusEncaisses - chargesTotal
    const plafondPct = (revenusEncaisses / settings.microBncCeiling) * 100

    return {
      caBrut,
      revenusEncaisses,
      retrocessions,
      nbPatients: new Set(paidActs.map(a => `${a.patientLastName}-${a.patientFirstName}`)).size,
      nbActes: paidActs.length,
      abattement,
      revenuImposable,
      urssaf,
      carcdsf,
      chargesTotal,
      revenuNet,
      plafondPct: Math.min(plafondPct, 100),
      plafondRestant: Math.max(settings.microBncCeiling - revenusEncaisses, 0),
      moyenneParPatient: paidActs.length > 0 ? revenusEncaisses / Math.max(new Set(paidActs.map(a => `${a.patientLastName}-${a.patientFirstName}`)).size, 1) : 0,
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
      const revenus = acts.reduce((sum, a) => sum + (a.fee * a.retrocessionRate / 100), 0)
      return { ...cab, revenus, nbActes: acts.length, nbPatients: new Set(acts.map(a => `${a.patientLastName}-${a.patientFirstName}`)).size }
    })
  }, [data])

  const theme = data?.settings?.theme || 'light'

  return (
    <AppContext.Provider value={{
      isAuthenticated, login, register, logout,
      data, theme,
      currentPage, setCurrentPage,
      sidebarOpen, setSidebarOpen,
      addCabinet, updateCabinet, deleteCabinet,
      addReplacement, updateReplacement, deleteReplacement,
      addAct, updateAct, deleteAct,
      updateSettings, updateUser,
      getStats, getMonthlyData, getCabinetStats,
      generateId,
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
