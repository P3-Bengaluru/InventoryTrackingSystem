const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../models/db');
const { AppError } = require('../middleware/errorHandler');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../middleware/auth');
const { auditLog } = require('../utils/audit');

const REFRESH_TOKEN_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

async function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

async function login(email, password, req) {
  const user = await db('users').where({ email: email.toLowerCase().trim() }).first();
  if (!user) {
    await auditLog({
      log_type: 'audit',
      action: 'LOGIN_FAILED',
      user_email: email,
      ip_address: req.ip,
      user_agent: req.headers?.['user-agent'],
      description: 'Login attempt with unknown email',
    });
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.is_active) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    throw new AppError(`Account locked. Try again in ${remaining} minute(s).`, 423);
  }

  const match = await comparePassword(password, user.password_hash);
  if (!match) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    const updateData = { failed_login_attempts: attempts };
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);
      updateData.locked_until = lockedUntil;
      updateData.failed_login_attempts = 0;
    }
    await db('users').where({ id: user.id }).update(updateData);

    await auditLog({
      log_type: 'audit',
      action: 'LOGIN_FAILED',
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      ip_address: req.ip,
      user_agent: req.headers?.['user-agent'],
      description: 'Incorrect password',
    });
    throw new AppError('Invalid email or password', 401);
  }

  await db('users').where({ id: user.id }).update({
    failed_login_attempts: 0,
    locked_until: null,
    last_login_at: new Date(),
  });

  const accessToken = signAccessToken(user);
  const refreshToken = await generateRefreshToken();
  const refreshTokenHash = await hashToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await db('refresh_tokens').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    token_hash: refreshTokenHash,
    expires_at: expiresAt,
    is_revoked: false,
    ip_address: req.ip || null,
    user_agent: req.headers?.['user-agent'] || null,
    created_at: new Date(),
  });

  await auditLog({
    log_type: 'audit',
    action: 'LOGIN',
    user_id: user.id,
    user_email: user.email,
    user_role: user.role,
    ip_address: req.ip,
    user_agent: req.headers?.['user-agent'],
    entity_type: 'user',
    entity_id: user.id,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      employee_id: user.employee_id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      phone: user.phone,
      manager_id: user.manager_id,
      self_approve_limit: user.self_approve_limit,
      budget_limit: user.budget_limit,
    },
  };
}

async function refresh(refreshToken, req) {
  if (!refreshToken) throw new AppError('Refresh token required', 401);

  const tokenHash = await hashToken(refreshToken);
  const stored = await db('refresh_tokens').where({ token_hash: tokenHash }).first();

  if (!stored || stored.is_revoked || new Date(stored.expires_at) < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  await db('refresh_tokens').where({ id: stored.id }).update({ is_revoked: true });

  const user = await db('users').where({ id: stored.user_id }).first();
  if (!user || !user.is_active) {
    throw new AppError('User not found or inactive', 401);
  }

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = await generateRefreshToken();
  const newRefreshHash = await hashToken(newRefreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await db('refresh_tokens').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    token_hash: newRefreshHash,
    expires_at: expiresAt,
    is_revoked: false,
    ip_address: req.ip || null,
    user_agent: req.headers?.['user-agent'] || null,
    created_at: new Date(),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
async function logout(refreshToken, req) {
  if (!refreshToken) {
    return { success: true };
  }
  const tokenHash = await hashToken(refreshToken);
  await db('refresh_tokens').where({ token_hash: tokenHash }).update({ is_revoked: true });

  if (req.user) {
    await auditLog({
      log_type: 'audit',
      action: 'LOGOUT',
      user_id: req.user.id,
      user_email: req.user.email,
      user_role: req.user.role,
      ip_address: req.ip,
    });
  }
  return { success: true };
}

async function getMe(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new AppError('User not found', 404);
  return {
    id: user.id,
    employee_id: user.employee_id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
    phone: user.phone,
    manager_id: user.manager_id,
    self_approve_limit: user.self_approve_limit,
    budget_limit: user.budget_limit,
    is_active: user.is_active,
    last_login_at: user.last_login_at,
  };
}

module.exports = {
  login,
  refresh,
  logout,
  getMe,
  hashPassword,
  comparePassword,
  hashToken,
  generateRefreshToken,
};
