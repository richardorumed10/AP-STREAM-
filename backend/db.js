const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL && process.env.DATABASE_URL.trim() ? process.env.DATABASE_URL : undefined,
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'apstream',
  user: process.env.PGUSER || 'u0_a221',
  password: process.env.PGPASSWORD || undefined,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
});

module.exports = pool;
