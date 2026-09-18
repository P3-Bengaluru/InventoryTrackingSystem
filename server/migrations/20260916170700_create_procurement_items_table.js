exports.up = function(knex) {
  return knex.schema.createTable('procurement_items', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('procurement_id').notNullable();
    table.uuid('category_id').notNullable();
    table.text('description');
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 12, 2);
    table.integer('received_quantity').notNullable().defaultTo(0);
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('procurement_id').references('procurements.id');
    table.foreign('category_id').references('categories.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('procurement_items');
};