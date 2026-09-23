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
  const getOrCreateLocation = async ({ name, parent_id = null, level, code }) => {
    let location = await knex("locations").where({ name, parent_id }).first();
    if (!location) {
      [location] = await knex("locations").insert({ name, parent_id, level, code }).returning("*");
    }
    return location;
  };

  const bangalore = await getOrCreateLocation({ name: "Bangalore", level: 1, code: "BLR" });
  const pune = await getOrCreateLocation({ name: "Pune", level: 1, code: "PUN" });
  const bangaloreEngineering = await getOrCreateLocation({ name: "Engineering", parent_id: bangalore.id, level: 2, code: "ENG-BLR" });
  const puneEngineering = await getOrCreateLocation({ name: "Engineering", parent_id: pune.id, level: 2, code: "ENG-PUN" });
  await getOrCreateLocation({ name: "Project Alpha", parent_id: bangaloreEngineering.id, level: 3, code: "PRJ-ALPHA" });
  await getOrCreateLocation({ name: "Project Beta", parent_id: puneEngineering.id, level: 3, code: "PRJ-BETA" });
  await getOrCreateLocation({ name: "Common Area", parent_id: bangaloreEngineering.id, level: 3, code: "CMN-ENG-BLR" });

  // ── Suppliers ─────────────────────────────────────────────────────
  await knex('suppliers')
    .insert([
      {
        name: 'Dell Technologies India',
        contact_person: 'Rakesh Menon',
        email: 'sales@dell-partner.example.com',
        phone: '+91-80-4000-1000',
        city: 'Bangalore',
        website: 'https://www.dell.com/en-in',
        payment_terms: 'Net 30',
      },
      {
        name: 'Apple India Reseller',
        contact_person: 'Divya Shah',
        email: 'orders@apple-reseller.example.com',
        phone: '+91-80-4000-2000',
        city: 'Bangalore',
        website: 'https://www.apple.com/in',
        payment_terms: 'Net 15',
      },
      {
        name: 'HP Enterprise Solutions',
        contact_person: 'Suresh Iyer',
        email: 'b2b@hp-partner.example.com',
        phone: '+91-20-4000-3000',
        city: 'Pune',
        website: 'https://www.hp.com/in-en',
        payment_terms: 'Net 30',
      },
    ])
    .onConflict('name')
    .ignore();

  const dell = await knex('suppliers').where({ name: 'Dell Technologies India' }).first();
  const apple = await knex('suppliers').where({ name: 'Apple India Reseller' }).first();
  const hp = await knex('suppliers').where({ name: 'HP Enterprise Solutions' }).first();

  // ── Sample assets ─────────────────────────────────────────────────
  const winLaptops = await knex('categories').where({ name: 'Windows Laptops', parent_id: laptops.id }).first();
  const macbooks = await knex('categories').where({ name: 'MacBooks', parent_id: laptops.id }).first();
  const desktops = await knex('categories').where({ name: 'Desktops', parent_id: hw.id }).first();
  const monitors = await knex('categories').where({ name: 'Monitors & Displays', parent_id: hw.id }).first();
  const mobileDevices = await knex('categories').where({ name: 'Mobile Devices', parent_id: hw.id }).first();

  const projectAlpha = await knex('locations').where({ name: 'Project Alpha', code: 'PRJ-ALPHA' }).first();
  const projectBeta = await knex('locations').where({ name: 'Project Beta', code: 'PRJ-BETA' }).first();
  const commonArea = await knex('locations').where({ name: 'Common Area', code: 'CMN-ENG-BLR' }).first();

  await knex('assets')
    .insert([
      {
        name: 'Dell Latitude 5440',
        asset_tag: 'AST-0001',
        serial_number: 'DL5440-BLR-0001',
        brand: 'Dell',
        model: 'Latitude 5440',
        specifications: JSON.stringify({ ram: '16GB', cpu: 'i7-1355U', storage: '512GB SSD' }),
        category_id: winLaptops.id,
        location_id: projectAlpha.id,
        supplier_id: dell.id,
        purchase_date: '2025-11-10',
        purchase_price: 92000.0,
        invoice_number: 'INV-DELL-2025-1187',
        warranty_expiry: '2028-11-09',
        status: 'available',
      },
      {
        name: 'MacBook Pro 14" M3',
        asset_tag: 'AST-0002',
        serial_number: 'MBP14M3-BLR-0002',
        brand: 'Apple',
        model: 'MacBook Pro 14 (M3)',
        specifications: JSON.stringify({ ram: '18GB', cpu: 'Apple M3', storage: '512GB SSD' }),
        category_id: macbooks.id,
        location_id: projectAlpha.id,
        supplier_id: apple.id,
        purchase_date: '2026-01-15',
        purchase_price: 189900.0,
        invoice_number: 'INV-APL-2026-0342',
        warranty_expiry: '2027-01-14',
        status: 'available',
      },
      {
        name: 'HP EliteDesk 800 G9',
        asset_tag: 'AST-0003',
        serial_number: 'HPED800-BLR-0003',
        brand: 'HP',
        model: 'EliteDesk 800 G9',
        specifications: JSON.stringify({ ram: '16GB', cpu: 'i5-13500', storage: '256GB SSD' }),
        category_id: desktops.id,
        location_id: projectBeta.id,
        supplier_id: hp.id,
        purchase_date: '2025-08-22',
        purchase_price: 68000.0,
        invoice_number: 'INV-HP-2025-0765',
        warranty_expiry: '2028-08-21',
        status: 'available',
      },
      {
        name: 'Dell UltraSharp U2724D',
        asset_tag: 'AST-0004',
        serial_number: 'DLU2724D-BLR-0004',
        brand: 'Dell',
        model: 'UltraSharp U2724D',
        specifications: JSON.stringify({ size: '27in', resolution: '2560x1440' }),
        category_id: monitors.id,
        location_id: commonArea.id,
        supplier_id: dell.id,
        purchase_date: '2025-08-22',
        purchase_price: 32000.0,
        invoice_number: 'INV-DELL-2025-0891',
        warranty_expiry: '2028-08-21',
        status: 'available',
      },
      {
        name: 'iPhone 15 (Pool Device)',
        asset_tag: 'AST-0005',
        serial_number: 'IP15-BLR-0005',
        brand: 'Apple',
        model: 'iPhone 15',
        specifications: JSON.stringify({ storage: '128GB', color: 'Black' }),
        category_id: mobileDevices.id,
        location_id: commonArea.id,
        supplier_id: apple.id,
        purchase_date: '2026-02-01',
        purchase_price: 69900.0,
        invoice_number: 'INV-APL-2026-0501',
        warranty_expiry: '2027-01-31',
        status: 'available',
      },
    ])
    .onConflict('serial_number')
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
