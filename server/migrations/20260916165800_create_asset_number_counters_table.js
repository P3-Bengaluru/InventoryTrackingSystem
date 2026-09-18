exports.up = function(knex) {
  return knex.schema.createTable('asset_number_counters', function(table) {
    table.string('prefix', 10).primary();
    table.integer('next_number').notNullable().defaultTo(1);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('asset_number_counters');
};