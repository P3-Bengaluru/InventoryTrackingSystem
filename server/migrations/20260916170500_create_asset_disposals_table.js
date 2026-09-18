exports.up = function(knex) {
  return knex.schema.createTable('asset_disposals', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('asset_id').notNullable();
    table.uuid('disposed_by').notNullable();
    table.date('disposal_date').notNullable();
    table.string('disposal_method', 100);
    table.text('reason');
    table.uuid('approved_by').nullable();
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('asset_id').references('assets.id');
    table.foreign('disposed_by').references('users.id');
    table.foreign('approved_by').references('users.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('asset_disposals');
};