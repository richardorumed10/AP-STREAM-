const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'apstream',
  user: 'u0_a221'
});

module.exports = pool;
