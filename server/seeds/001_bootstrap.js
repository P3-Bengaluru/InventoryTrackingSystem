/**
 * Bootstrap seed data: root/sub categories, locations (Bangalore & Pune),
 * approval-rule tiers, and default system settings.
 *
 * Safe to re-run: every insert uses onConflict().merge()/ignore() equivalents.
 */
exports.seed = async function (knex) {
  // ── Users ─────────────────────────────────────────────────────────
  await knex('users')
    .insert([
      {
        employee_id: '001',
        name: 'Admin User',
        email: 'admin@example.com',
        password_hash: '$2b$10$KIXQJ1Z5Y6F8z5G9e1Z5Oe1Z5Oe1Z5Oe1Z5Oe1Z5Oe1Z5Oe1Z5Oe', // hashed 'password'
        role: 'admin',
        manager_id: null,
        department: 'Administration',
        designation: 'System Administrator',
        phone: '1234567890',
        self_approve_limit: 100000,
        budget_limit: 1000000,
        is_active: true,
      }
    ])
    .onConflict(['email'])
    .ignore();

  // ── Categories ────────────────────────────────────────────────────
  await knex('categories')
    .insert([
      { name: 'Hardware', type: 'asset', sort_order: 1 },
      { name: 'Software', type: 'asset', sort_order: 2 },
      { name: 'Consumables', type: 'consumable', sort_order: 3 },
    ])
    .onConflict(['name', 'parent_id'])
    .ignore();

  const hw = await knex('categories').where({ name: 'Hardware', parent_id: null }).first();
  await knex('categories')
    .insert([
      { name: 'Laptops', parent_id: hw.id, sort_order: 1 },
      { name: 'Desktops', parent_id: hw.id, sort_order: 2 },
      { name: 'Monitors & Displays', parent_id: hw.id, sort_order: 3 },
      { name: 'Peripherals', parent_id: hw.id, sort_order: 4 },
      { name: 'Networking Equipment', parent_id: hw.id, sort_order: 5 },
      { name: 'Servers', parent_id: hw.id, sort_order: 6 },
      { name: 'Mobile Devices', parent_id: hw.id, sort_order: 7 },
      { name: 'Other Hardware', parent_id: hw.id, sort_order: 8 },
    ])
    .onConflict(['name', 'parent_id'])
    .ignore();

  const laptops = await knex('categories').where({ name: 'Laptops', parent_id: hw.id }).first();
  await knex('categories')
    .insert([
      { name: 'Windows Laptops', parent_id: laptops.id, sort_order: 1 },
      { name: 'MacBooks', parent_id: laptops.id, sort_order: 2 },
      { name: 'Linux Laptops', parent_id: laptops.id, sort_order: 3 },
    ])
    .onConflict(['name', 'parent_id'])
    .ignore();

  const sw = await knex('categories').where({ name: 'Software', parent_id: null }).first();
  await knex('categories')
    .insert([
      { name: 'Operating Systems', parent_id: sw.id, sort_order: 1 },
      { name: 'Productivity Suite', parent_id: sw.id, sort_order: 2 },
      { name: 'Security & Antivirus', parent_id: sw.id, sort_order: 3 },
      { name: 'Development Tools', parent_id: sw.id, sort_order: 4 },
      { name: 'Design Tools', parent_id: sw.id, sort_order: 5 },
      { name: 'Other Software', parent_id: sw.id, sort_order: 6 },
    ])
    .onConflict(['name', 'parent_id'])
    .ignore();

  const cs = await knex('categories').where({ name: 'Consumables', parent_id: null }).first();
  await knex('categories')
    .insert([
      { name: 'Stationery', parent_id: cs.id, sort_order: 1 },
      { name: 'Printer Supplies', parent_id: cs.id, sort_order: 2 },
      { name: 'Pantry & Beverages', parent_id: cs.id, sort_order: 3 },
      { name: 'Cleaning Supplies', parent_id: cs.id, sort_order: 4 },
      { name: 'Electrical', parent_id: cs.id, sort_order: 5 },
    ])
    .onConflict(['name', 'parent_id'])
    .ignore();

  // ── Locations ─────────────────────────────────────────────────────
  await knex('locations')
    .insert([
      { name: 'Bangalore', level: 1, code: 'BLR' },
      { name: 'Pune', level: 1, code: 'PNE' },
    ])
    .onConflict(['name', 'parent_id'])
    .ignore();

  const blr = await knex('locations').where({ name: 'Bangalore', parent_id: null }).first();
  await knex('locations')
    .insert([
      { name: 'Engineering', parent_id: blr.id, level: 2, code: 'ENG-BLR' },
      { name: 'Finance', parent_id: blr.id, level: 2, code: 'FIN-BLR' },
      { name: 'HR', parent_id: blr.id, level: 2, code: 'HR-BLR' },
      { name: 'Operations', parent_id: blr.id, level: 2, code: 'OPS-BLR' },
      { name: 'Administration', parent_id: blr.id, level: 2, code: 'ADM-BLR' },
    ])
    .onConflict(['name', 'parent_id'])
    .ignore();

  const engBlr = await knex('locations').where({ name: 'Engineering', code: 'ENG-BLR' }).first();
  await knex('locations')
    .insert([
      { name: 'Project Alpha', parent_id: engBlr.id, level: 3, code: 'PRJ-ALPHA' },
      { name: 'Project Beta', parent_id: engBlr.id, level: 3, code: 'PRJ-BETA' },
      { name: 'Common Area', parent_id: engBlr.id, level: 3, code: 'CMN-ENG-BLR' },
    ])
    .onConflict(['name', 'parent_id'])
    .ignore();

  // ── Approval rules ────────────────────────────────────────────────
  const existingRules = await knex('approval_rules').count('id as count').first();
  if (Number(existingRules.count) === 0) {
    await knex('approval_rules').insert([
      {
        name: 'Self Approve',
        min_amount: 0,
        max_amount: 5000,
        approver_role: 'engineer',
        approver_level: 1,
        description: 'Engineer can self-approve below ₹5,000',
      },
      {
        name: 'Manager Approval L1',
        min_amount: 5001,
        max_amount: 25000,
        approver_role: 'manager',
        approver_level: 1,
        description: 'Manager approves ₹5,001–₹25,000',
      },
      {
        name: 'Inv. Manager Approval',
        min_amount: 25001,
        max_amount: 100000,
        approver_role: 'inventory_manager',
        approver_level: 1,
        description: 'Inventory manager approves ₹25,001–₹1,00,000',
      },
      {
        name: 'Manager Approval L2',
        min_amount: 25001,
        max_amount: 100000,
        approver_role: 'manager',
        approver_level: 2,
        description: 'Manager co-approves above ₹25,000',
      },
      {
        name: 'Admin Final Approval',
        min_amount: 100001,
        max_amount: null,
        approver_role: 'admin',
        approver_level: 1,
        description: 'Admin approves anything above ₹1,00,000',
      },
    ]);
  }

  // ── System settings ───────────────────────────────────────────────
  await knex('system_settings')
    .insert([
      { key: 'company_name', value: 'My Company', type: 'string', description: 'Shown in header and reports' },
      { key: 'asset_number_prefix', value: 'ITS', type: 'string', description: 'Prefix for sequential asset numbers' },
      { key: 'self_approve_default_limit', value: '5000', type: 'number', description: 'Default self-approval threshold (INR)' },
      { key: 'warranty_alert_days', value: '30', type: 'number', description: 'Days before warranty expiry to alert' },
      { key: 'maintenance_alert_days', value: '7', type: 'number', description: 'Days before maintenance due to alert' },
      { key: 'low_stock_email_enabled', value: 'false', type: 'boolean', description: 'Send email on low stock' },
      { key: 'smtp_host', value: '', type: 'string', description: 'SMTP relay hostname' },
      { key: 'smtp_port', value: '587', type: 'number', description: 'SMTP port' },
      { key: 'smtp_user', value: '', type: 'string', description: 'SMTP username' },
      { key: 'smtp_pass', value: '', type: 'string', description: 'SMTP password' },
      { key: 'smtp_from', value: 'inventory@company.local', type: 'string', description: 'Sender email' },
      { key: 'public_qr_base_url', value: 'https://inventory.company.local/public/asset', type: 'string', description: 'Base URL for QR code links' },
    ])
    .onConflict('key')
    .ignore();
};
