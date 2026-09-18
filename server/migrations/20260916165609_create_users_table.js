exports.up = function(knex) {
  // Create the uuid-ossp extension if it doesn't exist
  return knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .then(() => {
      return knex.schema.createTable('users', function(table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('employee_id', 50).unique();
        table.string('name', 150).notNullable();
        table.string('email', 150).notNullable().unique();
        table.string('phone', 30);
        table.string('password_hash', 255).notNullable();
        table.string('role', 30).notNullable();
        table.check("role IN ('admin', 'inventory_manager', 'staff', 'auditor')");
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};