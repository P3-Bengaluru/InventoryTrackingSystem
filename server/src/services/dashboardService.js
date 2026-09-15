const { db } = require('../models/db');

async function getStats() {
  const totalAssets = await db('assets').where({ is_active: true }).count('* as total').first();
  const assignedAssets = await db('assets').where({ is_active: true, status: 'assigned' }).count('* as total').first();
  const today = new Date().toISOString().split('T')[0];
  const maintenanceDue = await db('assets')
    .where({ is_active: true })
    .whereNotNull('next_maintenance_date')
    .where('next_maintenance_date', '<=', today)
    .count('* as total')
    .first();

  const totalUsers = await db('users').where({ is_active: true }).count('* as total').first();
  const pendingApprovals = await db('procurement_requests').where({ status: 'pending_approval' }).count('* as total').first();
  const pendingAssignments = await db('assignments').where({ status: 'pending' }).count('* as total').first();
  const pendingReallocations = await db('reallocations').where({ status: 'pending' }).count('* as total').first();

  const warrantyExpiring = await db('assets')
    .where({ is_active: true })
    .whereNotNull('warranty_expiry')
    .where('warranty_expiry', '>=', today)
    .where('warranty_expiry', '<=', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0])
    .count('* as total')
    .first();

  return {
    totalAssets: parseInt(totalAssets.total, 10),
    assignedAssets: parseInt(assignedAssets.total, 10),
    maintenanceDue: parseInt(maintenanceDue.total, 10),
    totalUsers: parseInt(totalUsers.total, 10),
    pendingApprovals: parseInt(pendingApprovals.total, 10),
    pendingAssignments: parseInt(pendingAssignments.total, 10),
    pendingReallocations: parseInt(pendingReallocations.total, 10),
    warrantyExpiring: parseInt(warrantyExpiring.total, 10),
  };
}

async function getTrend(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const checkouts = await db('assignments')
    .select(db.raw("DATE(created_at) as date"))
    .count('* as count')
    .where('created_at', '>=', startDate)
    .groupByRaw("DATE(created_at)")
    .orderByRaw("DATE(created_at) asc");

  const returns = await db('assignments')
    .select(db.raw("DATE(returned_at) as date"))
    .count('* as count')
    .where('returned_at', '>=', startDate)
    .whereNotNull('returned_at')
    .groupByRaw("DATE(returned_at)")
    .orderByRaw("DATE(returned_at) asc");

  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const checkout = checkouts.find((c) => c.date && c.date.toISOString().split('T')[0] === dateStr);
    const ret = returns.find((r) => r.date && r.date.toISOString().split('T')[0] === dateStr);
    trend.push({
      date: dateStr,
      checkouts: checkout ? parseInt(checkout.count, 10) : 0,
      returns: ret ? parseInt(ret.count, 10) : 0,
    });
  }
  return trend;
}

async function getRecentActivity(limit = 20) {
  return db('activity_logs')
    .select(
      'id',
      'log_type',
      'action',
      'user_email',
      'user_role',
      'entity_type',
      'description',
      'created_at'
    )
    .orderBy('created_at', 'desc')
    .limit(limit);
}

module.exports = { getStats, getTrend, getRecentActivity };
