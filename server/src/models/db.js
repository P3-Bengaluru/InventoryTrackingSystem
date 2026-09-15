const knex = require('knex');
require('dotenv').config();

const config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'inventory_db',
    user: process.env.DB_USER || 'its_user',
    password: process.env.DB_PASSWORD || 'change_me',
  },
  pool: { min: 2, max: 10 },
  migrations: {
    directory: '../migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: '../seeds',
  },
};

const db = knex(config);

async function checkConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('[DB] Connection established');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { db, checkConnection };
