exports.up = async function (knex) {
  // ── Notifications ────────────────────────────────────────────────────
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE'); // NULL = all admins
    table.string('type', 40).notNullable();
    table.check(
      `type IN ('low_stock','warranty_expiry','maintenance_due','overdue_return',
                'assignment_request','assignment_approved','assignment_rejected',
                'reallocation_request','reallocation_approved','reallocation_rejected',
                'procurement_submitted','procurement_approved','procurement_rejected',
                'procurement_ordered','procurement_received',
                'audit_scheduled','system')`,
      [],
      'notifications_type_check'
    );
    table.string('title', 200).notNullable();
    table.text('message').notNullable();
    table.string('entity_type', 50);
    table.uuid('entity_id');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('notifications', (table) => {
    table.index('user_id', 'idx_notif_user');
    table.index(['user_id', 'is_read'], 'idx_notif_is_read');
  });

  await knex.raw('CREATE INDEX idx_notif_created ON notifications(created_at DESC)');

  // ── System settings ──────────────────────────────────────────────────
  await knex.schema.createTable('system_settings', (table) => {
    table.string('key', 100).primary();
    table.text('value');
    table.string('type', 20).notNullable().defaultTo('string');
    table.text('description');
    table.boolean('is_secret').notNullable().defaultTo(false);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
  });

  // ── Refresh tokens ───────────────────────────────────────────────────
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').notNullable().defaultTo(false);
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('refresh_tokens', (table) => {
    table.index('user_id', 'idx_refresh_user');
    table.index('expires_at', 'idx_refresh_expires');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('system_settings');
  await knex.schema.dropTableIfExists('notifications');
};
