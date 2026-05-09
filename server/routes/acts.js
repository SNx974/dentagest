const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

function fmt(r) {
  return {
    id: r.id,
    replacementId: r.replacement_id,
    cabinetId: r.cabinet_id,
    patientLastName: r.patient_last_name,
    patientFirstName: r.patient_first_name,
    date: r.date ? r.date.toISOString().split('T')[0] : null,
    actType: r.act_type,
    fee: parseFloat(r.fee),
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    retrocessionRate: parseFloat(r.retrocession_rate),
    notes: r.notes,
    createdAt: r.created_at,
  }
}

// GET /api/acts
router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM acts WHERE user_id=$1 ORDER BY date DESC, created_at DESC',
    [req.userId]
  )
  res.json(rows.map(fmt))
})

// POST /api/acts
router.post('/', auth, async (req, res) => {
  const { replacementId, cabinetId, patientLastName, patientFirstName, date, actType, fee, paymentMethod, paymentStatus, retrocessionRate, notes } = req.body
  if (!patientLastName || !fee || !date) return res.status(400).json({ error: 'Champs requis manquants' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO acts (user_id,replacement_id,cabinet_id,patient_last_name,patient_first_name,date,act_type,fee,payment_method,payment_status,retrocession_rate,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.userId, replacementId||null, cabinetId||null, patientLastName, patientFirstName||'', date, actType||'Consultation', fee, paymentMethod||'card', paymentStatus||'paid', retrocessionRate||70, notes||'']
    )
    res.status(201).json(fmt(rows[0]))
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/acts/:id
router.put('/:id', auth, async (req, res) => {
  const { replacementId, cabinetId, patientLastName, patientFirstName, date, actType, fee, paymentMethod, paymentStatus, retrocessionRate, notes } = req.body
  const { rows } = await pool.query(
    `UPDATE acts SET replacement_id=$1,cabinet_id=$2,patient_last_name=$3,patient_first_name=$4,date=$5,act_type=$6,fee=$7,payment_method=$8,payment_status=$9,retrocession_rate=$10,notes=$11
     WHERE id=$12 AND user_id=$13 RETURNING *`,
    [replacementId||null, cabinetId||null, patientLastName, patientFirstName||'', date, actType||'Consultation', fee, paymentMethod||'card', paymentStatus||'paid', retrocessionRate||70, notes||'', req.params.id, req.userId]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Acte introuvable' })
  res.json(fmt(rows[0]))
})

// DELETE /api/acts/:id
router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM acts WHERE id=$1 AND user_id=$2', [req.params.id, req.userId])
  res.json({ ok: true })
})

module.exports = router
