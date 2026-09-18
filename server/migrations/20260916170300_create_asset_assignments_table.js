exports.up = function(knex) {
  return knex.schema.createTable('asset_assignments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('asset_id').notNullable();
    table.uuid('user_id').notNullable();
    table.uuid('assigned_by').notNullable();
    table.timestamp('assigned_at').notNullable();
    table.timestamp('returned_at').nullable();
    table.string('return_condition', 30);
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('asset_id').references('assets.id');
    table.foreign('user_id').references('users.id');
    table.foreign('assigned_by').references('users.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('asset_assignments');
};