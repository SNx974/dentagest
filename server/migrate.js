const pool = require('./db')

const SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        UNIQUE NOT NULL,
  password_hash TEXT      NOT NULL,
  first_name  TEXT        NOT NULL DEFAULT '',
  last_name   TEXT        NOT NULL DEFAULT '',
  rpps        TEXT        NOT NULL DEFAULT '',
  settings    JSONB       NOT NULL DEFAULT '{
    "microBncCeiling": 77700,
    "urssafRate": 23.2,
    "abattementRate": 34,
    "csgCrdsRate": 9.7,
    "carcdsf": {
      "cotisationForcelitaire": 1015,
      "cotisationProportionnelle": 8.7,
      "prevoyance": 891,
      "invaliditeDeces": 151
    },
    "revenueGoal": 60000,
    "defaultRetrocessionRate": 70,
    "theme": "light"
  }',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cabinets (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                      TEXT        NOT NULL,
  titulaire_first_name      TEXT        NOT NULL DEFAULT '',
  titulaire_last_name       TEXT        NOT NULL DEFAULT '',
  address                   TEXT        NOT NULL DEFAULT '',
  city                      TEXT        NOT NULL DEFAULT '',
  phone                     TEXT        NOT NULL DEFAULT '',
  email                     TEXT        NOT NULL DEFAULT '',
  default_retrocession_rate NUMERIC(5,2) NOT NULL DEFAULT 70,
  color                     TEXT        NOT NULL DEFAULT '#1565C0',
  notes                     TEXT        NOT NULL DEFAULT '',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replacements (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cabinet_id       UUID        REFERENCES cabinets(id) ON DELETE SET NULL,
  start_date       DATE        NOT NULL,
  end_date         DATE,
  retrocession_rate NUMERIC(5,2) NOT NULL DEFAULT 70,
  status           TEXT        NOT NULL DEFAULT 'planned',
  notes            TEXT        NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS acts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  replacement_id   UUID        REFERENCES replacements(id) ON DELETE SET NULL,
  cabinet_id       UUID        REFERENCES cabinets(id) ON DELETE SET NULL,
  patient_last_name  TEXT      NOT NULL,
  patient_first_name TEXT      NOT NULL DEFAULT '',
  date             DATE        NOT NULL,
  act_type         TEXT        NOT NULL DEFAULT 'Consultation',
  fee              NUMERIC(10,2) NOT NULL,
  payment_method   TEXT        NOT NULL DEFAULT 'card',
  payment_status   TEXT        NOT NULL DEFAULT 'paid',
  retrocession_rate NUMERIC(5,2) NOT NULL DEFAULT 70,
  notes            TEXT        NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cabinets_user     ON cabinets(user_id);
CREATE INDEX IF NOT EXISTS idx_replacements_user ON replacements(user_id);
CREATE INDEX IF NOT EXISTS idx_acts_user         ON acts(user_id);
CREATE INDEX IF NOT EXISTS idx_acts_date         ON acts(user_id, date DESC);
`

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(SQL)
    console.log('✅ Migrations OK')
  } finally {
    client.release()
  }
}

module.exports = migrate
