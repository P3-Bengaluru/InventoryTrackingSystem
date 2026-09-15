const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');
const { auditFromReq } = require('../utils/audit');

async function getAll(filters = {}) {
  const query = db('activity_logs').select(
    'id',
    'log_type',
    'audit_type',
    'maintenance_type',
    'maintenance_status',
    'action',
    'user_email',
    'user_role',
    'entity_type',
    'entity_id',
    'scheduled_date',
    'completed_date',
    'performed_by',
    'cost',
    'invoice_number',
    'next_maintenance_date',
    'title',
    'description',
    'findings',
    'ip_address',
    'created_at'
  );

  if (filters.log_type) query.andWhere({ log_type: filters.log_type });
  if (filters.action) query.andWhere({ action: filters.action });
  if (filters.entity_type) query.andWhere({ entity_type: filters.entity_type });
  if (filters.entity_id) query.andWhere({ entity_id: filters.entity_id });
  if (filters.user_id) query.andWhere({ user_id: filters.user_id });
  if (filters.from) query.andWhere('created_at', '>=', filters.from);
  if (filters.to) query.andWhere('created_at', '<=', filters.to);

  query.orderBy('created_at', 'desc');
  return query;
}

async function getForEntity(entityType, entityId) {
  return db('activity_logs')
    .select('*')
    .where({ entity_type: entityType, entity_id: entityId })
    .orderBy('created_at', 'desc');
}

async function createMaintenance(data, req) {
  const [log] = await db('activity_logs')
    .insert({
      log_type: 'maintenance',
      maintenance_type: data.maintenance_type || 'repair',
      maintenance_status: data.maintenance_status || 'scheduled',
      action: 'UPDATE',
      user_id: req.user.id,
      user_email: req.user.email,
      user_role: req.user.role,
      entity_type: 'asset',
      entity_id: data.asset_id,
      scheduled_date: data.scheduled_date || null,
      completed_date: data.completed_date || null,
      performed_by: data.performed_by || req.user.name,
      vendor_id: data.vendor_id || null,
      cost: data.cost || null,
      invoice_number: data.invoice_number || null,
      next_maintenance_date: data.next_maintenance_date || null,
      title: data.title || null,
      description: data.description || null,
      findings: data.findings || null,
      notes: data.notes || null,
      created_at: new Date(),
    })
    .returning('id');

  if (data.next_maintenance_date && data.asset_id) {
    await db('assets').where({ id: data.asset_id }).update({
      next_maintenance_date: data.next_maintenance_date,
      updated_at: new Date(),
    });
  }

  if (data.maintenance_status === 'in_progress' && data.asset_id) {
    await db('assets').where({ id: data.asset_id }).update({
      status: 'maintenance',
      updated_at: new Date(),
    });
  }

  if (data.maintenance_status === 'completed' && data.asset_id) {
    const asset = await db('assets').where({ id: data.asset_id }).first();
    if (asset && asset.status === 'maintenance') {
      await db('assets').where({ id: data.asset_id }).update({
        status: asset.assigned_to ? 'assigned' : 'available',
        updated_at: new Date(),
      });
    }
  }

  return db('activity_logs').where({ id: log.id }).first();
}

module.exports = {
  getAll,
  getForEntity,
  createMaintenance,
};
