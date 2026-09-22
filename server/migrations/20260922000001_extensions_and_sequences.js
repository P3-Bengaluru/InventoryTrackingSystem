/**
 * Enables required Postgres extensions and creates the sequential
 * asset-number sequence (ITS-000001, ITS-000002, ...).
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "unaccent"');
  await knex.raw('CREATE SEQUENCE IF NOT EXISTS asset_number_seq START 1 INCREMENT 1 NO CYCLE');
};

exports.down = async function (knex) {
  await knex.raw('DROP SEQUENCE IF EXISTS asset_number_seq');
  // Extensions are left in place intentionally — other objects/DBs on the
  // same cluster may depend on them. Drop manually if truly unused:
  // await knex.raw('DROP EXTENSION IF EXISTS "unaccent"');
  // await knex.raw('DROP EXTENSION IF EXISTS "pgcrypto"');
};
