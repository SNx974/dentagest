const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

function fmt(r) {
  return {
    id: r.id,
    name: r.name,
    titulaireFirstName: r.titulaire_first_name,
    titulaireLastName: r.titulaire_last_name,
    address: r.address,
    city: r.city,
    phone: r.phone,
    email: r.email,
    defaultRetrocessionRate: parseFloat(r.default_retrocession_rate),
    color: r.color,
    notes: r.notes,
  }
}

// GET /api/cabinets
router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM cabinets WHERE user_id=$1 ORDER BY created_at',
    [req.userId]
  )
  res.json(rows.map(fmt))
})

// POST /api/cabinets
router.post('/', auth, async (req, res) => {
  const { name, titulaireFirstName, titulaireLastName, address, city, phone, email, defaultRetrocessionRate, color, notes } = req.body
  try {
    const { rows } = await pool.query(
      `INSERT INTO cabinets (user_id,name,titulaire_first_name,titulaire_last_name,address,city,phone,email,default_retrocession_rate,color,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.userId, name, titulaireFirstName||'', titulaireLastName||'', address||'', city||'', phone||'', email||'', defaultRetrocessionRate||70, color||'#1565C0', notes||'']
    )
    res.status(201).json(fmt(rows[0]))
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/cabinets/:id
router.put('/:id', auth, async (req, res) => {
  const { name, titulaireFirstName, titulaireLastName, address, city, phone, email, defaultRetrocessionRate, color, notes } = req.body
  const { rows } = await pool.query(
    `UPDATE cabinets SET name=$1,titulaire_first_name=$2,titulaire_last_name=$3,address=$4,city=$5,phone=$6,email=$7,default_retrocession_rate=$8,color=$9,notes=$10
     WHERE id=$11 AND user_id=$12 RETURNING *`,
    [name, titulaireFirstName||'', titulaireLastName||'', address||'', city||'', phone||'', email||'', defaultRetrocessionRate||70, color||'#1565C0', notes||'', req.params.id, req.userId]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Cabinet introuvable' })
  res.json(fmt(rows[0]))
})

// DELETE /api/cabinets/:id
router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM cabinets WHERE id=$1 AND user_id=$2', [req.params.id, req.userId])
  res.json({ ok: true })
})

module.exports = router
