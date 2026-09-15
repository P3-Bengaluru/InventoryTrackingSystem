const cron = require('node-cron');
const { db } = require('../models/db');
const { createNotification } = require('./notifications');
const { sendEmail } = require('./email');

async function getSetting(key, defaultVal) {
  const row = await db('system_settings').where({ key }).first();
  return row ? row.value : defaultVal;
}

async function checkOverdueReturns() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const overdue = await db('assignments')
      .where({ status: 'assigned' })
      .whereNotNull('expected_return')
      .where('expected_return', '<', today)
      .where('return_required', true);

    for (const a of overdue) {
      await db('assignments').where({ id: a.id }).update({ status: 'overdue' });
      await createNotification({
        userId: a.user_id,
        type: 'overdue_return',
        title: 'Overdue Asset Return',
        message: `Your assigned asset is overdue for return (expected: ${a.expected_return}).`,
        entityType: 'assignment',
        entityId: a.id,
      });
    }
    if (overdue.length > 0) {
      console.log(`[Cron] Marked ${overdue.length} assignments as overdue`);
    }
  } catch (err) {
    console.error('[Cron] Overdue check failed:', err.message);
  }
}

async function checkWarrantyExpiry() {
  try {
    const alertDays = parseInt(await getSetting('warranty_alert_days', '30'), 10);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + alertDays);
    const thresholdDate = threshold.toISOString().split('T')[0];

    const expiring = await db('assets')
      .where('is_active', true)
      .whereNotNull('warranty_expiry')
      .where('warranty_expiry', '<=', thresholdDate)
      .where('warranty_expiry', '>=', new Date().toISOString().split('T')[0]);

    for (const asset of expiring) {
      if (asset.assigned_to) {
        await createNotification({
          userId: asset.assigned_to,
          type: 'warranty_expiry',
          title: 'Warranty Expiring Soon',
          message: `Asset ${asset.asset_number} warranty expires on ${asset.warranty_expiry.toISOString ? asset.warranty_expiry.toISOString().split('T')[0] : asset.warranty_expiry}.`,
          entityType: 'asset',
          entityId: asset.id,
        });
      }
    }
    if (expiring.length > 0) {
      console.log(`[Cron] ${expiring.length} assets with warranty expiring soon`);
    }
  } catch (err) {
    console.error('[Cron] Warranty check failed:', err.message);
  }
}

async function checkMaintenanceDue() {
  try {
    const alertDays = parseInt(await getSetting('maintenance_alert_days', '7'), 10);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + alertDays);
    const thresholdDate = threshold.toISOString().split('T')[0];

    const due = await db('assets')
      .where('is_active', true)
      .whereNotNull('next_maintenance_date')
      .where('next_maintenance_date', '<=', thresholdDate);

    for (const asset of due) {
      if (asset.assigned_to) {
        await createNotification({
          userId: asset.assigned_to,
          type: 'maintenance_due',
          title: 'Maintenance Due Soon',
          message: `Asset ${asset.asset_number} has maintenance scheduled on ${asset.next_maintenance_date.toISOString ? asset.next_maintenance_date.toISOString().split('T')[0] : asset.next_maintenance_date}.`,
          entityType: 'asset',
          entityId: asset.id,
        });
      }
    }
    if (due.length > 0) {
      console.log(`[Cron] ${due.length} assets with maintenance due soon`);
    }
  } catch (err) {
    console.error('[Cron] Maintenance check failed:', err.message);
  }
}

function startCronJobs() {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running daily checks...');
    await checkOverdueReturns();
    await checkWarrantyExpiry();
    await checkMaintenanceDue();
  });

  console.log('[Cron] Scheduled daily checks at 09:00');
}

module.exports = { startCronJobs, checkOverdueReturns, checkWarrantyExpiry, checkMaintenanceDue };
