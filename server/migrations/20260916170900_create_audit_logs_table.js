exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').nullable();
    table.string('action', 50).notNullable();
    table.string('entity_type', 50).notNullable();
    table.uuid('entity_id').nullable();
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};