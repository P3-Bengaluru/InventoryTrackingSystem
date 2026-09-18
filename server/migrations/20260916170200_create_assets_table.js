exports.up = function(knex) {
  return knex.schema.createTable('assets', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('asset_number', 20).notNullable().unique();
    table.uuid('qr_token').notNullable().unique();
    table.uuid('category_id').notNullable();
    table.uuid('location_id').nullable();
    table.uuid('assigned_to').nullable();
    table.uuid('customer_id').nullable();
    table.string('customer_reference', 100);
    table.date('received_from_customer_date');
    table.string('name', 200).notNullable();
    table.text('description');
    table.string('manufacturer', 150);
    table.string('model', 150);
    table.string('serial_number', 150).unique();
    table.date('purchase_date');
    table.decimal('purchase_price', 12, 2);
    table.date('warranty_start_date');
    table.date('warranty_end_date');
    table.string('status', 30).notNullable();
    table.check("status IN ('available', 'assigned', 'maintenance', 'lost', 'retired', 'disposed')");
    table.string('condition', 30);
    table.check("condition IN ('new', 'good', 'fair', 'poor', 'damaged')");
    table.text('notes');
    table.uuid('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('category_id').references('categories.id');
    table.foreign('location_id').references('locations.id');
    table.foreign('assigned_to').references('users.id');
    table.foreign('customer_id').references('customers.id');
    table.foreign('created_by').references('users.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('assets');
};