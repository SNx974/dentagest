const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

function fmt(r) {
  return {
    id: r.id,
    cabinetId: r.cabinet_id,
    startDate: r.start_date ? r.start_date.toISOString().split('T')[0] : null,
    endDate: r.end_date ? r.end_date.toISOString().split('T')[0] : null,
    retrocessionRate: parseFloat(r.retrocession_rate),
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
  }
}

// GET /api/replacements
router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM replacements WHERE user_id=$1 ORDER BY start_date DESC',
    [req.userId]
  )
  res.json(rows.map(fmt))
})

// POST /api/replacements
router.post('/', auth, async (req, res) => {
  const { cabinetId, startDate, endDate, retrocessionRate, status, notes } = req.body
  try {
    const { rows } = await pool.query(
      `INSERT INTO replacements (user_id,cabinet_id,start_date,end_date,retrocession_rate,status,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.userId, cabinetId||null, startDate, endDate||null, retrocessionRate||70, status||'planned', notes||'']
    )
    res.status(201).json(fmt(rows[0]))
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/replacements/:id
router.put('/:id', auth, async (req, res) => {
  const { cabinetId, startDate, endDate, retrocessionRate, status, notes } = req.body
  const { rows } = await pool.query(
    `UPDATE replacements SET cabinet_id=$1,start_date=$2,end_date=$3,retrocession_rate=$4,status=$5,notes=$6
     WHERE id=$7 AND user_id=$8 RETURNING *`,
    [cabinetId||null, startDate, endDate||null, retrocessionRate||70, status||'planned', notes||'', req.params.id, req.userId]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Remplacement introuvable' })
  res.json(fmt(rows[0]))
})

// DELETE /api/replacements/:id
router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM replacements WHERE id=$1 AND user_id=$2', [req.params.id, req.userId])
  res.json({ ok: true })
})

module.exports = router
