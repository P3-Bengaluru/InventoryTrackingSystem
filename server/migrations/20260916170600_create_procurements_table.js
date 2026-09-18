exports.up = function(knex) {
  return knex.schema.createTable('procurements', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('procurement_number', 50).notNullable().unique();
    table.uuid('supplier_id').nullable();
    table.uuid('requested_by').notNullable();
    table.uuid('approved_by').nullable();
    table.date('procurement_date');
    table.date('expected_delivery_date');
    table.string('status', 30);
    table.check("status IN ('draft', 'requested', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')");
    table.decimal('total_amount', 12, 2);
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('supplier_id').references('suppliers.id');
    table.foreign('requested_by').references('users.id');
    table.foreign('approved_by').references('users.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('procurements');
};