/**
 * Comprehensive test-data seed for exercising every ITS backend
 * endpoint and status branch: users (every role + edge cases), assets
 * (every status), assignments, reallocations, software licenses,
 * consumables + stock ledger, and procurement requests walked through
 * every stage of the approval → order → receive lifecycle.
 *
 * Run AFTER 001_bootstrap.js (needs its categories/locations/suppliers).
 *
 *   npx knex seed:run --specific=001_bootstrap.js
 *   npx knex seed:run --specific=002_test_scenarios.js
 *
 * Idempotent: skips entirely if the sentinel admin user already exists,
 * so re-running `knex seed:run` won't duplicate rows.
 *
 * All seeded human users share one password: Passw0rd!123
 * (hashed with bcryptjs below — swap for your own hashing lib if you
 * use something else for `password_hash`).
 */
const bcrypt = require('bcryptjs');

const TEST_PASSWORD_HASH = bcrypt.hashSync('Passw0rd!123', 10);

exports.seed = async function (knex) {
  // ── Idempotency guard ────────────────────────────────────────────
  const alreadySeeded = await knex('users').where({ email: 'admin@its.local' }).first();
  if (alreadySeeded) {
    console.log('002_test_scenarios: sentinel user already exists — skipping.');
    return;
  }

  // ── Reference data from 001_bootstrap.js ────────────────────────
  const hw = await knex('categories').where({ name: 'Hardware', parent_id: null }).first();
  const sw = await knex('categories').where({ name: 'Software', parent_id: null }).first();
  const cs = await knex('categories').where({ name: 'Consumables', parent_id: null }).first();
  if (!hw || !sw || !cs) {
    throw new Error('Root categories not found — run seed 001_bootstrap.js first.');
  }

  const laptops = await knex('categories').where({ name: 'Laptops', parent_id: hw.id }).first();
  const winLaptops = await knex('categories').where({ name: 'Windows Laptops', parent_id: laptops.id }).first();
  const macbooks = await knex('categories').where({ name: 'MacBooks', parent_id: laptops.id }).first();
  const desktopsCat = await knex('categories').where({ name: 'Desktops', parent_id: hw.id }).first();
  const monitorsCat = await knex('categories').where({ name: 'Monitors & Displays', parent_id: hw.id }).first();
  const peripheralsCat = await knex('categories').where({ name: 'Peripherals', parent_id: hw.id }).first();
  const networkingCat = await knex('categories').where({ name: 'Networking Equipment', parent_id: hw.id }).first();
  const serversCat = await knex('categories').where({ name: 'Servers', parent_id: hw.id }).first();

  const productivityCat = await knex('categories').where({ name: 'Productivity Suite', parent_id: sw.id }).first();
  const designCat = await knex('categories').where({ name: 'Design Tools', parent_id: sw.id }).first();
  const securityCat = await knex('categories').where({ name: 'Security & Antivirus', parent_id: sw.id }).first();
  const otherSoftwareCat = await knex('categories').where({ name: 'Other Software', parent_id: sw.id }).first();

  const stationeryCat = await knex('categories').where({ name: 'Stationery', parent_id: cs.id }).first();
  const cleaningCat = await knex('categories').where({ name: 'Cleaning Supplies', parent_id: cs.id }).first();

  const projectAlpha = await knex('locations').where({ code: 'PRJ-ALPHA' }).first();
  const projectBeta = await knex('locations').where({ code: 'PRJ-BETA' }).first();
  const commonArea = await knex('locations').where({ code: 'CMN-ENG-BLR' }).first();

  const dell = await knex('suppliers').where({ name: 'Dell Technologies India' }).first();
  const apple = await knex('suppliers').where({ name: 'Apple India Reseller' }).first();
  const hp = await knex('suppliers').where({ name: 'HP Enterprise Solutions' }).first();

  const existingLaptop = await knex('assets').where({ asset_tag: 'AST-0001' }).first(); // Dell Latitude
  const existingMacbook = await knex('assets').where({ asset_tag: 'AST-0002' }).first(); // MacBook Pro
  const existingDesktop = await knex('assets').where({ asset_tag: 'AST-0003' }).first(); // HP EliteDesk
  const existingMonitor = await knex('assets').where({ asset_tag: 'AST-0004' }).first(); // Dell UltraSharp
  if (!existingLaptop || !existingMacbook || !existingDesktop || !existingMonitor) {
    throw new Error('Sample assets AST-0001..0004 not found — run seed 001_bootstrap.js first.');
  }

  // ══════════════════════════════════════════════════════════════════
  //  USERS — one per role, plus inactive + locked edge cases
  // ══════════════════════════════════════════════════════════════════
  const [admin] = await knex('users')
    .insert({
      employee_id: 'EMP-0001',
      name: 'Ananya Rao',
      email: 'admin@its.local',
      password_hash: TEST_PASSWORD_HASH,
      role: 'admin',
      department: 'Administration',
      designation: 'IT Administrator',
      self_approve_limit: 1000000,
      budget_limit: 1000000,
    })
    .returning('*');

  const [invManager] = await knex('users')
    .insert({
      employee_id: 'EMP-0002',
      name: 'Karthik Subramaniam',
      email: 'inv.manager@its.local',
      password_hash: TEST_PASSWORD_HASH,
      role: 'inventory_manager',
      manager_id: admin.id,
      department: 'Operations',
      designation: 'Inventory Manager',
      self_approve_limit: 100000,
      budget_limit: 100000,
    })
    .returning('*');

  const [projectManager] = await knex('users')
    .insert({
      employee_id: 'EMP-0003',
      name: 'Meera Pillai',
      email: 'project.manager@its.local',
      password_hash: TEST_PASSWORD_HASH,
      role: 'project_manager',
      manager_id: admin.id,
      department: 'Engineering',
      designation: 'Project Manager — Project Alpha',
      self_approve_limit: 25000,
      budget_limit: 25000,
    })
    .returning('*');

  const [manager1] = await knex('users')
    .insert({
      employee_id: 'EMP-0004',
      name: 'Rohit Verma',
      email: 'manager.one@its.local',
      password_hash: TEST_PASSWORD_HASH,
      role: 'manager',
      manager_id: admin.id,
      department: 'Engineering',
      designation: 'Engineering Manager',
      self_approve_limit: 5000,
      budget_limit: 25000,
    })
    .returning('*');

  const [manager2] = await knex('users')
    .insert({
      employee_id: 'EMP-0005',
      name: 'Priya Nair',
      email: 'manager.two@its.local',
      password_hash: TEST_PASSWORD_HASH,
      role: 'manager',
      manager_id: admin.id,
      department: 'Finance',
      designation: 'Finance Manager',
      self_approve_limit: 5000,
      budget_limit: 25000,
    })
    .returning('*');

  const [engineer1] = await knex('users')
    .insert({
      employee_id: 'EMP-0006',
      name: 'Arjun Kumar',
      email: 'engineer.one@its.local',
      password_hash: TEST_PASSWORD_HASH,
      role: 'engineer',
      manager_id: manager1.id,
      department: 'Engineering',
      designation: 'Systems Engineer',
      self_approve_limit: 5000,
      budget_limit: 0,
    })
    .returning('*');

  const [engineer2] = await knex('users')
    .insert({
      employee_id: 'EMP-0007',
      name: 'Sneha Reddy',
      email: 'engineer.two@its.local',
      password_hash: TEST_PASSWORD_HASH,
      role: 'engineer',
      manager_id: manager2.id,
      department: 'Engineering',
      designation: 'Firmware Engineer',
      self_approve_limit: 0,
      budget_limit: 0,
    })
    .returning('*');

  const [auditor] = await knex('users')
    .insert({
      employee_id: 'EMP-0008',
      name: 'Vikram Chawla',
      email: 'auditor@its.local',
      password_hash: TEST_PASSWORD_HASH,
      role: 'auditor',
      manager_id: admin.id,
      department: 'Finance',
      designation: 'Internal Auditor',
      self_approve_limit: 0,
      budget_limit: 0,
    })
    .returning('*');

  // Edge case: inactive account — login should be rejected.
  const [inactiveUser] = await knex('users')
    .insert({
      employee_id: 'EMP-0009',
      name: 'Former Employee',
      email: 'inactive.user@its.local',
      password_hash: TEST_PASSWORD_HASH,
      role: 'engineer',
      department: 'Engineering',
      is_active: false,
    })
    .returning('*');

  // Edge case: account locked after too many failed logins.
  const [lockedUser] = await knex('users')
    .insert({
      employee_id: 'EMP-0010',
      name: 'Locked Account',
      email: 'locked.user@its.local',
      password_hash: TEST_PASSWORD_HASH,
      role: 'engineer',
      department: 'Engineering',
      failed_login_attempts: 5,
      locked_until: knex.raw("NOW() + INTERVAL '30 minutes'"),
    })
    .returning('*');

  // ══════════════════════════════════════════════════════════════════
  //  ASSETS — every status value, plus warranty/maintenance-alert cases
  // ══════════════════════════════════════════════════════════════════
  const [assignedAsset] = await knex('assets')
    .insert({
      name: 'Dell Latitude 5430 (In Use)',
      asset_tag: 'AST-0006',
      serial_number: 'DL5430-BLR-0006',
      brand: 'Dell',
      model: 'Latitude 5430',
      category_id: winLaptops.id,
      location_id: projectAlpha.id,
      supplier_id: dell.id,
      purchase_date: '2025-06-01',
      purchase_price: 85000.0,
      warranty_expiry: '2028-05-31',
      status: 'assigned',
      assigned_to: engineer1.id,
      assigned_since: '2025-06-05',
    })
    .returning('*');

  const [maintenanceAsset] = await knex('assets')
    .insert({
      name: 'HP LaserJet Pro Printer',
      asset_tag: 'AST-0007',
      serial_number: 'HPLJ-BLR-0007',
      brand: 'HP',
      model: 'LaserJet Pro M404dn',
      category_id: peripheralsCat.id,
      location_id: commonArea.id,
      supplier_id: hp.id,
      purchase_date: '2024-03-10',
      purchase_price: 18000.0,
      warranty_expiry: '2027-03-09',
      status: 'maintenance',
      next_maintenance_date: knex.raw("(NOW() + INTERVAL '5 days')::date"),
      maintenance_interval_days: 90,
    })
    .returning('*');

  const [retiredAsset] = await knex('assets')
    .insert({
      name: 'Old Desktop PC (2019)',
      asset_tag: 'AST-0008',
      serial_number: 'OLDPC-BLR-0008',
      brand: 'Dell',
      model: 'OptiPlex 3070',
      category_id: desktopsCat.id,
      location_id: commonArea.id,
      purchase_date: '2019-04-01',
      purchase_price: 45000.0,
      status: 'retired',
      is_active: false,
    })
    .returning('*');

  const [lostAsset] = await knex('assets')
    .insert({
      name: 'Wireless Mouse (Missing)',
      asset_tag: 'AST-0009',
      serial_number: 'MOUSE-BLR-0009',
      brand: 'Logitech',
      model: 'MX Master 3',
      category_id: peripheralsCat.id,
      location_id: projectBeta.id,
      purchase_date: '2024-11-01',
      purchase_price: 7500.0,
      status: 'lost',
    })
    .returning('*');

  const [disposedAsset] = await knex('assets')
    .insert({
      name: 'Broken Monitor (Cracked Panel)',
      asset_tag: 'AST-0010',
      serial_number: 'MON-BLR-0010',
      brand: 'Dell',
      model: 'P2419H',
      category_id: monitorsCat.id,
      location_id: commonArea.id,
      purchase_date: '2021-01-15',
      purchase_price: 15000.0,
      status: 'disposed',
      is_active: false,
    })
    .returning('*');

  const [inTransitAsset] = await knex('assets')
    .insert({
      name: 'New Rack Server (Incoming)',
      asset_tag: 'AST-0011',
      serial_number: 'SRV-BLR-0011',
      brand: 'HP',
      model: 'ProLiant DL380',
      category_id: serversCat.id,
      location_id: commonArea.id,
      supplier_id: hp.id,
      purchase_date: knex.raw('CURRENT_DATE'),
      purchase_price: 350000.0,
      status: 'in_transit',
    })
    .returning('*');

  // Warranty-expiry-alert case: expires inside the 30-day alert window.
  const [warrantyExpiringAsset] = await knex('assets')
    .insert({
      name: 'MacBook Air M2 (Warranty Ending Soon)',
      asset_tag: 'AST-0012',
      serial_number: 'MBA-BLR-0012',
      brand: 'Apple',
      model: 'MacBook Air M2',
      category_id: macbooks.id,
      location_id: projectAlpha.id,
      supplier_id: apple.id,
      purchase_date: '2024-09-20',
      purchase_price: 114900.0,
      warranty_expiry: knex.raw("(NOW() + INTERVAL '20 days')::date"),
      status: 'available',
    })
    .returning('*');

  // Loaner that's back in the pool after a return (paired with AS4 below).
  const [returnedLoanerAsset] = await knex('assets')
    .insert({
      name: 'Returned Loaner Laptop',
      asset_tag: 'AST-0013',
      serial_number: 'LOANER-BLR-0013',
      brand: 'Dell',
      model: 'Latitude 5420',
      category_id: winLaptops.id,
      location_id: commonArea.id,
      supplier_id: dell.id,
      purchase_date: '2023-02-01',
      purchase_price: 72000.0,
      status: 'available',
    })
    .returning('*');

  // Still assigned, but overdue for return (paired with AS5 below).
  const [overdueMonitorAsset] = await knex('assets')
    .insert({
      name: 'Overdue Loaner Monitor',
      asset_tag: 'AST-0014',
      serial_number: 'MON-BLR-0014',
      brand: 'Dell',
      model: 'P2422H',
      category_id: monitorsCat.id,
      location_id: projectBeta.id,
      supplier_id: dell.id,
      purchase_date: '2024-05-01',
      purchase_price: 14000.0,
      status: 'assigned',
      assigned_to: engineer2.id,
      assigned_since: '2026-06-01',
      return_required: true,
    })
    .returning('*');

  // Three more "assigned" assets purely to drive the four reallocation
  // scenarios below (pending / approved / rejected / completed).
  const [reallocAssetPending] = await knex('assets')
    .insert({
      name: 'Laptop for Reallocation (Pending)',
      asset_tag: 'AST-0015',
      serial_number: 'REALLOC-BLR-0015',
      brand: 'Dell',
      model: 'Latitude 5440',
      category_id: winLaptops.id,
      location_id: projectAlpha.id,
      supplier_id: dell.id,
      purchase_date: '2025-03-01',
      purchase_price: 88000.0,
      status: 'assigned',
      assigned_to: engineer1.id,
      assigned_since: '2025-03-05',
    })
    .returning('*');

  const [reallocAssetApproved] = await knex('assets')
    .insert({
      name: 'Laptop for Reallocation (Approved)',
      asset_tag: 'AST-0016',
      serial_number: 'REALLOC-BLR-0016',
      brand: 'Dell',
      model: 'Latitude 5440',
      category_id: winLaptops.id,
      location_id: projectAlpha.id,
      supplier_id: dell.id,
      purchase_date: '2025-03-01',
      purchase_price: 88000.0,
      status: 'assigned',
      assigned_to: engineer1.id,
      assigned_since: '2025-03-05',
    })
    .returning('*');

  const [reallocAssetCompleted] = await knex('assets')
    .insert({
      name: 'Laptop for Reallocation (Completed)',
      asset_tag: 'AST-0017',
      serial_number: 'REALLOC-BLR-0017',
      brand: 'Dell',
      model: 'Latitude 5440',
      category_id: winLaptops.id,
      location_id: projectAlpha.id,
      supplier_id: dell.id,
      purchase_date: '2025-03-01',
      purchase_price: 88000.0,
      status: 'assigned',
      // Already transferred to engineer2 — reflects the *completed* reallocation.
      assigned_to: engineer2.id,
      assigned_since: knex.raw('CURRENT_DATE'),
    })
    .returning('*');

  // Attachments on an existing asset from 001_bootstrap.js.
  await knex('asset_attachments').insert([
    {
      asset_id: existingLaptop.id,
      file_name: 'dell-latitude-5440-invoice.pdf',
      file_url: '/uploads/invoices/dell-latitude-5440-invoice.pdf',
      file_type: 'application/pdf',
      file_size_bytes: 245678,
      attachment_type: 'invoice',
      uploaded_by: invManager.id,
    },
    {
      asset_id: existingLaptop.id,
      file_name: 'dell-latitude-5440-photo.jpg',
      file_url: '/uploads/photos/dell-latitude-5440-photo.jpg',
      file_type: 'image/jpeg',
      file_size_bytes: 891234,
      attachment_type: 'photo',
      uploaded_by: invManager.id,
    },
  ]);

  // ══════════════════════════════════════════════════════════════════
  //  ASSIGNMENTS — every status value
  // ══════════════════════════════════════════════════════════════════
  await knex('assignments').insert([
    {
      // pending: awaiting admin/manager decision
      asset_id: existingMacbook.id,
      user_id: engineer2.id,
      status: 'pending',
      request_reason: 'Need a portable dev machine for on-site client work.',
    },
    {
      // assigned: mirrors assignedAsset's current state
      asset_id: assignedAsset.id,
      user_id: engineer1.id,
      status: 'assigned',
      assigned_since: '2025-06-05',
      approved_at: knex.raw("'2025-06-05'::date"),
      approved_by: manager1.id,
    },
    {
      // rejected
      asset_id: existingMonitor.id,
      user_id: engineer2.id,
      status: 'rejected',
      rejected_at: knex.fn.now(),
      approved_by: manager2.id,
      request_reason: 'Second monitor for dual-screen setup.',
      rejection_reason: 'Team already has spare monitors in Common Area — collect from there instead.',
    },
    {
      // returned: loaner went out and came back in good condition
      asset_id: returnedLoanerAsset.id,
      user_id: engineer1.id,
      status: 'returned',
      assigned_since: '2026-01-10',
      expected_return: '2026-03-10',
      returned_at: knex.raw("'2026-03-08'::timestamp"),
      approved_by: manager1.id,
      return_notes: 'Returned early, no issues.',
      return_condition: 'good',
    },
    {
      // overdue: expected_return has passed, asset still out
      asset_id: overdueMonitorAsset.id,
      user_id: engineer2.id,
      status: 'overdue',
      assigned_since: '2026-06-01',
      expected_return: '2026-07-01',
      approved_by: manager2.id,
    },
  ]);

  // ══════════════════════════════════════════════════════════════════
  //  REALLOCATIONS — every status value
  // ══════════════════════════════════════════════════════════════════
  await knex('reallocations').insert([
    {
      // pending: awaiting project manager approval
      asset_id: reallocAssetPending.id,
      from_user_id: engineer1.id,
      to_user_id: engineer2.id,
      status: 'pending',
      requested_by: engineer1.id,
      reason: 'Engineer 1 rolling off Project Alpha; Engineer 2 taking over.',
    },
    {
      // approved: signed off, but the physical handover hasn't happened yet
      asset_id: reallocAssetApproved.id,
      from_user_id: engineer1.id,
      to_user_id: engineer2.id,
      status: 'approved',
      requested_by: engineer1.id,
      approved_by: projectManager.id,
      approver_role: 'project_manager',
      reason: 'Temporary reassignment for Project Beta crunch.',
      approved_at: knex.fn.now(),
    },
    {
      // rejected
      asset_id: assignedAsset.id,
      from_user_id: engineer1.id,
      to_user_id: engineer2.id,
      status: 'rejected',
      requested_by: engineer1.id,
      approved_by: projectManager.id,
      approver_role: 'project_manager',
      reason: 'Engineer 2 requested this laptop for a side project.',
      rejection_reason: 'Asset still required on Project Alpha through Q4.',
    },
    {
      // completed: handover done, asset row already reflects the new owner
      asset_id: reallocAssetCompleted.id,
      from_user_id: engineer1.id,
      to_user_id: engineer2.id,
      status: 'completed',
      requested_by: engineer1.id,
      approved_by: projectManager.id,
      approver_role: 'project_manager',
      reason: 'Engineer 1 moved teams; laptop handed over directly.',
      approved_at: knex.raw("NOW() - INTERVAL '2 days'"),
      completed_at: knex.fn.now(),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════
  //  SOFTWARE LICENSES — every license_type & status
  // ══════════════════════════════════════════════════════════════════
  await knex('software_licenses').insert([
    {
      software_name: 'Microsoft 365 Business',
      version: 'Current',
      license_type: 'subscription',
      total_seats: 50,
      used_seats: 32,
      category_id: productivityCat.id,
      supplier_id: null,
      purchase_date: '2026-01-01',
      expiry_date: '2027-01-01',
      cost: 250000.0,
      status: 'active',
    },
    {
      // Expiring soon — for testing the warranty/license expiry alert path.
      software_name: 'Adobe Creative Cloud (Team)',
      version: '2026',
      license_type: 'subscription',
      total_seats: 10,
      used_seats: 10,
      category_id: designCat.id,
      purchase_date: '2025-10-01',
      expiry_date: knex.raw("(NOW() + INTERVAL '25 days')::date"),
      cost: 180000.0,
      status: 'active',
    },
    {
      software_name: 'Legacy Antivirus Suite',
      version: '2022',
      license_type: 'perpetual',
      total_seats: 100,
      used_seats: 0,
      category_id: securityCat.id,
      purchase_date: '2022-01-01',
      expiry_date: '2025-01-01',
      cost: 40000.0,
      status: 'expired',
    },
    {
      software_name: 'Trial Design Tool',
      version: '1.0-trial',
      license_type: 'trial',
      total_seats: 5,
      used_seats: 0,
      category_id: otherSoftwareCat.id,
      purchase_date: '2026-05-01',
      expiry_date: '2026-06-01',
      cost: 0.0,
      status: 'cancelled',
      notes: 'Evaluated and rejected — did not fit workflow.',
    },
    {
      software_name: 'Linux Distro Utilities',
      version: 'rolling',
      license_type: 'open_source',
      total_seats: null,
      used_seats: 0,
      category_id: otherSoftwareCat.id,
      purchase_date: '2024-01-01',
      cost: 0.0,
      status: 'active',
      notes: 'Unlimited seats — open source.',
    },
  ]);

  // ══════════════════════════════════════════════════════════════════
  //  CONSUMABLES + STOCK LEDGER — every transaction type, low-stock case
  // ══════════════════════════════════════════════════════════════════
  const [paperStock] = await knex('consumables')
    .insert({
      sku: 'STN-PAPER-A4',
      name: 'A4 Paper Ream',
      category_id: stationeryCat.id,
      location_id: commonArea.id,
      quantity: 3, // below min_threshold — triggers is_low_stock
      consumed_total: 47,
      total_received: 50,
      min_threshold: 10,
      reorder_quantity: 50,
      unit: 'pcs',
      unit_cost: 280.0,
    })
    .returning('*');

  const [penStock] = await knex('consumables')
    .insert({
      sku: 'STN-PEN-BLUE',
      name: 'Ballpoint Pen (Blue)',
      category_id: stationeryCat.id,
      location_id: commonArea.id,
      quantity: 200,
      consumed_total: 100,
      total_received: 300,
      min_threshold: 50,
      unit: 'pcs',
      unit_cost: 8.0,
    })
    .returning('*');

  const [sanitizerStock] = await knex('consumables')
    .insert({
      sku: 'CLN-SANITIZER-500ML',
      name: 'Hand Sanitizer 500ml',
      category_id: cleaningCat.id,
      location_id: commonArea.id,
      quantity: 12,
      consumed_total: 8,
      total_received: 20,
      min_threshold: 5,
      unit: 'pcs',
      unit_cost: 150.0,
      expiry_date: knex.raw("(NOW() + INTERVAL '15 days')::date"),
    })
    .returning('*');

  // One of every stock_transactions.type value.
  await knex('stock_transactions').insert([
    {
      consumable_id: penStock.id,
      type: 'add',
      quantity: 300,
      quantity_before: 0,
      quantity_after: 300,
      transacted_by: invManager.id,
      invoice_number: 'INV-STN-2026-0011',
      unit_cost_at_time: 8.0,
      supplier_id: null,
      notes: 'Initial bulk purchase.',
    },
    {
      consumable_id: penStock.id,
      type: 'issue',
      quantity: 100,
      quantity_before: 300,
      quantity_after: 200,
      transacted_by: invManager.id,
      recipient: 'Engineering department',
      recipient_user_id: engineer1.id,
      department: 'Engineering',
      notes: 'Issued for Q3 stationery drive.',
    },
    {
      consumable_id: paperStock.id,
      type: 'issue',
      quantity: 47,
      quantity_before: 50,
      quantity_after: 3,
      transacted_by: invManager.id,
      recipient: 'Common Area printer station',
      department: 'Operations',
      notes: 'Consumed faster than expected — triggered low-stock flag.',
    },
    {
      consumable_id: sanitizerStock.id,
      type: 'adjustment',
      quantity: -2,
      quantity_before: 14,
      quantity_after: 12,
      transacted_by: invManager.id,
      notes: 'Physical count correction after cycle audit.',
    },
    {
      consumable_id: penStock.id,
      type: 'return',
      quantity: 5,
      quantity_before: 195,
      quantity_after: 200,
      transacted_by: engineer2.id,
      recipient: 'Engineering department',
      recipient_user_id: engineer2.id,
      department: 'Engineering',
      notes: 'Unused pack returned after project wrap-up.',
    },
    {
      consumable_id: sanitizerStock.id,
      type: 'disposal',
      quantity: 3,
      quantity_before: 15,
      quantity_after: 12,
      transacted_by: invManager.id,
      notes: 'Expired batch disposed.',
    },
  ]);

  // ══════════════════════════════════════════════════════════════════
  //  PROCUREMENT REQUESTS — every status, every branch, ready to test
  //  each endpoint directly without having to walk the whole lifecycle
  //  by hand first.
  // ══════════════════════════════════════════════════════════════════

  // R1 — draft: created but not yet submitted. Nothing to approve yet.
  const [r1Draft] = await knex('procurement_requests')
    .insert({
      requested_by: engineer2.id,
      department: 'Engineering',
      request_type: 'new_purchase',
      item_name: 'Ergonomic Keyboard',
      category_id: peripheralsCat.id,
      quantity: 1,
      justification: 'Current keyboard causing wrist strain.',
      estimated_cost: 2500.0,
      status: 'draft',
    })
    .returning('*');

  // R2 — submitted: past draft, inventory match not yet run.
  const [r2Submitted] = await knex('procurement_requests')
    .insert({
      requested_by: engineer1.id,
      department: 'Engineering',
      request_type: 'existing_asset',
      item_name: 'Spare Laptop Charger (65W)',
      category_id: peripheralsCat.id,
      quantity: 1,
      justification: 'Original charger left at client site.',
      estimated_cost: 1200.0,
      status: 'submitted',
      submitted_at: knex.fn.now(),
    })
    .returning('*');

  // R3 — inventory_check: system is mid-way through matching against stock.
  const [r3InventoryCheck] = await knex('procurement_requests')
    .insert({
      requested_by: engineer2.id,
      department: 'Engineering',
      request_type: 'existing_asset',
      item_name: 'Standing Desk',
      category_id: peripheralsCat.id,
      quantity: 1,
      justification: 'Ergonomic request from company wellness program.',
      estimated_cost: 8000.0,
      status: 'inventory_check',
      submitted_at: knex.fn.now(),
    })
    .returning('*');

  // R4 — self_approved: under engineer1's own self_approve_limit (5000).
  // Ready to hit PATCH /:id/order directly.
  const [r4SelfApproved] = await knex('procurement_requests')
    .insert({
      requested_by: engineer1.id,
      department: 'Engineering',
      request_type: 'new_purchase',
      item_name: 'USB-C Docking Station',
      category_id: peripheralsCat.id,
      quantity: 1,
      justification: 'Needed for dual-monitor dev setup.',
      estimated_cost: 4200.0,
      status: 'self_approved',
      submitted_at: knex.fn.now(),
      approved_at: knex.fn.now(),
    })
    .returning('*');

  // R5 — pending_approval, single tier. Meant to be APPROVED by manager1
  // via PATCH /:id/approvals/:approvalId.
  const [r5PendingApprove] = await knex('procurement_requests')
    .insert({
      requested_by: engineer2.id,
      department: 'Engineering',
      request_type: 'new_purchase',
      item_name: 'Ergonomic Office Chair',
      category_id: peripheralsCat.id,
      quantity: 1,
      justification: 'Existing chair is broken beyond repair.',
      estimated_cost: 15000.0,
      status: 'pending_approval',
      submitted_at: knex.fn.now(),
    })
    .returning('*');

  const [r5Approval1] = await knex('procurement_approvals')
    .insert({
      procurement_id: r5PendingApprove.id,
      approver_id: manager1.id,
      approver_role: 'manager',
      level: 1,
      status: 'pending',
    })
    .returning('*');

  // R6 — pending_approval, single tier. Meant to be REJECTED by manager2.
  const [r6PendingReject] = await knex('procurement_requests')
    .insert({
      requested_by: engineer2.id,
      department: 'Engineering',
      request_type: 'new_purchase',
      item_name: '4K Gaming Monitor',
      category_id: monitorsCat.id,
      quantity: 1,
      justification: 'Would like a bigger screen for development.',
      estimated_cost: 18000.0,
      status: 'pending_approval',
      submitted_at: knex.fn.now(),
    })
    .returning('*');

  const [r6Approval1] = await knex('procurement_approvals')
    .insert({
      procurement_id: r6PendingReject.id,
      approver_id: manager2.id,
      approver_role: 'manager',
      level: 1,
      status: 'pending',
    })
    .returning('*');

  // R7 — pending_approval, TWO tiers (inventory_manager L1, manager L2).
  // Tests sequential gating: approve level 1, watch level 2 light up.
  const [r7MultiLevel] = await knex('procurement_requests')
    .insert({
      requested_by: engineer1.id,
      department: 'Engineering',
      request_type: 'new_purchase',
      item_name: 'Rack Server for CI Pipeline',
      category_id: serversCat.id,
      quantity: 1,
      justification: 'Current CI runner is a bottleneck for the whole team.',
      estimated_cost: 60000.0,
      status: 'pending_approval',
      submitted_at: knex.fn.now(),
    })
    .returning('*');

  const [r7Approval1, r7Approval2] = await knex('procurement_approvals')
    .insert([
      {
        procurement_id: r7MultiLevel.id,
        approver_id: invManager.id,
        approver_role: 'inventory_manager',
        level: 1,
        status: 'pending',
      },
      {
        procurement_id: r7MultiLevel.id,
        approver_id: manager1.id,
        approver_role: 'manager',
        level: 2,
        status: 'pending',
      },
    ])
    .returning('*');

  // R8 — approved: full chain already signed off. Ready for PATCH /:id/order.
  const [r8Approved] = await knex('procurement_requests')
    .insert({
      requested_by: engineer2.id,
      department: 'Engineering',
      request_type: 'new_purchase',
      item_name: '24-Port Network Switch',
      category_id: networkingCat.id,
      quantity: 1,
      justification: 'Expanding Project Beta lab network.',
      estimated_cost: 20000.0,
      status: 'approved',
      submitted_at: knex.raw("NOW() - INTERVAL '3 days'"),
      approved_at: knex.fn.now(),
    })
    .returning('*');

  await knex('procurement_approvals').insert({
    procurement_id: r8Approved.id,
    approver_id: manager1.id,
    approver_role: 'manager',
    level: 1,
    status: 'approved',
    comments: 'Approved — reasonable network expansion.',
    actioned_at: knex.fn.now(),
  });

  // R9 — ordered (new_purchase): ready for PATCH /:id/receive, exercising
  // the branch that CREATES a new asset row.
  const [r9OrderedNew] = await knex('procurement_requests')
    .insert({
      requested_by: engineer1.id,
      department: 'Engineering',
      request_type: 'new_purchase',
      item_name: 'Conference Room Display 65"',
      category_id: monitorsCat.id,
      quantity: 1,
      justification: 'Project Alpha war room needs a shared display.',
      estimated_cost: 45000.0,
      quoted_cost: 43500.0,
      status: 'ordered',
      supplier_id: hp.id,
      po_number: 'PO-2026-0091',
      expected_delivery: knex.raw("(NOW() + INTERVAL '10 days')::date"),
      submitted_at: knex.raw("NOW() - INTERVAL '7 days'"),
      approved_at: knex.raw("NOW() - INTERVAL '5 days'"),
      ordered_at: knex.raw("NOW() - INTERVAL '2 days'"),
    })
    .returning('*');

  await knex('procurement_approvals').insert([
    {
      procurement_id: r9OrderedNew.id,
      approver_id: invManager.id,
      approver_role: 'inventory_manager',
      level: 1,
      status: 'approved',
      actioned_at: knex.raw("NOW() - INTERVAL '6 days'"),
    },
    {
      procurement_id: r9OrderedNew.id,
      approver_id: manager2.id,
      approver_role: 'manager',
      level: 2,
      status: 'approved',
      actioned_at: knex.raw("NOW() - INTERVAL '5 days'"),
    },
  ]);

  // R10 — ordered (existing_asset): ready for PATCH /:id/receive, exercising
  // the branch that does NOT create a new asset (matched_asset already exists).
  const [r10OrderedExisting] = await knex('procurement_requests')
    .insert({
      requested_by: engineer2.id,
      department: 'Engineering',
      request_type: 'existing_asset',
      item_name: 'Spare Desktop from Inventory',
      category_id: desktopsCat.id,
      quantity: 1,
      justification: 'Reusing an already-owned desktop instead of buying new.',
      estimated_cost: 0.0,
      matched_asset_id: existingDesktop.id,
      matched_notes: `Matched to ${existingDesktop.asset_number} (available).`,
      status: 'ordered',
      submitted_at: knex.raw("NOW() - INTERVAL '4 days'"),
      approved_at: knex.raw("NOW() - INTERVAL '3 days'"),
      ordered_at: knex.raw("NOW() - INTERVAL '1 day'"),
    })
    .returning('*');

  await knex('procurement_approvals').insert({
    procurement_id: r10OrderedExisting.id,
    approver_id: manager2.id,
    approver_role: 'manager',
    level: 1,
    status: 'approved',
    actioned_at: knex.raw("NOW() - INTERVAL '3 days'"),
  });

  // R11 — received: full lifecycle already complete, including the asset
  // that receiving created. Good for GET /:id/history and read-only checks.
  const [r11ReceivedAsset] = await knex('assets')
    .insert({
      name: 'Wireless Headset (from Procurement)',
      asset_tag: 'AST-0018',
      serial_number: 'HEADSET-BLR-0018',
      brand: 'Jabra',
      model: 'Evolve2 65',
      category_id: peripheralsCat.id,
      location_id: projectAlpha.id,
      supplier_id: dell.id,
      purchase_date: knex.raw("NOW() - INTERVAL '10 days'"),
      purchase_price: 8800.0,
      invoice_number: 'PO-2026-0077',
      status: 'available',
    })
    .returning('*');

  const [r11Received] = await knex('procurement_requests')
    .insert({
      requested_by: engineer1.id,
      department: 'Engineering',
      request_type: 'new_purchase',
      item_name: 'Wireless Headset (from Procurement)',
      category_id: peripheralsCat.id,
      quantity: 1,
      justification: 'For daily standups and client calls.',
      estimated_cost: 9000.0,
      quoted_cost: 8800.0,
      status: 'received',
      supplier_id: dell.id,
      po_number: 'PO-2026-0077',
      expected_delivery: knex.raw("NOW() - INTERVAL '11 days'"),
      actual_delivery: knex.raw("NOW() - INTERVAL '10 days'"),
      asset_id_created: r11ReceivedAsset.id,
      submitted_at: knex.raw("NOW() - INTERVAL '20 days'"),
      approved_at: knex.raw("NOW() - INTERVAL '18 days'"),
      ordered_at: knex.raw("NOW() - INTERVAL '15 days'"),
      received_at: knex.raw("NOW() - INTERVAL '10 days'"),
    })
    .returning('*');

  await knex('procurement_approvals').insert({
    procurement_id: r11Received.id,
    approver_id: manager1.id,
    approver_role: 'manager',
    level: 1,
    status: 'approved',
    comments: 'Approved for team productivity.',
    actioned_at: knex.raw("NOW() - INTERVAL '18 days'"),
  });

  // R12 — rejected: rejected at level 1, level 2 auto-skipped. Final state.
  const [r12Rejected] = await knex('procurement_requests')
    .insert({
      requested_by: engineer2.id,
      department: 'Engineering',
      request_type: 'new_purchase',
      item_name: 'Premium Office Sofa',
      category_id: peripheralsCat.id,
      quantity: 1,
      justification: 'Would improve the break room.',
      estimated_cost: 30000.0,
      status: 'rejected',
      rejection_reason: 'Not essential for the current budget cycle.',
      submitted_at: knex.raw("NOW() - INTERVAL '6 days'"),
    })
    .returning('*');

  await knex('procurement_approvals').insert([
    {
      procurement_id: r12Rejected.id,
      approver_id: invManager.id,
      approver_role: 'inventory_manager',
      level: 1,
      status: 'rejected',
      comments: 'Furniture upgrades are on hold this quarter.',
      actioned_at: knex.raw("NOW() - INTERVAL '5 days'"),
    },
    {
      procurement_id: r12Rejected.id,
      approver_id: manager1.id,
      approver_role: 'manager',
      level: 2,
      status: 'skipped',
    },
  ]);

  // R13 — cancelled: was pending_approval, requester cancelled it themselves.
  const [r13Cancelled] = await knex('procurement_requests')
    .insert({
      requested_by: engineer1.id,
      department: 'Engineering',
      request_type: 'new_purchase',
      item_name: 'Extra Monitor Arm',
      category_id: peripheralsCat.id,
      quantity: 1,
      justification: 'Wanted a third monitor arm.',
      estimated_cost: 7000.0, // above engineer1's self_approve_limit, so it routed
      status: 'cancelled',
      submitted_at: knex.raw("NOW() - INTERVAL '2 days'"),
    })
    .returning('*');

  await knex('procurement_approvals').insert({
    procurement_id: r13Cancelled.id,
    approver_id: manager1.id,
    approver_role: 'manager',
    level: 1,
    status: 'skipped',
  });

  // ══════════════════════════════════════════════════════════════════
  //  NOTIFICATIONS — procurement-triggered + general system types
  // ══════════════════════════════════════════════════════════════════
  await knex('notifications').insert([
    {
      user_id: manager1.id,
      type: 'procurement_submitted',
      title: 'Procurement request awaiting your approval',
      message: `Ergonomic Office Chair (₹15000) needs your sign-off at level ${r5Approval1.level}.`,
      entity_type: 'procurement',
      entity_id: r5PendingApprove.id,
    },
    {
      user_id: manager2.id,
      type: 'procurement_submitted',
      title: 'Procurement request awaiting your approval',
      message: `4K Gaming Monitor (₹18000) needs your sign-off at level ${r6Approval1.level}.`,
      entity_type: 'procurement',
      entity_id: r6PendingReject.id,
    },
    {
      // Only level 1 is notified for the multi-level chain — level 2 is dormant.
      user_id: invManager.id,
      type: 'procurement_submitted',
      title: 'Procurement request awaiting your approval',
      message: `Rack Server for CI Pipeline (₹60000) needs your sign-off at level ${r7Approval1.level}.`,
      entity_type: 'procurement',
      entity_id: r7MultiLevel.id,
    },
    {
      user_id: engineer2.id,
      type: 'procurement_rejected',
      title: 'Procurement request rejected',
      message: 'Your request for "Premium Office Sofa" was rejected.',
      entity_type: 'procurement',
      entity_id: r12Rejected.id,
      is_read: true,
      read_at: knex.raw("NOW() - INTERVAL '4 days'"),
    },
    {
      user_id: engineer1.id,
      type: 'procurement_received',
      title: 'Procurement item received',
      message: '"Wireless Headset (from Procurement)" has arrived and was added to inventory as AST-0018.',
      entity_type: 'procurement',
      entity_id: r11Received.id,
      is_read: true,
      read_at: knex.raw("NOW() - INTERVAL '9 days'"),
    },
    {
      user_id: null, // NULL = broadcast to all admins
      type: 'low_stock',
      title: 'Low stock: A4 Paper Ream',
      message: 'A4 Paper Ream is at 3 units, below the minimum threshold of 10.',
      entity_type: 'consumable',
      entity_id: paperStock.id,
    },
    {
      user_id: invManager.id,
      type: 'warranty_expiry',
      title: 'Warranty expiring soon',
      message: `${warrantyExpiringAsset.name} warranty expires within 30 days.`,
      entity_type: 'asset',
      entity_id: warrantyExpiringAsset.id,
    },
    {
      user_id: invManager.id,
      type: 'maintenance_due',
      title: 'Maintenance due soon',
      message: `${maintenanceAsset.name} is due for maintenance within 7 days.`,
      entity_type: 'asset',
      entity_id: maintenanceAsset.id,
    },
    {
      user_id: engineer2.id,
      type: 'overdue_return',
      title: 'Asset return overdue',
      message: `${overdueMonitorAsset.name} was due back on 2026-07-01.`,
      entity_type: 'asset',
      entity_id: overdueMonitorAsset.id,
    },
  ]);

  // ══════════════════════════════════════════════════════════════════
  //  ACTIVITY LOGS — one example of every log_type, for the
  //  maintenance_log / audit_log views and the /:id/history endpoint
  // ══════════════════════════════════════════════════════════════════
  await knex('activity_logs').insert([
    // log_type: 'data' — mirrors what auditFromReq() writes on real CRUD
    {
      log_type: 'data',
      action: 'CREATE',
      user_id: invManager.id,
      user_email: invManager.email,
      user_role: invManager.role,
      entity_type: 'asset',
      entity_id: existingLaptop.id,
      after_value: JSON.stringify({ status: 'available', name: existingLaptop.name }),
      title: 'Asset created',
      created_at: knex.raw("NOW() - INTERVAL '30 days'"),
    },
    {
      log_type: 'data',
      action: 'RETIRE',
      user_id: invManager.id,
      user_email: invManager.email,
      user_role: invManager.role,
      entity_type: 'asset',
      entity_id: retiredAsset.id,
      before_value: JSON.stringify({ status: 'available' }),
      after_value: JSON.stringify({ status: 'retired' }),
      title: 'Asset retired',
      description: 'End of life — replaced by newer hardware.',
    },
    {
      log_type: 'data',
      action: 'PROCUREMENT_RAISED',
      user_id: engineer2.id,
      user_email: engineer2.email,
      user_role: engineer2.role,
      entity_type: 'procurement',
      entity_id: r12Rejected.id,
      after_value: JSON.stringify({ status: 'submitted', item_name: 'Premium Office Sofa' }),
      title: 'Procurement request raised',
      created_at: knex.raw("NOW() - INTERVAL '6 days'"),
    },
    {
      log_type: 'data',
      action: 'PROCUREMENT_REJECTED',
      user_id: invManager.id,
      user_email: invManager.email,
      user_role: invManager.role,
      entity_type: 'procurement',
      entity_id: r12Rejected.id,
      before_value: JSON.stringify({ status: 'pending_approval' }),
      after_value: JSON.stringify({ status: 'rejected' }),
      title: 'Procurement request rejected',
      created_at: knex.raw("NOW() - INTERVAL '5 days'"),
    },
    {
      log_type: 'data',
      action: 'PROCUREMENT_RAISED',
      user_id: engineer1.id,
      user_email: engineer1.email,
      user_role: engineer1.role,
      entity_type: 'procurement',
      entity_id: r11Received.id,
      title: 'Procurement request raised',
      created_at: knex.raw("NOW() - INTERVAL '20 days'"),
    },
    {
      log_type: 'data',
      action: 'PROCUREMENT_ORDERED',
      user_id: invManager.id,
      user_email: invManager.email,
      user_role: invManager.role,
      entity_type: 'procurement',
      entity_id: r11Received.id,
      title: 'Purchase order raised',
      created_at: knex.raw("NOW() - INTERVAL '15 days'"),
    },
    {
      log_type: 'data',
      action: 'PROCUREMENT_RECEIVED',
      user_id: invManager.id,
      user_email: invManager.email,
      user_role: invManager.role,
      entity_type: 'procurement',
      entity_id: r11Received.id,
      after_value: JSON.stringify({ status: 'received', asset_id_created: r11ReceivedAsset.id }),
      title: 'Procurement item received',
      created_at: knex.raw("NOW() - INTERVAL '10 days'"),
    },

    // log_type: 'maintenance'
    {
      log_type: 'maintenance',
      maintenance_type: 'repair',
      maintenance_status: 'in_progress',
      entity_type: 'asset',
      entity_id: maintenanceAsset.id,
      scheduled_date: knex.raw("(NOW() + INTERVAL '5 days')::date"),
      performed_by: 'HP Authorized Service Center',
      vendor_id: hp.id,
      title: 'Printer paper-jam sensor repair',
      description: 'Recurring paper jams reported by Common Area users.',
    },

    // log_type: 'audit'
    {
      log_type: 'audit',
      audit_type: 'health_audit',
      entity_type: 'location',
      title: 'Q3 Bangalore Engineering Hardware Audit',
      description: 'Physical verification of all Engineering-floor assets.',
      scheduled_date: knex.raw("(NOW() + INTERVAL '14 days')::date"),
      performed_by: 'Vikram Chawla (Internal Audit)',
    },

    // log_type: 'system'
    {
      log_type: 'system',
      action: 'LOGIN',
      user_id: admin.id,
      user_email: admin.email,
      user_role: admin.role,
      ip_address: '10.0.1.12',
      title: 'Admin login',
    },
    {
      log_type: 'system',
      action: 'LOGIN_FAILED',
      user_email: lockedUser.email,
      user_role: 'engineer',
      ip_address: '10.0.1.55',
      title: 'Failed login — account locked after repeated attempts',
    },
  ]);

  console.log('002_test_scenarios: seeded users, assets, assignments, reallocations,');
  console.log('  licenses, consumables, and 13 procurement requests covering every status.');
};
