exports.up = function(knex) {
  return knex.schema.createTable('locations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 150).notNullable();
    table.string('building', 100);
    table.string('floor', 50);
    table.string('room', 100);
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('locations');
};