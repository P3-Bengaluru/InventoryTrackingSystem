exports.up = function(knex) {
  return knex.schema.createTable('system_settings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('setting_key', 100).notNullable().unique();
    table.text('setting_value');
    table.text('description');
    table.uuid('updated_by').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('updated_by').references('users.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('system_settings');
};