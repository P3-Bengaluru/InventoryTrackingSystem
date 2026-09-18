exports.up = function(knex) {
  return knex.schema.createTable('customers', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 150).notNullable().unique();
    table.string('customer_code', 50).unique();
    table.string('contact_person', 150);
    table.string('email', 150);
    table.string('phone', 30);
    table.text('address');
    table.string('city', 100);
    table.text('notes');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('customers');
};