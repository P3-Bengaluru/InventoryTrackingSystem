const { AppError } = require('./errorHandler');

function validateBody(rules) {
  return (req, res, next) => {
    const errors = {};
    for (const field of Object.keys(rules)) {
      const rule = rules[field];
      const value = req.body[field];
      const result = validateField(field, value, rule, req.body);
      if (result) errors[field] = result;
    }
    if (Object.keys(errors).length > 0) {
      return next(new AppError('Validation failed', 422, errors));
    }
    next();
  };
}

function validateParams(rules) {
  return (req, res, next) => {
    const errors = {};
    for (const field of Object.keys(rules)) {
      const rule = rules[field];
      const value = req.params[field];
      const result = validateField(field, value, rule, req.params);
      if (result) errors[field] = result;
    }
    if (Object.keys(errors).length > 0) {
      return next(new AppError('Invalid parameters', 422, errors));
    }
    next();
  };
}

function validateQuery(rules) {
  return (req, res, next) => {
    const errors = {};
    for (const field of Object.keys(rules)) {
      const rule = rules[field];
      const value = req.query[field];
      const result = validateField(field, value, rule, req.query);
      if (result) errors[field] = result;
    }
    if (Object.keys(errors).length > 0) {
      return next(new AppError('Invalid query parameters', 422, errors));
    }
    next();
  };
}

function validateField(name, value, rule, source) {
  if (rule.required && (value === undefined || value === null || value === '')) {
    return rule.message || `${name} is required`;
  }
  if (value === undefined || value === null || value === '') {
    if (rule.default !== undefined) {
      source[name] = rule.default;
      return null;
    }
    return null;
  }
  let val = value;
  if (rule.type === 'string') {
    val = String(val).trim();
    source[name] = val;
    if (rule.minLen && val.length < rule.minLen) {
      return rule.message || `${name} must be at least ${rule.minLen} characters`;
    }
    if (rule.maxLen && val.length > rule.maxLen) {
      return rule.message || `${name} must be at most ${rule.maxLen} characters`;
    }
  } else if (rule.type === 'email') {
    val = String(val).trim().toLowerCase();
    source[name] = val;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(val)) {
      return rule.message || 'Invalid email format';
    }
  } else if (rule.type === 'number') {
    val = Number(val);
    if (isNaN(val)) return rule.message || `${name} must be a number`;
    source[name] = val;
    if (rule.min !== undefined && val < rule.min) {
      return rule.message || `${name} must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && val > rule.max) {
      return rule.message || `${name} must be at most ${rule.max}`;
    }
  } else if (rule.type === 'decimal') {
    val = parseFloat(val);
    if (isNaN(val)) return rule.message || `${name} must be a valid number`;
    source[name] = val;
    if (rule.min !== undefined && val < rule.min) {
      return rule.message || `${name} must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && val > rule.max) {
      return rule.message || `${name} must be at most ${rule.max}`;
    }
  } else if (rule.type === 'enum') {
    val = String(val);
    if (!rule.values.includes(val)) {
      return rule.message || `${name} must be one of: ${rule.values.join(', ')}`;
    }
    source[name] = val;
  } else if (rule.type === 'uuid') {
    val = String(val);
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(val)) return rule.message || `${name} must be a valid UUID`;
  } else if (rule.type === 'date') {
    val = String(val);
    const d = new Date(val);
    if (isNaN(d.getTime())) return rule.message || `${name} must be a valid date`;
  } else if (rule.type === 'boolean') {
    if (typeof val === 'string') {
      source[name] = val === 'true' || val === '1';
    } else {
      source[name] = Boolean(val);
    }
  } else if (rule.type === 'json') {
    if (typeof val === 'string') {
      try {
        source[name] = JSON.parse(val);
      } catch {
        return rule.message || `${name} must be valid JSON`;
      }
    }
  }
  return null;
}

module.exports = { validateBody, validateParams, validateQuery, validateField };
