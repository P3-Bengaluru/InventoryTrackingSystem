const nodemailer = require('nodemailer');
const { db } = require('../models/db');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  let host = process.env.SMTP_HOST;
  let port = parseInt(process.env.SMTP_PORT || '587', 10);
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let from = process.env.SMTP_FROM || 'inventory@office.local';

  if (!host) {
    const settings = await db('system_settings').whereIn('key', [
      'smtp_host',
      'smtp_port',
      'smtp_user',
      'smtp_pass',
      'smtp_from',
    ]);
    const map = {};
    settings.forEach((s) => (map[s.key] = s.value));
    host = map.smtp_host || host;
    port = parseInt(map.smtp_port || port, 10);
    user = map.smtp_user || user;
    pass = map.smtp_pass || pass;
    from = map.smtp_from || from;
  }

  if (!host) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  transporter._fromAddress = from;
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  try {
    const t = await getTransporter();
    if (!t) {
      console.log('[Email] SMTP not configured, skipping send to:', to);
      return false;
    }
    await t.sendMail({
      from: t._fromAddress,
      to,
      subject,
      text,
      html: html || text,
    });
    console.log('[Email] Sent to:', to);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
    return false;
  }
}

module.exports = { sendEmail, getTransporter };
