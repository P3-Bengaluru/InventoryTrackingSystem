const crypto = require('crypto');
const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');
const { auditFromReq } = require('../utils/audit');

const STATUS_LABELS = {
  available: 'Available',
  assigned: 'Assigned',
  maintenance: 'Under Maintenance',
  retired: 'Retired',
  lost: 'Lost',
  disposed: 'Disposed',
  in_transit: 'In Transit',
};

const VALID_STATUSES = ['available', 'assigned', 'maintenance', 'retired', 'lost', 'disposed', 'in_transit'];

async function getLocationFullPath(locationId) {
  if (!locationId) return null;
  const parts = [];
  let current = await db('locations').where({ id: locationId }).first();
  while (current) {
    parts.unshift(current.name);
    if (!current.parent_id) break;
    // fetch parent
    // eslint-disable-next-line no-await-in-loop
    current = await db('locations').where({ id: current.parent_id }).first();
  }
  return parts.length ? parts.join(' / ') : null;
}

function buildAssetQuery(filters = {}) {
  const query = db('assets')
    .select(
      'assets.*',
      'categories.name as category_name',
      'categories.type as category_type',
      'l.name as location_name',
      'u.name as assigned_to_name',
      'u.employee_id as assigned_to_emp_id',
      's.name as supplier_name',
      'c.name as customer_name',
      'c.customer_code as customer_code'
    )
    .leftJoin('categories', 'assets.category_id', 'categories.id')
    .leftJoin('locations as l', 'assets.location_id', 'l.id')
    .leftJoin('users as u', 'assets.assigned_to', 'u.id')
    .leftJoin('suppliers as s', 'assets.supplier_id', 's.id')
    .leftJoin('customers as c', 'assets.customer_id', 'c.id')
    .where('assets.is_active', true);

  if (filters.search) {
    query.andWhere(function () {
      this.whereILike('assets.name', `%${filters.search}%`)
        .orWhereILike('assets.serial_number', `%${filters.search}%`)
        .orWhereILike('assets.asset_tag', `%${filters.search}%`)
        .orWhereILike('assets.asset_number', `%${filters.search}%`);
    });
  }
  if (filters.status) query.andWhere({ 'assets.status': filters.status });
  if (filters.category_id) query.andWhere({ 'assets.category_id': filters.category_id });
  if (filters.location_id) query.andWhere({ 'assets.location_id': filters.location_id });
  if (filters.supplier_id) query.andWhere({ 'assets.supplier_id': filters.supplier_id });
  if (filters.customer_id) query.andWhere({ 'assets.customer_id': filters.customer_id });
  if (filters.is_customer_provided === 'true') query.andWhereNotNull('assets.customer_id');

  const sortBy = filters.sort_by || 'created_at';
  const sortOrder = filters.sort_order === 'asc' ? 'asc' : 'desc';
  const sortMap = {
    name: 'assets.name',
    created_at: 'assets.created_at',
    status: 'assets.status',
    warranty_expiry: 'assets.warranty_expiry',
    purchase_date: 'assets.purchase_date',
  };
  query.orderBy(sortMap[sortBy] || 'assets.created_at', sortOrder);

  return query;
}

async function getAll(filters = {}) {
  const rows = await buildAssetQuery(filters);
  for (const r of rows) {
    // eslint-disable-next-line no-await-in-loop
    r.location_path = await getLocationFullPath(r.location_id);
  }
  return rows;
}

async function getById(id) {
  const asset = await db('assets')
    .select(
      'assets.*',
      'categories.name as category_name',
      'categories.type as category_type',
      'l.name as location_name',
      'u.name as assigned_to_name',
      'u.employee_id as assigned_to_emp_id',
      's.name as supplier_name',
      'c.name as customer_name',
      'c.customer_code as customer_code',
      'c.contact_person as customer_contact_person'
    )
    .leftJoin('categories', 'assets.category_id', 'categories.id')
    .leftJoin('locations as l', 'assets.location_id', 'l.id')
    .leftJoin('users as u', 'assets.assigned_to', 'u.id')
    .leftJoin('suppliers as s', 'assets.supplier_id', 's.id')
    .leftJoin('customers as c', 'assets.customer_id', 'c.id')
    .where({ 'assets.id': id })
    .first();
  if (!asset) throw new AppError('Asset not found', 404);
  asset.location_path = await getLocationFullPath(asset.location_id);
  return asset;
}

async function getByQrToken(token) {
  const asset = await db('assets')
    .select(
      'assets.id',
      'assets.asset_number',
      'assets.name',
      'assets.asset_tag',
      'assets.serial_number',
      'assets.brand',
      'assets.model',
      'assets.status',
      'assets.warranty_expiry',
      'assets.photo_url',
      'assets.qr_token',
      'assets.customer_id',
      'assets.customer_reference',
      'assets.assigned_to',
      'categories.name as category_name',
      'u.name as assigned_to_name',
      'c.name as customer_name'
    )
    .leftJoin('categories', 'assets.category_id', 'categories.id')
    .leftJoin('users as u', 'assets.assigned_to', 'u.id')
    .leftJoin('customers as c', 'assets.customer_id', 'c.id')
    .where({ 'assets.qr_token': token, 'assets.is_active': true })
    .first();
  if (!asset) throw new AppError('Asset not found', 404);
  asset.location_path = await getLocationFullPath(asset.location_id);
  return asset;
}


async function generateAssetNumber(prefix, trx) {
  const counter = await trx('asset_number_counters')
    .where({ prefix })
    .select('next_number')
    .forUpdate()
    .first();

  if (!counter) {
    await trx('asset_number_counters').insert({ prefix, next_number: 2 });
    return `${prefix}-00001`;
  }

  const nextNum = counter.next_number;
  await trx('asset_number_counters').where({ prefix }).update({ next_number: nextNum + 1 });
  return `${prefix}-${String(nextNum).padStart(5, '0')}`;
}

async function create(data, req) {
  const result = await db.transaction(async (trx) => {
    const assetNumber = await generateAssetNumber(prefix, trx);

    const [asset] = await trx('assets')
      .insert({
        asset_number: assetNumber,
        name: data.name,
        asset_tag: data.asset_tag || null,
        serial_number: data.serial_number || null,
        brand: data.brand || null,
        model: data.model || null,
        specifications: data.specifications ? JSON.stringify(data.specifications) : null,
        category_id: data.category_id,
        location_id: data.location_id || null,
        supplier_id: data.supplier_id || null,
        customer_id: data.customer_id || null,
        customer_reference: data.customer_reference || null,
        received_from_customer_date: data.received_from_customer_date || null,
        purchase_date: data.purchase_date || null,
        purchase_price: data.purchase_price || null,
        invoice_number: data.invoice_number || null,
        warranty_expiry: data.warranty_expiry || null,
        warranty_terms: data.warranty_terms || null,
        status: data.status || 'available',
        assigned_to: data.assigned_to || null,
        assigned_since: data.assigned_since || null,
        return_required: data.return_required || false,
        next_maintenance_date: data.next_maintenance_date || null,
        maintenance_interval_days: data.maintenance_interval_days || null,
        qr_token: crypto.randomBytes(32).toString('hex'),
        photo_url: data.photo_url || null,
        notes: data.notes || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('id');

    return asset;
  });

  const created = await getById(result.id);
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'CREATE',
      entity_type: 'asset',
      entity_id: result.id,
      after_value: created,
    });
  }
  return created;
}

async function update(id, data, req) {
  const asset = await db('assets').where({ id }).first();
  if (!asset) throw new AppError('Asset not found', 404);
  const before = { ...asset };

  const updateData = { updated_at: new Date() };
  const allowed = [
    'name',
    'asset_tag',
    'serial_number',
    'brand',
    'model',
    'specifications',
    'category_id',
    'location_id',
    'supplier_id',
    'customer_id',
    'customer_reference',
    'received_from_customer_date',
    'purchase_date',
    'purchase_price',
    'invoice_number',
    'warranty_expiry',
    'warranty_terms',
    'return_required',
    'next_maintenance_date',
    'maintenance_interval_days',
    'photo_url',
    'notes',
  ];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updateData[key] = data[key];
      if (key === 'specifications' && typeof data[key] === 'object') {
        updateData[key] = JSON.stringify(data[key]);
      }
    }
  }

  await db('assets').where({ id }).update(updateData);
  const updated = await getById(id);

  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'UPDATE',
      entity_type: 'asset',
      entity_id: id,
      before_value: before,
      after_value: updated,
    });
  }
  return updated;
}

async function updateStatus(id, status, req) {
  if (!VALID_STATUSES.includes(status)) throw new AppError('Invalid status', 400);
  const asset = await db('assets').where({ id }).first();
  if (!asset) throw new AppError('Asset not found', 404);
  const before = { ...asset };

  const updateData = { status, updated_at: new Date() };
  if (status === 'available') {
    updateData.assigned_to = null;
    updateData.assigned_since = null;
  }

  await db('assets').where({ id }).update(updateData);
  const updated = await getById(id);

  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'UPDATE',
      entity_type: 'asset',
      entity_id: id,
      before_value: before,
      after_value: updated,
      description: `Status changed to ${status}`,
    });
  }
  return updated;
}

async function retire(id, req) {
  const asset = await db('assets').where({ id }).first();
  if (!asset) throw new AppError('Asset not found', 404);
  const before = { ...asset };
  await db('assets').where({ id }).update({
    status: 'retired',
    is_active: false,
    assigned_to: null,
    assigned_since: null,
    updated_at: new Date(),
  });
  const updated = await getById(id);
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'RETIRE',
      entity_type: 'asset',
      entity_id: id,
      before_value: before,
      after_value: updated,
    });
  }
  return updated;
}

async function softDelete(id, req) {
  const asset = await db('assets').where({ id }).first();
  if (!asset) throw new AppError('Asset not found', 404);
  await db('assets').where({ id }).update({ is_active: false, updated_at: new Date() });
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'DELETE',
      entity_type: 'asset',
      entity_id: id,
    });
  }
  return { success: true };
}

async function getHistory(id) {
  return db('activity_logs')
    .select(
      'id',
      'log_type',
      'action',
      'user_email',
      'user_role',
      'before_value',
      'after_value',
      'description',
      'ip_address',
      'created_at'
    )
    .where({ entity_type: 'asset', entity_id: id })
    .orderBy('created_at', 'desc');
}

async function getStats() {
  const total = await db('assets').where({ is_active: true }).count('* as total').first();
  const byStatus = await db('assets')
    .where({ is_active: true })
    .select('status')
    .count('* as count')
    .groupBy('status');

  const today = new Date().toISOString().split('T')[0];
  const maintenanceDue = await db('assets')
    .where({ is_active: true })
    .whereNotNull('next_maintenance_date')
    .where('next_maintenance_date', '<=', today)
    .count('* as total')
    .first();

  const warrantyExpiring = await db('assets')
    .where({ is_active: true })
    .whereNotNull('warranty_expiry')
    .where('warranty_expiry', '>=', today)
    .where('warranty_expiry', '<=', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0])
    .count('* as total')
    .first();

  return {
    total: parseInt(total.total, 10),
    byStatus: byStatus.reduce((acc, s) => {
      acc[s.status] = parseInt(s.count, 10);
      return acc;
    }, {}),
    maintenanceDue: parseInt(maintenanceDue.total, 10),
    warrantyExpiring: parseInt(warrantyExpiring.total, 10),
  };
}

async function rotateQrToken(id, req) {
  const asset = await db('assets').where({ id }).first();
  if (!asset) throw new AppError('Asset not found', 404);
  const newToken = crypto.randomBytes(32).toString('hex');
  await db('assets').where({ id }).update({ qr_token: newToken, updated_at: new Date() });
  if (req) {
    await auditFromReq(req, {
      log_type: 'audit',
      action: 'UPDATE',
      entity_type: 'asset',
      entity_id: id,
      description: 'QR token rotated',
    });
  }
  return { qr_token: newToken };
}

async function getMine(userId) {
  return db('assets')
    .select(
      'assets.id',
      'assets.asset_number',
      'assets.name',
      'assets.status',
      'assets.brand',
      'assets.model',
      'assets.photo_url',
      'assets.warranty_expiry',
      'assets.qr_token',
      'categories.name as category_name',
      'l.name as location_name'
    )
    .leftJoin('categories', 'assets.category_id', 'categories.id')
    .leftJoin('locations as l', 'assets.location_id', 'l.id')
    .where({ 'assets.assigned_to': userId, 'assets.is_active': true })
    .orderBy('assets.name', 'asc');
}

module.exports = {
  getAll,
  getById,
  getByQrToken,
  create,
  update,
  updateStatus,
  retire,
  softDelete,
  getHistory,
  getStats,
  rotateQrToken,
  getMine,
  generateAssetNumber,
  STATUS_LABELS,
  VALID_STATUSES,
};
