exports.up = async function (knex) {
  // ── Assignments (checkout / check-in) ────────────────────────────────
  await knex.schema.createTable('assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('asset_id').notNullable().references('id').inTable('assets').onDelete('RESTRICT');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('status', 20).notNullable().defaultTo('pending');
    table.check(
      `status IN ('pending','assigned','rejected','returned','overdue')`,
      [],
      'assignments_status_check'
    );
    table.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('approved_at');
    table.timestamp('rejected_at');
    table.date('assigned_since');
    table.date('expected_return'); // optional
    table.timestamp('returned_at'); // optional
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('request_reason');
    table.text('rejection_reason');
    table.text('return_notes');
    table.string('return_condition', 20);
    table.check(`return_condition IN ('good','damaged','lost')`, [], 'assignments_condition_check');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('assignments', (table) => {
    table.index('asset_id', 'idx_assignments_asset');
    table.index('user_id', 'idx_assignments_user');
    table.index('status', 'idx_assignments_status');
  });

  // ── Reallocations (transfer of an already-assigned asset) ───────────
  await knex.schema.createTable('reallocations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('asset_id').notNullable().references('id').inTable('assets').onDelete('RESTRICT');
    table.uuid('from_user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('to_user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');

    table.string('status', 20).notNullable().defaultTo('pending');
    table.check(`status IN ('pending','approved','rejected','completed')`, [], 'reallocations_status_check');

    table.uuid('requested_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL'); // project manager
    table.string('approver_role', 20); // snapshot of approver's role

    table.text('reason');
    table.text('rejection_reason');
    table.text('notes');

    table.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('approved_at');
    table.timestamp('completed_at');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('reallocations', (table) => {
    table.index('asset_id', 'idx_reallocations_asset');
    table.index('from_user_id', 'idx_reallocations_from');
    table.index('to_user_id', 'idx_reallocations_to');
    table.index('status', 'idx_reallocations_status');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('reallocations');
  await knex.schema.dropTableIfExists('assignments');
};
