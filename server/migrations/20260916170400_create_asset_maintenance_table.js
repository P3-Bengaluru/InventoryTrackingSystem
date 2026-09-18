exports.up = function(knex) {
  return knex.schema.createTable('asset_maintenance', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('asset_id').notNullable();
    table.uuid('reported_by').nullable();
    table.string('maintenance_type', 50);
    table.text('description').notNullable();
    table.string('service_provider', 150);
    table.decimal('cost', 12, 2);
    table.timestamp('started_at').nullable();
    table.timestamp('completed_at').nullable();
    table.string('status', 30);
    table.check("status IN ('open', 'in_progress', 'completed', 'cancelled')");
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('asset_id').references('assets.id');
    table.foreign('reported_by').references('users.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('asset_maintenance');
};