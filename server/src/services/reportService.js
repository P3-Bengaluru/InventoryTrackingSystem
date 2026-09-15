const { db } = require('../models/db');

function applyRegionFilter(query, filters) {
  if (filters.location_id) {
    query.andWhere({ 'assets.location_id': filters.location_id });
  }
  if (filters.city) {
    query.andWhere('l_full.full_path', 'ilike', `%${filters.city}%`);
  }
  if (filters.customer_id) {
    query.andWhere({ 'assets.customer_id': filters.customer_id });
  }
  return query;
}

async function assetRegister(filters = {}) {
  let query = db('assets')
    .select(
      'assets.asset_number',
      'assets.name',
      'assets.serial_number',
      'assets.asset_tag',
      'assets.brand',
      'assets.model',
      'assets.status',
      'assets.purchase_date',
      'assets.purchase_price',
      'assets.warranty_expiry',
      'categories.name as category_name',
      'l_full.full_path as location_path',
      'u.name as assigned_to_name',
      's.name as supplier_name',
      'c.name as customer_name'
    )
    .leftJoin('categories', 'assets.category_id', 'categories.id')
    .leftJoin('location_full_path as l_full', 'assets.location_id', 'l_full.id')
    .leftJoin('users as u', 'assets.assigned_to', 'u.id')
    .leftJoin('suppliers as s', 'assets.supplier_id', 's.id')
    .leftJoin('customers as c', 'assets.customer_id', 'c.id')
    .where('assets.is_active', true);

  query = applyRegionFilter(query, filters);

  if (filters.from) query.andWhere('assets.created_at', '>=', filters.from);
  if (filters.to) query.andWhere('assets.created_at', '<=', filters.to);

  query.orderBy('assets.asset_number', 'asc');
  return query;
}

async function checkoutHistory(filters = {}) {
  let query = db('assignments')
    .select(
      'assignments.id',
      'a.asset_number',
      'a.name as asset_name',
      'u.name as user_name',
      'u.employee_id as user_employee_id',
      'assignments.status',
      'assignments.requested_at',
      'assignments.approved_at',
      'assignments.assigned_since',
      'assignments.expected_return',
      'assignments.returned_at',
      'assignments.return_condition',
      'ap.name as approver_name'
    )
    .leftJoin('assets as a', 'assignments.asset_id', 'a.id')
    .leftJoin('users as u', 'assignments.user_id', 'u.id')
    .leftJoin('users as ap', 'assignments.approved_by', 'ap.id');

  if (filters.from) query.andWhere('assignments.created_at', '>=', filters.from);
  if (filters.to) query.andWhere('assignments.created_at', '<=', filters.to);

  query.orderBy('assignments.created_at', 'desc');
  return query;
}

async function activityLog(filters = {}) {
  let query = db('activity_logs')
    .select(
      'activity_logs.id',
      'activity_logs.log_type',
      'activity_logs.action',
      'activity_logs.user_email',
      'activity_logs.user_role',
      'activity_logs.entity_type',
      'activity_logs.entity_id',
      'activity_logs.description',
      'activity_logs.ip_address',
      'activity_logs.created_at'
    );

  if (filters.log_type) query.andWhere({ log_type: filters.log_type });
  if (filters.from) query.andWhere('created_at', '>=', filters.from);
  if (filters.to) query.andWhere('created_at', '<=', filters.to);

  query.orderBy('created_at', 'desc');
  return query;
}

async function procurementReport(filters = {}) {
  let query = db('procurement_requests')
    .select(
      'procurement_requests.id',
      'procurement_requests.item_name',
      'procurement_requests.status',
      'procurement_requests.priority',
      'procurement_requests.quantity',
      'procurement_requests.estimated_cost',
      'procurement_requests.quoted_cost',
      'procurement_requests.currency',
      'procurement_requests.po_number',
      'u.name as requested_by_name',
      's.name as supplier_name',
      'procurement_requests.created_at',
      'procurement_requests.approved_at',
      'procurement_requests.ordered_at',
      'procurement_requests.received_at'
    )
    .leftJoin('users as u', 'procurement_requests.requested_by', 'u.id')
    .leftJoin('suppliers as s', 'procurement_requests.supplier_id', 's.id');

  if (filters.from) query.andWhere('procurement_requests.created_at', '>=', filters.from);
  if (filters.to) query.andWhere('procurement_requests.created_at', '<=', filters.to);

  query.orderBy('procurement_requests.created_at', 'desc');
  return query;
}

function toCSV(rows, columns) {
  if (!rows || rows.length === 0) return columns.join(',') + '\n';
  const header = columns.map((c) => `"${c}"`).join(',');
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [header, ...lines].join('\n') + '\n';
}

module.exports = {
  assetRegister,
  checkoutHistory,
  activityLog,
  procurementReport,
  toCSV,
  applyRegionFilter,
};
