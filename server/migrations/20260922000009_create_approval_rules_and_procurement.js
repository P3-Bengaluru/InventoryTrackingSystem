exports.up = async function (knex) {
  // ── Approval rules (budget-based hierarchy) ─────────────────────────
  await knex.schema.createTable('approval_rules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.decimal('min_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('max_amount', 12, 2); // NULL = no upper limit
    table.string('approver_role', 30).notNullable(); // role that must approve at this tier
    table.smallint('approver_level').notNullable(); // 1 = first approver, 2 = second, etc.
    table.text('description');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // ── Procurement requests (full workflow) ────────────────────────────
  await knex.schema.createTable('procurement_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('requested_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('department', 100);
    table.string('project', 150);
    table.uuid('location_id').references('id').inTable('locations').onDelete('SET NULL');

    table.string('request_type', 20).notNullable();
    table.check(
      `request_type IN ('existing_asset','new_purchase')`,
      [],
      'procurement_request_type_check'
    );

    // Asset search criteria (what the user described)
    table.string('item_name', 150).notNullable();
    table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.jsonb('specifications'); // { "ram":"16GB", "os":"Windows 11" }
    table.integer('quantity').notNullable().defaultTo(1);
    table.text('justification').notNullable();

    // Estimated / quoted cost
    table.decimal('estimated_cost', 12, 2);
    table.decimal('quoted_cost', 12, 2); // filled in by inventory manager
    table.string('currency', 5).notNullable().defaultTo('INR');

    // Inventory match (filled by system on search)
    table.uuid('matched_asset_id').references('id').inTable('assets').onDelete('SET NULL');
    table.text('matched_notes'); // e.g. "Found ITS-000042, currently with John"

    // Workflow status
    table.string('status', 30).notNullable().defaultTo('draft');
    table.check(
      `status IN ('draft','submitted','inventory_check','pending_approval','self_approved',
                  'approved','rejected','ordered','received','cancelled')`,
      [],
      'procurement_status_check'
    );

    table.string('priority', 10).notNullable().defaultTo('normal');
    table.check(`priority IN ('low','normal','high','critical')`, [], 'procurement_priority_check');

    // Supplier (for new purchase)
    table.uuid('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL');
    table.string('supplier_quote_url', 500); // link to quote document
    table.string('po_number', 100); // Purchase Order number
    table.date('expected_delivery');
    table.date('actual_delivery');

    // Created asset on receipt
    table.uuid('asset_id_created').references('id').inTable('assets').onDelete('SET NULL');

    table.text('notes');
    table.text('rejection_reason');

    table.timestamp('submitted_at');
    table.timestamp('approved_at');
    table.timestamp('ordered_at');
    table.timestamp('received_at');

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('procurement_requests', (table) => {
    table.index('requested_by', 'idx_proc_requested_by');
    table.index('status', 'idx_proc_status');
    table.index('category_id', 'idx_proc_category');
    table.index('matched_asset_id', 'idx_proc_matched_asset');
  });

  await knex.raw('CREATE INDEX idx_proc_created ON procurement_requests(created_at DESC)');

  // ── Procurement approvals (one row per approver per request) ────────
  await knex.schema.createTable('procurement_approvals', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('procurement_id')
      .notNullable()
      .references('id')
      .inTable('procurement_requests')
      .onDelete('CASCADE');
    table.uuid('approver_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('approver_role', 30).notNullable(); // snapshot
    table.smallint('level').notNullable(); // approval order: 1, 2, 3 ...
    table.string('status', 20).notNullable().defaultTo('pending');
    table.check(
      `status IN ('pending','approved','rejected','skipped')`,
      [],
      'procurement_approvals_status_check'
    );
    table.text('comments');
    table.timestamp('actioned_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('procurement_approvals', (table) => {
    table.index('procurement_id', 'idx_proc_approvals_procurement');
    table.index('approver_id', 'idx_proc_approvals_approver');
    table.index('status', 'idx_proc_approvals_status');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('procurement_approvals');
  await knex.schema.dropTableIfExists('procurement_requests');
  await knex.schema.dropTableIfExists('approval_rules');
};
