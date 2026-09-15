const { db } = require('../models/db');

async function auditLog(entry) {
  try {
    await db('activity_logs').insert({
      log_type: entry.log_type || 'audit',
      audit_type: entry.audit_type || null,
      maintenance_type: entry.maintenance_type || null,
      maintenance_status: entry.maintenance_status || null,
      action: entry.action || null,
      user_id: entry.user_id || null,
      user_email: entry.user_email || null,
      user_role: entry.user_role || null,
      entity_type: entry.entity_type || null,
      entity_id: entry.entity_id || null,
      scheduled_date: entry.scheduled_date || null,
      completed_date: entry.completed_date || null,
      performed_by: entry.performed_by || null,
      vendor_id: entry.vendor_id || null,
      before_value: entry.before_value ? JSON.stringify(entry.before_value) : null,
      after_value: entry.after_value ? JSON.stringify(entry.after_value) : null,
      cost: entry.cost || null,
      invoice_number: entry.invoice_number || null,
      next_maintenance_date: entry.next_maintenance_date || null,
      title: entry.title || null,
      description: entry.description || null,
      findings: entry.findings || null,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
      notes: entry.notes || null,
    });
  } catch (err) {
    console.error('[Audit] Failed to log:', err.message);
  }
}

function auditFromReq(req, entry) {
  return auditLog({
    ...entry,
    user_id: req.user?.id || null,
    user_email: req.user?.email || null,
    user_role: req.user?.role || null,
    ip_address: req.ip || req.socket?.remoteAddress || null,
    user_agent: req.headers?.['user-agent'] || null,
  });
}

module.exports = { auditLog, auditFromReq };
