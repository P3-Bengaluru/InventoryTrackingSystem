const { AppError } = require('../middleware/errorHandler');

async function paginate(query, req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const offset = (page - 1) * limit;

  const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
  const [{ total: totalStr }] = await countQuery;
  const total = parseInt(totalStr, 10);
  const totalPages = Math.ceil(total / limit) || 0;

  const data = await query.limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

module.exports = { paginate };
