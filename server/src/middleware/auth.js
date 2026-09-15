const jwt = require('jsonwebtoken');
const { db } = require('../models/db');
const { AppError, asyncHandler } = require('./errorHandler');

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

const ROLES = ['admin', 'inventory_manager', 'project_manager', 'manager', 'engineer', 'auditor'];

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user = await db('users').where({ id: decoded.id }).first();
    if (!user || !user.is_active) {
      return next(new AppError('User not found or inactive', 401));
    }
    req.user = user;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

function denyRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (roles.includes(req.user.role)) {
      return next(new AppError('Access denied for your role', 403));
    }
    next();
  };
}

function inventoryAccess(req, res, next) {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (req.user.role === 'engineer') {
    return next(new AppError('Engineers do not have access to inventory routes', 403));
  }
  next();
  return undefined;
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    db('users')
      .where({ id: decoded.id })
      .first()
      .then((user) => {
        req.user = user || null;
        next();
      })
      .catch(() => {
        req.user = null;
        next();
      });
  } catch {
    req.user = null;
    next();
  }
}

module.exports = {
  authenticate,
  authorize,
  denyRoles,
  inventoryAccess,
  optionalAuth,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ROLES,
};
