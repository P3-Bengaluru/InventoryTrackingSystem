exports.up = function(knex) {
  // Create the uuid-ossp extension if it doesn't exist
  return knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .then(() => {
      return knex.schema.createTable('refresh_tokens', function(table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('token_hash', 255).notNullable().unique();
        table.timestamp('expires_at').notNullable();
        table.boolean('is_revoked').defaultTo(false);
        table.string('ip_address');
        table.string('user_agent');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.uuid('created_by').references('id').inTable('users');
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.uuid('updated_by').references('id').inTable('users');
        table.boolean('is_active').defaultTo(true);
        
        // Indexes for performance
        table.index(['user_id']);
        table.index(['token_hash']);
        table.index(['expires_at']);
        table.index(['is_revoked']);
        table.index(['is_active']);
      });
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('refresh_tokens');
};
