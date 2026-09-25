const { asyncHandler } = require('../middleware/errorHandler');
const { paginate } = require('../utils/paginate');
const reallocationService = require('../services/reallocationService');

const list = asyncHandler(async (req, res) => {
  const query = reallocationService.getAll(req.query);
  const result = await paginate(query, req);
  res.json(result);
});

const get = asyncHandler(async (req, res) => {
  const item = await reallocationService.getById(req.params.id);
  res.json(item);
});

const create = asyncHandler(async (req, res) => {
  const created = await reallocationService.create(req.body, req);
  res.status(201).json(created);
});

const approve = asyncHandler(async (req, res) => {
  const updated = await reallocationService.approve(req.params.id, req);
  res.json(updated);
});

const reject = asyncHandler(async (req, res) => {
  const updated = await reallocationService.reject(req.params.id, req.body.rejection_reason, req);
  res.json(updated);
});

module.exports = { list, get, create, approve, reject };
