const router = require('express').Router()
const pool = require('../db')
const auth = require('../middleware/auth')

// GET /api/user
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, first_name, last_name, rpps, settings FROM users WHERE id = $1',
      [req.userId]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' })
    const u = rows[0]
    res.json({ id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, rpps: u.rpps, settings: u.settings })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/user
router.put('/', auth, async (req, res) => {
  const { firstName, lastName, rpps, email } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE users SET first_name=$1, last_name=$2, rpps=$3, email=$4
       WHERE id=$5 RETURNING id, email, first_name, last_name, rpps, settings`,
      [firstName || '', lastName || '', rpps || '', email || '', req.userId]
    )
    const u = rows[0]
    res.json({ id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name, rpps: u.rpps, settings: u.settings })
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/user/settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET settings = settings || $1::jsonb WHERE id = $2
       RETURNING settings`,
      [JSON.stringify(req.body), req.userId]
    )
    res.json(rows[0].settings)
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
