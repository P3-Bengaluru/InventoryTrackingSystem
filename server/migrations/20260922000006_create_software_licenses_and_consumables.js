exports.up = async function (knex) {
  // ── Software licenses ───────────────────────────────────────────────
  await knex.schema.createTable('software_licenses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('software_name', 150).notNullable();
    table.string('version', 50);
    table.string('license_key', 500); // encrypted at application layer
    table.string('license_type', 20).notNullable().defaultTo('subscription');
    table.check(
      `license_type IN ('perpetual','subscription','oem','open_source','trial')`,
      [],
      'software_licenses_type_check'
    );
    table.integer('total_seats'); // NULL = unlimited
    table.integer('used_seats').notNullable().defaultTo(0);
    table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.uuid('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL');
    table.date('purchase_date');
    table.date('expiry_date');
    table.decimal('cost', 10, 2);
    table.string('invoice_number', 100);
    table.string('status', 20).notNullable().defaultTo('active');
    table.check(`status IN ('active','expired','cancelled')`, [], 'software_licenses_status_check');
    table.text('notes');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('software_licenses', (table) => {
    table.index('expiry_date', 'idx_licenses_expiry');
    table.index('status', 'idx_licenses_status');
  });

  // ── Consumables ──────────────────────────────────────────────────────
  await knex.schema.createTable('consumables', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('sku', 80).notNullable().unique();
    table.string('name', 150).notNullable();
    table.text('description');
    table.uuid('category_id').notNullable().references('id').inTable('categories').onDelete('RESTRICT');
    table.uuid('location_id').references('id').inTable('locations').onDelete('SET NULL');
    table.uuid('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL');

    // Stock figures (both maintained atomically on every transaction)
    table.integer('quantity').notNullable().defaultTo(0); // CURRENT IN-STOCK
    table.integer('consumed_total').notNullable().defaultTo(0); // LIFETIME CONSUMED
    table.integer('total_received').notNullable().defaultTo(0); // LIFETIME RECEIVED

    table.integer('min_threshold').notNullable().defaultTo(5);
    table.integer('reorder_quantity');
    table.string('unit', 50).notNullable().defaultTo('pcs');
    table.decimal('unit_cost', 10, 2);
    table.date('expiry_date');
    table.string('photo_url', 500);
    table.text('notes');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('consumables', (table) => {
    table.index('category_id', 'idx_consumables_category');
    table.index('location_id', 'idx_consumables_location');
    table.index('quantity', 'idx_consumables_quantity');
  });

  // Computed view: always shows both stock figures clearly
  await knex.raw(`
    CREATE VIEW consumable_stock_summary AS
    SELECT
        c.id,
        c.sku,
        c.name,
        c.unit,
        c.quantity            AS in_stock,
        c.consumed_total      AS total_consumed,
        c.total_received,
        c.min_threshold,
        CASE WHEN c.quantity <= c.min_threshold THEN TRUE ELSE FALSE END AS is_low_stock,
        cat.name              AS category_name,
        l.full_path           AS location
    FROM consumables c
    LEFT JOIN categories     cat ON c.category_id = cat.id
    LEFT JOIN location_full_path l ON c.location_id = l.id
    WHERE c.is_active = TRUE
  `);

  // ── Stock transactions (append-only ledger, kept separate for audit integrity) ──
  await knex.schema.createTable('stock_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('consumable_id').notNullable().references('id').inTable('consumables').onDelete('RESTRICT');
    table.string('type', 20).notNullable();
    table.check(`type IN ('add','issue','adjustment','return','disposal')`, [], 'stock_txn_type_check');
    table.integer('quantity').notNullable();
    table.integer('quantity_before').notNullable();
    table.integer('quantity_after').notNullable();
    table.uuid('transacted_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.string('recipient', 150); // for 'issue' type: who received it
    table.uuid('recipient_user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('department', 100);
    table.string('invoice_number', 100);
    table.decimal('unit_cost_at_time', 10, 2);
    table.uuid('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL');
    table.text('notes');
    table.timestamp('transacted_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('stock_transactions', (table) => {
    table.index('consumable_id', 'idx_stock_txn_consumable');
    table.index('type', 'idx_stock_txn_type');
    table.index('transacted_at', 'idx_stock_txn_date');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('stock_transactions');
  await knex.raw('DROP VIEW IF EXISTS consumable_stock_summary');
  await knex.schema.dropTableIfExists('consumables');
  await knex.schema.dropTableIfExists('software_licenses');
};
