exports.up = async function (knex) {
  await knex.schema.createTable('assets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Sequential human-readable number, e.g. ITS-000001
    table
      .string('asset_number', 20)
      .notNullable()
      .unique()
      .defaultTo(knex.raw(`'ITS-' || LPAD(nextval('asset_number_seq')::TEXT, 6, '0')`));

    table.string('name', 150).notNullable();
    table.string('asset_tag', 50).unique(); // physical barcode/label
    table.string('serial_number', 100).unique();

    table.string('brand', 100);
    table.string('model', 100);
    table.jsonb('specifications'); // flexible: { "ram":"16GB", "cpu":"i7" }

    // Classification
    table.uuid('category_id').notNullable().references('id').inTable('categories').onDelete('RESTRICT');
    table.uuid('location_id').references('id').inTable('locations').onDelete('SET NULL');
    table.uuid('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL');

    // Purchase
    table.date('purchase_date');
    table.decimal('purchase_price', 12, 2);
    table.string('invoice_number', 100);
    table.date('warranty_expiry');
    table.text('warranty_terms');

    // Status: 'assigned' replaces v1's 'allocated'
    table.string('status', 20).notNullable().defaultTo('available');
    table.check(
      `status IN ('available','assigned','maintenance','retired','lost','disposed','in_transit')`,
      [],
      'assets_status_check'
    );

    // Current assignment (denormalised for speed; assignments table is source of truth)
    table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.date('assigned_since');
    table.boolean('return_required').notNullable().defaultTo(false); // return is NOT mandatory

    // Maintenance scheduling
    table.date('next_maintenance_date');
    table.integer('maintenance_interval_days');

    // QR public token (for read-only public link, no login)
    table
      .string('qr_token', 64)
      .unique()
      .defaultTo(knex.raw(`encode(gen_random_bytes(32), 'hex')`));

    table.string('photo_url', 500);
    table.text('notes');
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('assets', (table) => {
    table.index('status', 'idx_assets_status');
    table.index('category_id', 'idx_assets_category');
    table.index('location_id', 'idx_assets_location');
    table.index('assigned_to', 'idx_assets_assigned_to');
    table.index('warranty_expiry', 'idx_assets_warranty');
    table.index('next_maintenance_date', 'idx_assets_maintenance');
    table.index('qr_token', 'idx_assets_qr_token');
  });

  await knex.raw(`
    CREATE INDEX idx_assets_fts ON assets
        USING GIN (to_tsvector('english',
            name || ' ' ||
            COALESCE(serial_number,'') || ' ' ||
            COALESCE(asset_tag,'') || ' ' ||
            asset_number))
  `);

  // ── Asset attachments (photos, invoices, manuals, etc.) ─────────────
  await knex.schema.createTable('asset_attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('asset_id').notNullable().references('id').inTable('assets').onDelete('CASCADE');
    table.string('file_name', 255).notNullable();
    table.string('file_url', 500).notNullable();
    table.string('file_type', 100);
    table.integer('file_size_bytes');
    table.string('attachment_type', 20).notNullable().defaultTo('other');
    table.check(
      `attachment_type IN ('photo','invoice','warranty_card','manual','other')`,
      [],
      'asset_attachments_type_check'
    );
    table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('asset_attachments', (table) => {
    table.index('asset_id', 'idx_attachments_asset');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('asset_attachments');
  await knex.raw('DROP INDEX IF EXISTS idx_assets_fts');
  await knex.schema.dropTableIfExists('assets');
};
