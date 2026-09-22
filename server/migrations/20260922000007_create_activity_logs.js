/**
 * Unified activity log — replaces v1's separate maintenance_logs and
 * audit_logs tables. log_type differentiates audit / maintenance /
 * system / data entries; the relevant sub-type columns are only
 * populated for the matching log_type.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.string('log_type', 20).notNullable();

    table.string('audit_type', 30); // when log_type = 'audit'
    table.string('maintenance_type', 30); // when log_type = 'maintenance'
    table.string('maintenance_status', 20); // only relevant for maintenance logs
    table.string('action', 40); // when log_type = 'data' or 'system'

    // Who did it
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('user_email', 150); // snapshot
    table.string('user_role', 20); // snapshot

    // What entity was affected
    table.string('entity_type', 50);
    table.uuid('entity_id');

    // Maintenance scheduling
    table.date('scheduled_date');
    table.date('completed_date');
    table.string('performed_by', 150); // technician name or external vendor
    table.uuid('vendor_id').references('id').inTable('suppliers').onDelete('SET NULL');

    // Change diff
    table.jsonb('before_value');
    table.jsonb('after_value');

    // Maintenance cost
    table.decimal('cost', 10, 2);
    table.string('invoice_number', 100);
    table.date('next_maintenance_date'); // updates asset.next_maintenance_date on completion

    // Description / findings
    table.string('title', 255);
    table.text('description');
    table.text('findings');

    // Context
    table.string('ip_address', 45);
    table.text('user_agent');
    table.text('notes');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    // Append-only: no updated_at
  });

  await knex.schema.alterTable('activity_logs', (table) => {
    table.check(`log_type IN ('audit','maintenance','system','data')`, [], 'actlog_log_type_check');
    table.check(
      `audit_type IN ('health_audit','financial_audit','internal_audit','data_audit','stock_audit')`,
      [],
      'actlog_audit_type_check'
    );
    table.check(
      `maintenance_type IN ('repair','preventive','inspection','upgrade','calibration','installation')`,
      [],
      'actlog_maintenance_type_check'
    );
    table.check(
      `maintenance_status IN ('scheduled','in_progress','completed','cancelled')`,
      [],
      'actlog_maintenance_status_check'
    );
    table.check(
      `action IN ('CREATE','UPDATE','DELETE','RETIRE','ASSIGN','UNASSIGN',
                  'CHECKOUT_REQUEST','CHECKOUT_APPROVE','CHECKOUT_REJECT','CHECKIN',
                  'REALLOCATE_REQUEST','REALLOCATE_APPROVE','REALLOCATE_REJECT',
                  'STOCK_ADD','STOCK_ISSUE','STOCK_ADJUST',
                  'PROCUREMENT_RAISED','PROCUREMENT_APPROVED','PROCUREMENT_REJECTED',
                  'PROCUREMENT_ORDERED','PROCUREMENT_RECEIVED',
                  'LOGIN','LOGOUT','LOGIN_FAILED','SETTINGS_CHANGE','EXPORT')`,
      [],
      'actlog_action_check'
    );

    table.index('log_type', 'idx_actlog_log_type');
    table.index('audit_type', 'idx_actlog_audit_type');
    table.index('action', 'idx_actlog_action');
    table.index(['entity_type', 'entity_id'], 'idx_actlog_entity');
    table.index('user_id', 'idx_actlog_user');
  });

  await knex.raw('CREATE INDEX idx_actlog_created ON activity_logs(created_at DESC)');
  await knex.raw(
    `CREATE INDEX idx_actlog_maint_sched ON activity_logs(scheduled_date) WHERE log_type = 'maintenance'`
  );

  // Convenience views
  await knex.raw(`CREATE VIEW maintenance_log AS SELECT * FROM activity_logs WHERE log_type = 'maintenance'`);
  await knex.raw(
    `CREATE VIEW audit_log AS SELECT * FROM activity_logs WHERE log_type IN ('audit','data','system')`
  );
};

exports.down = async function (knex) {
  await knex.raw('DROP VIEW IF EXISTS audit_log');
  await knex.raw('DROP VIEW IF EXISTS maintenance_log');
  await knex.schema.dropTableIfExists('activity_logs');
};
